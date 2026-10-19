from fastapi import APIRouter, HTTPException
from typing import Optional
from app.routers.documents import doc_state
from app.services.gemini_service import gemini_service
from app.schemas.analysis import DocumentSummary, AnalysisStatusResponse

router = APIRouter(prefix="/api/analysis", tags=["analysis"])

class AnalysisState:
    def __init__(self):
        self.current_summary: Optional[DocumentSummary] = None
        self.analyzed_doc_id: Optional[str] = None

    def reset(self):
        self.current_summary = None
        self.analyzed_doc_id = None

from app.core.logger import logger

analysis_state = AnalysisState()

@router.post("/analyze", response_model=DocumentSummary)
async def analyze_active_document():
    """
    Step 2: Smart Extraction & Classification Panel (Left Side).
    FastAPI passes PyMuPDF extracted text to Gemini or the real-time NLP text extractor.
    Eliminates fluff, isolates critical concepts, detects multi-domain specialized terms,
    and tags visual vs simple concepts.
    """
    if not doc_state.active_doc_id or not doc_state.active_data:
        logger.warning("[POST /api/analysis/analyze] Request failed: No active document loaded.")
        raise HTTPException(status_code=400, detail="No active PDF document uploaded. Please upload a PDF first.")

    doc_id = doc_state.active_doc_id
    if analysis_state.analyzed_doc_id == doc_id and analysis_state.current_summary:
        logger.info(f"[POST /api/analysis/analyze] Returning pre-warmed cached analysis for document '{doc_id}' (0.00s)")
        return analysis_state.current_summary

    full_text = doc_state.active_data["full_text"]
    filename = doc_state.active_filename or "document.pdf"
    logger.info(f"[POST /api/analysis/analyze] Extracting structured insights and terms for document '{doc_id}' ({filename})")

    try:
        summary = await gemini_service.analyze_document(doc_id, full_text, filename)
        analysis_state.current_summary = summary
        analysis_state.analyzed_doc_id = doc_id
        logger.info(f"[POST /api/analysis/analyze] Analysis complete for '{doc_id}': Domain '{summary.detected_domain}', {len(summary.specialized_terms)} specialized terms.")
        return summary
    except Exception as e:
        logger.error(f"[POST /api/analysis/analyze] Analysis failed for '{doc_id}': {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.get("/status", response_model=AnalysisStatusResponse)
async def get_analysis_status():
    """Returns current analysis status and summary if already generated"""
    if not doc_state.active_doc_id:
        return AnalysisStatusResponse(is_analyzed=False)

    if analysis_state.analyzed_doc_id == doc_state.active_doc_id and analysis_state.current_summary:
        return AnalysisStatusResponse(
            is_analyzed=True,
            document_id=doc_state.active_doc_id,
            summary=analysis_state.current_summary
        )

    return AnalysisStatusResponse(is_analyzed=False, document_id=doc_state.active_doc_id)
