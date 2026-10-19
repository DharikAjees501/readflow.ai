from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class ContentBlock(BaseModel):
    type: str # "title" | "heading" | "subheading" | "key_value" | "list_item" | "paragraph"
    text: str
    level: Optional[int] = None
    key: Optional[str] = None
    value: Optional[str] = None

class PageInfo(BaseModel):
    page_number: int
    text: str
    char_count: int
    word_count: int
    image_url: Optional[str] = None
    blocks: Optional[List[ContentBlock]] = None

class DocumentMetadata(BaseModel):
    id: str
    filename: str
    file_size_bytes: int
    total_pages: int
    total_words: int
    created_at: str
    domain_hint: Optional[str] = None
    is_sample: bool = False

class DocumentDetailResponse(BaseModel):
    metadata: DocumentMetadata
    pages: List[PageInfo]
    extracted_text_preview: str
