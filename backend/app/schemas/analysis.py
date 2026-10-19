from pydantic import BaseModel, Field
from typing import List, Optional, Literal

# Supported domains
DomainType = Literal[
    "Medical & Healthcare",
    "Education & Pedagogy",
    "Industrial & Supply Chain",
    "Finance & Economics",
    "Mathematics & Statistics",
    "Scientific Research (Physics & Chemistry)",
    "General / Interdisciplinary"
]

TermKind = str

class SpecializedTerm(BaseModel):
    id: str
    term: str
    category: str # e.g. "Pathology", "Formula / Notation", "Valuation Metric", "Chemical Compound"
    short_definition: str
    context_sentence: Optional[str] = None
    page_number: Optional[int] = 1
    kind: str = "simple_concept" # LLM classifies whether it is visual or simple
    visual_reasoning: Optional[str] = None # Why this concept is suited for a visual schematic vs text
    formula: Optional[str] = None # For math/finance/physics if applicable
    importance_score: int = Field(default=3, ge=1, le=5) # 1-5 rating of conceptual importance

class KeyTakeaway(BaseModel):
    title: str
    description: str
    tag: str

class CriticalConcept(BaseModel):
    name: str
    significance: str
    domain_relevance: str

class DocumentSummary(BaseModel):
    document_id: str
    detected_domain: str
    domain_badge_color: str
    executive_summary: str
    core_thesis: str
    critical_concepts: List[CriticalConcept]
    key_takeaways: List[KeyTakeaway]
    specialized_terms: List[SpecializedTerm]
    total_terms_detected: int
    visual_terms_count: int
    simple_terms_count: int
    reading_time_minutes: int
    complexity_level: str = "Intermediate"

class AnalysisStatusResponse(BaseModel):
    is_analyzed: bool
    document_id: Optional[str] = None
    summary: Optional[DocumentSummary] = None
    error: Optional[str] = None
