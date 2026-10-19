import os
import io
import re
import fitz # PyMuPDF
from pathlib import Path
from typing import List, Dict, Any, Optional
from app.config import settings
from app.core.logger import logger
from app.schemas.document import PageInfo, DocumentMetadata, ContentBlock

class PDFService:
    def __init__(self):
        self.upload_dir = settings.UPLOAD_DIR
        self.cache_dir = settings.CACHE_DIR

    @staticmethod
    def sanitize_extracted_text(raw_text: str) -> str:
        """
        Cleans and normalizes raw text extracted from PDF fonts.
        Replaces corrupted font control characters (like \x02, \x03, nulls, non-breaking spaces,
        and Private Use Area glyphs) that cause boxes/tofu glyphs, and ensures proper spacing between words.
        """
        if not raw_text:
            return ""

        # Normalize typographic single and double quotes to standard ASCII
        normalized = raw_text.replace('\u2018', "'").replace('\u2019', "'").replace('\u201c', '"').replace('\u201d', '"')

        # Replace control chars, non-standard font spaces (\x02, \x03, \xa0, nulls, PUA glyphs) with regular space
        cleaned = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f\xa0\u200b\ufeff\ue000-\uf8ff\U000f0000-\U000fffff\U00100000-\U0010ffff\x02\x03\ufffd]', ' ', normalized)

        # Clean each line: collapse multiple horizontal spaces/tabs to a single space
        lines = []
        for line in cleaned.splitlines():
            clean_line = re.sub(r'[ \t]{2,}', ' ', line).strip()
            lines.append(clean_line)

        return '\n'.join(lines)

    def extract_structured_page(self, page) -> tuple[str, List[ContentBlock]]:
        """
        Extracts structured blocks (titles, headings, subheadings, key_values, lists, paragraphs)
        using PyMuPDF font metrics and geometry. Preserves true document hierarchy.
        """
        try:
            d = page.get_text("dict")
        except Exception:
            d = {}

        raw_blocks = d.get("blocks", [])

        # Compute baseline body font size across the page
        font_sizes = []
        for b in raw_blocks:
            if "lines" in b:
                for l in b["lines"]:
                    for s in l.get("spans", []):
                        txt = s.get("text", "").strip()
                        if len(txt) > 3:
                            font_sizes.append(round(s.get("size", 12.0), 1))

        base_size = 11.5
        if font_sizes:
            font_sizes.sort()
            base_size = font_sizes[len(font_sizes) // 2]

        content_blocks: List[ContentBlock] = []
        formatted_paragraphs: List[str] = []

        for b_idx, b in enumerate(raw_blocks):
            if "lines" not in b:
                continue

            block_lines: List[str] = []
            block_spans: List[Dict[str, Any]] = []
            for l in b["lines"]:
                raw_line = "".join(s.get("text", "") for s in l.get("spans", []))
                cleaned_line = self.sanitize_extracted_text(raw_line).strip()
                if cleaned_line:
                    block_lines.append(cleaned_line)
                    block_spans.extend(l.get("spans", []))

            if not block_lines:
                continue

            first_span = block_spans[0] if block_spans else {}
            f_size = round(first_span.get("size", base_size), 1)
            f_name = first_span.get("font", "").lower()
            f_flags = first_span.get("flags", 0)
            is_bold = bool(f_flags & 2) or any(k in f_name for k in ["bold", "black", "heavy", "medium", "semibold"])

            full_text = " ".join(block_lines).strip()

            # Match common structural patterns
            num_section_match = re.match(r"^(\d+(?:\.\d+)*\.?\s+[A-Za-z0-9\s&/\-_]{3,60}:?)(?:\s+(.*))?$", full_text)
            kv_match = re.match(r"^([A-Za-z0-9\s&/\-_]{2,30}):\s+(.+)$", full_text)
            is_all_caps = bool(re.match(r"^[A-Z0-9\s&/\-_:,]{4,60}$", full_text))
            has_bullet = any(l.lstrip().startswith(("●", "•", "-", "*", "–")) for l in block_lines)
            is_short_title = len(full_text) < 70 and not full_text.endswith((".", ";", ","))

            # Classification
            if f_size >= base_size * 1.5 or (f_size >= base_size * 1.3 and is_bold and b_idx <= 2):
                content_blocks.append(ContentBlock(type="title", text=full_text, level=1))
                formatted_paragraphs.append(f"# {full_text}")
            elif f_size >= base_size * 1.25 or (is_bold and is_short_title):
                content_blocks.append(ContentBlock(type="heading", text=full_text, level=2))
                formatted_paragraphs.append(f"## {full_text}")
            elif num_section_match and len(num_section_match.group(1)) < 60:
                heading_title = num_section_match.group(1).rstrip(":").strip()
                rest = (num_section_match.group(2) or "").strip()
                content_blocks.append(ContentBlock(type="heading", text=heading_title, level=2))
                formatted_paragraphs.append(f"## {heading_title}")
                if rest:
                    content_blocks.append(ContentBlock(type="paragraph", text=rest))
                    formatted_paragraphs.append(rest)
            elif is_bold and len(full_text) < 65 and not full_text.endswith("."):
                content_blocks.append(ContentBlock(type="subheading", text=full_text, level=3))
                formatted_paragraphs.append(f"### {full_text}")
            elif kv_match and len(kv_match.group(1)) < 28 and len(full_text) < 160:
                k = kv_match.group(1).strip()
                v = kv_match.group(2).strip()
                content_blocks.append(ContentBlock(type="key_value", key=k, value=v, text=full_text))
                formatted_paragraphs.append(f"**{k}**: {v}")
            elif has_bullet:
                for l in block_lines:
                    is_bullet_line = l.lstrip().startswith(("●", "•", "-", "*", "–"))
                    clean_l = re.sub(r"^[●•\-*–\s]+", "", l).strip()
                    if is_bullet_line and clean_l:
                        content_blocks.append(ContentBlock(type="list_item", text=clean_l))
                        formatted_paragraphs.append(f"● {clean_l}")
                    elif clean_l:
                        if content_blocks and content_blocks[-1].type == "list_item":
                            content_blocks[-1].text += f" {clean_l}"
                            if formatted_paragraphs:
                                formatted_paragraphs[-1] += f" {clean_l}"
                        else:
                            content_blocks.append(ContentBlock(type="list_item", text=clean_l))
                            formatted_paragraphs.append(f"● {clean_l}")
            elif is_all_caps and len(full_text) < 50:
                content_blocks.append(ContentBlock(type="heading", text=full_text, level=2))
                formatted_paragraphs.append(f"## {full_text}")
            else:
                content_blocks.append(ContentBlock(type="paragraph", text=full_text))
                formatted_paragraphs.append(full_text)

        # Fallback if no blocks extracted
        if not content_blocks:
            raw_text = self.sanitize_extracted_text(page.get_text("text") or "")
            paragraphs = [p.strip() for p in raw_text.split("\n\n") if p.strip()]
            for p in paragraphs:
                content_blocks.append(ContentBlock(type="paragraph", text=p))
            formatted_text = "\n\n".join(paragraphs) if paragraphs else raw_text
        else:
            formatted_text = "\n\n".join(formatted_paragraphs)

        return formatted_text, content_blocks

    def extract_document(self, file_path: str, filename: str, doc_id: str, is_sample: bool = False) -> Dict[str, Any]:
        """
        Extracts full text and per-page content from a PDF using PyMuPDF (fitz).
        Applies thorough character sanitization and renders page preview images.
        """
        doc = fitz.open(file_path)
        total_pages = len(doc)
        pages_info: List[PageInfo] = []
        full_text_chunks: List[str] = []
        total_words = 0

        # Create doc-specific cache directory for rendered page images
        doc_cache_dir = self.cache_dir / doc_id
        doc_cache_dir.mkdir(parents=True, exist_ok=True)

        for page_idx in range(total_pages):
            page_num = page_idx + 1
            page = doc[page_idx]

            formatted_text, blocks = self.extract_structured_page(page)

            words = len(formatted_text.split())
            total_words += words
            full_text_chunks.append(f"--- [Page {page_num}] ---\n{formatted_text}")

            # Render page as crisp PNG image for high-fidelity interactive PDF viewer
            image_path = doc_cache_dir / f"page_{page_num}.png"
            if not image_path.exists():
                pix = page.get_pixmap(dpi=144)
                pix.save(str(image_path))

            pages_info.append(
                PageInfo(
                    page_number=page_num,
                    text=formatted_text,
                    char_count=len(formatted_text),
                    word_count=words,
                    image_url=f"/api/documents/page/{doc_id}/{page_num}/image",
                    blocks=blocks
                )
            )

        doc.close()

        file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0

        metadata = DocumentMetadata(
            id=doc_id,
            filename=filename,
            file_size_bytes=file_size,
            total_pages=total_pages,
            total_words=total_words,
            created_at=str(os.path.getctime(file_path) if os.path.exists(file_path) else ""),
            is_sample=is_sample
        )

        all_text = "\n\n".join(full_text_chunks)

        return {
            "metadata": metadata,
            "pages": pages_info,
            "full_text": all_text,
            "preview_text": all_text[:2000]
        }

    def render_page_image(self, file_path: str, page_number: int) -> bytes:
        """Render a single page to PNG bytes"""
        doc = fitz.open(file_path)
        if page_number < 1 or page_number > len(doc):
            doc.close()
            raise ValueError(f"Page number {page_number} out of range (1-{len(doc)})")
        
        page = doc[page_number - 1]
        pix = page.get_pixmap(dpi=150)
        img_bytes = pix.tobytes("png")
        doc.close()
        return img_bytes

    def cleanup_document(self, doc_id: str, file_path: Optional[str] = None):
        """Clean up PDF file and rendered cache"""
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                logger.error(f"[PDF CLEANUP] Error removing PDF file {file_path}: {e}")

        doc_cache_dir = self.cache_dir / doc_id
        if doc_cache_dir.exists():
            try:
                for f in doc_cache_dir.glob("*.png"):
                    f.unlink()
                doc_cache_dir.rmdir()
            except Exception as e:
                logger.error(f"[PDF CLEANUP] Error removing cache dir {doc_cache_dir}: {e}")

pdf_service = PDFService()
