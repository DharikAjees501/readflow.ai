from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.config import settings
from app.services.gemini_service import gemini_service
from app.routers.analysis import analysis_state
from app.schemas.explore import (
    TermInspectRequest,
    TermInspectResponse,
    DeepSearchRequest,
    DeepSearchResponse,
    VisualGenerateRequest,
    VisualGenerateResponse,
    TranslationRequest,
    TranslationResponse,
)
from app.services.translation_service import translation_service

router = APIRouter(prefix="/api/explore", tags=["explore"])

class ApiKeyUpdate(BaseModel):
    api_key: str

@router.get("/status")
async def get_gemini_status():
    """Check if Gemini API is configured with an active key and return split model matrix"""
    return {
        "configured": gemini_service.is_configured(),
        "model_architecture": {
            "image_generation": settings.IMAGE_MODELS,
            "web_search": settings.SEARCH_MODELS,
            "document_synthesis": settings.SYNTHESIS_MODELS,
            "embeddings": settings.EMBEDDING_MODELS
        },
        "grounding_available": True
    }

@router.post("/set-key")
async def set_gemini_key(body: ApiKeyUpdate):
    """Dynamically set or update Gemini API Key"""
    if not body.api_key.strip():
        raise HTTPException(status_code=400, detail="API key cannot be empty.")
    success = gemini_service.update_api_key(body.api_key.strip())
    return {
        "success": success,
        "configured": gemini_service.is_configured()
    }

@router.post("/inspect", response_model=TermInspectResponse)
async def inspect_term(req: TermInspectRequest):
    """
    Step 3: Lightweight inline term inspection.
    Loads definition, context, and formula immediately upon term selection.
    DOES NOT automatically run expensive image generation or web search grounding.
    """
    # Check if term was already classified in analysis
    matched_term = None
    domain = req.domain or "General"
    
    if analysis_state.current_summary:
        domain = analysis_state.current_summary.detected_domain
        for t in analysis_state.current_summary.specialized_terms:
            if t.term.lower() == req.term.lower() or req.term.lower() in t.term.lower():
                matched_term = t
                break

    if matched_term:
        return TermInspectResponse(
            term=matched_term.term,
            domain=domain,
            category=matched_term.category,
            definition=matched_term.short_definition,
            deep_explanation=f"{matched_term.short_definition} In this document context: {matched_term.context_sentence or 'Key foundational building block.'}",
            pdf_context=matched_term.context_sentence,
            formula=matched_term.formula,
            kind=matched_term.kind,
            visual_suggested=matched_term.kind == "visual_concept",
            visual_type=gemini_service._detect_visual_type(matched_term.term, domain)
        )

    # General term inspection fallback
    v_type = gemini_service._detect_visual_type(req.term, domain)
    is_visual = any(w in req.term.lower() for w in ["diagram", "cycle", "loop", "structure", "curve", "orbit", "flow", "mechanism", "anatomy"])
    
    return TermInspectResponse(
        term=req.term,
        domain=domain,
        category="Specialized Vocabulary",
        definition=f"A key operational concept in {domain} governing standard principles and analytical methods.",
        deep_explanation=f"{req.term} is a critical component referenced in the text. In academic and industrial practice, it serves as a foundational analytical construct.",
        pdf_context=req.context,
        formula=None,
        kind="visual_concept" if is_visual else "simple_concept",
        visual_suggested=is_visual,
        visual_type=v_type
    )

from app.core.logger import logger

@router.post("/deep-search", response_model=DeepSearchResponse)
async def trigger_deep_search(req: DeepSearchRequest):
    """
    Step 3 & 4: STRICTLY ON-DEMAND Web Search Lookup powered by Gemini Grounding.
    Triggers ONLY when the user clicks 'Deep Search / Web Insights'.
    """
    logger.info(f"[POST /api/explore/deep-search] Web search requested for term: '{req.term}' (Domain: '{req.domain or 'General'}')")
    try:
        result = await gemini_service.perform_deep_search(
            term=req.term,
            domain=req.domain,
            context=req.context
        )
        logger.info(f"[POST /api/explore/deep-search] Web search succeeded for '{req.term}': {len(result.sources)} sources retrieved, Grounding={result.grounding_used}")
        return result
    except Exception as e:
        logger.error(f"[POST /api/explore/deep-search] Web search failed for '{req.term}': {e}")
        raise HTTPException(status_code=500, detail=f"Deep search failed: {str(e)}")

@router.post("/generate-visual", response_model=VisualGenerateResponse)
async def trigger_visual_generation(req: VisualGenerateRequest):
    """
    Step 3 & 4: STRICTLY ON-DEMAND AI Visual Schematic / Vector Illustration Generation.
    Triggers ONLY when the user clicks 'Generate Image / Schematic'.
    Crafts a cartoony vector diagram adhering to the pastel palette (#FCE2DB, #F1C6D3, #E4A3D4, #C295D8).
    """
    logger.info(f"[POST /api/explore/generate-visual] AI visual generation requested for term: '{req.term}' (Type: '{req.visual_type or 'auto'}')")
    # Extract grounding context from request or active document analysis
    doc_context = req.context
    if not doc_context and analysis_state.current_summary:
        for t in analysis_state.current_summary.specialized_terms:
            if t.term.lower() == req.term.lower() or req.term.lower() in t.term.lower():
                doc_context = t.context_sentence
                break

    try:
        result = await gemini_service.generate_visual_illustration(
            term=req.term,
            domain=req.domain,
            definition=req.definition,
            visual_type=req.visual_type,
            context=doc_context
        )
        logger.info(f"[POST /api/explore/generate-visual] Visual generation succeeded for '{req.term}': {len(result.labeled_components)} components labeled, Real Image={'Yes' if result.real_image_url else 'No'}.")
        return result
    except Exception as e:
        logger.error(f"[POST /api/explore/generate-visual] Visual generation failed for '{req.term}': {e}")
        raise HTTPException(status_code=500, detail=f"Visual generation failed: {str(e)}")

@router.post("/translate", response_model=TranslationResponse)
async def translate_term_explanation(req: TranslationRequest):
    """
    Translates term explanation and key findings into Tamil, Hindi, French, Spanish, or Telugu
    with scientific precision and zero meaning distortion.
    """
    try:
        return await translation_service.translate_explanation(req)
    except Exception as e:
        logger.error(f"[POST /api/explore/translate] Translation failed for '{req.term}' ({req.target_language}): {e}")
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")

