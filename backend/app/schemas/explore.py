from pydantic import BaseModel
from typing import List, Optional

class SearchSource(BaseModel):
    title: str
    url: str
    snippet: Optional[str] = None

class TermInspectRequest(BaseModel):
    term: str
    context: Optional[str] = None
    domain: Optional[str] = None
    page_number: Optional[int] = 1

class TermInspectResponse(BaseModel):
    term: str
    domain: str
    category: str
    definition: str
    deep_explanation: str
    pdf_context: Optional[str] = None
    formula: Optional[str] = None
    kind: str # "simple_concept" or "visual_concept"
    visual_suggested: bool
    visual_type: Optional[str] = None # "schematic", "flowchart", "anatomical", "molecular", "graph"

class DeepSearchRequest(BaseModel):
    term: str
    domain: Optional[str] = None
    context: Optional[str] = None

class DeepSearchResponse(BaseModel):
    term: str
    query_used: str
    summary: str
    key_findings: List[str]
    sources: List[SearchSource]
    grounding_used: bool
    academic_citation: Optional[str] = None

class VisualGenerateRequest(BaseModel):
    term: str
    domain: Optional[str] = None
    definition: Optional[str] = None
    visual_type: Optional[str] = None
    context: Optional[str] = None

class VisualGenerateResponse(BaseModel):
    term: str
    title: str
    visual_type: str
    svg_code: str # High quality, scientifically accurate responsive vector illustration
    prompt_used: str
    diagram_description: str
    labeled_components: List[str]
    color_scheme: str = "Clinical & Scientific Precision"
    real_image_url: Optional[str] = None
    real_image_title: Optional[str] = None
    real_image_caption: Optional[str] = None
    real_image_source_url: Optional[str] = None

class TranslationRequest(BaseModel):
    term: str
    target_language: str # "tamil", "hindi", "french", "spanish", "telugu", "english"
    summary: str
    key_findings: Optional[List[str]] = None
    context: Optional[str] = None
    domain: Optional[str] = None

class TranslationResponse(BaseModel):
    term: str
    target_language: str
    target_language_label: str
    translated_term: str
    translated_summary: str
    translated_key_findings: List[str]
    context_translation: Optional[str] = None
