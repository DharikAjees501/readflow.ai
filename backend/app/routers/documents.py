import uuid
import os
from fastapi import APIRouter, UploadFile, File, HTTPException, Response
from typing import Dict, Any, Optional
from app.config import settings
from app.services.pdf_service import pdf_service
from app.schemas.document import DocumentDetailResponse

router = APIRouter(prefix="/api/documents", tags=["documents"])

# In-memory store for active session document
class DocumentState:
    def __init__(self):
        self.active_doc_id: Optional[str] = None
        self.active_file_path: Optional[str] = None
        self.active_filename: Optional[str] = None
        self.active_data: Optional[Dict[str, Any]] = None

from app.core.logger import logger

doc_state = DocumentState()

@router.post("/upload", response_model=DocumentDetailResponse)
async def upload_pdf(file: UploadFile = File(...)):
    """
    Step 1: Upload any PDF. Replaces or initializes the active file dynamically.
    """
    logger.info(f"[POST /api/documents/upload] Extract request received for file: '{file.filename}'")
    if not file.filename.lower().endswith(".pdf"):
        logger.warning(f"[POST /api/documents/upload] Rejected non-PDF file: '{file.filename}'")
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    # Clean up previous active document if one was present
    if doc_state.active_doc_id:
        pdf_service.cleanup_document(doc_state.active_doc_id, doc_state.active_file_path)

    doc_id = f"doc_{uuid.uuid4().hex[:10]}"
    file_path = settings.UPLOAD_DIR / f"{doc_id}_{file.filename}"

    # Save uploaded file
    try:
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        logger.info(f"[POST /api/documents/upload] File successfully saved: {file_path.name} ({len(content)} bytes)")
    except Exception as e:
        logger.error(f"[POST /api/documents/upload] Failed to save file {file.filename}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Extract text and render pages with PyMuPDF
    try:
        data = pdf_service.extract_document(str(file_path), file.filename, doc_id, is_sample=False)
        doc_state.active_doc_id = doc_id
        doc_state.active_file_path = str(file_path)
        doc_state.active_filename = file.filename
        doc_state.active_data = data
        logger.info(f"[POST /api/documents/upload] Extraction complete: {data['metadata'].total_pages} pages, {data['metadata'].total_words} words extracted.")

        # Reset analysis state for the new document so stale results are never shown
        try:
            from app.routers.analysis import analysis_state
            analysis_state.reset()
        except Exception:
            pass

        return DocumentDetailResponse(
            metadata=data["metadata"],
            pages=data["pages"],
            extracted_text_preview=data["preview_text"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract PDF: {str(e)}")

@router.get("/active", response_model=Optional[DocumentDetailResponse])
async def get_active_document():
    """Retrieve currently active document details"""
    if not doc_state.active_doc_id or not doc_state.active_data:
        return None

    return DocumentDetailResponse(
        metadata=doc_state.active_data["metadata"],
        pages=doc_state.active_data["pages"],
        extracted_text_preview=doc_state.active_data["preview_text"]
    )

@router.delete("/active")
async def delete_active_document():
    """
    Step 1 Requirement: Users can delete the active file dynamically at any time.
    """
    if not doc_state.active_doc_id:
        return {"status": "success", "message": "No active document was loaded."}

    doc_id = doc_state.active_doc_id
    file_path = doc_state.active_file_path

    # Clean up cache and storage
    pdf_service.cleanup_document(doc_id, file_path)

    # Reset in-memory state
    doc_state.active_doc_id = None
    doc_state.active_file_path = None
    doc_state.active_filename = None
    doc_state.active_data = None

    return {"status": "success", "message": f"Document {doc_id} successfully deleted."}

@router.get("/page/{doc_id}/{page_num}/image")
async def get_page_image(doc_id: str, page_num: int):
    """Retrieve rendered high-resolution PNG image of a page"""
    image_path = settings.CACHE_DIR / doc_id / f"page_{page_num}.png"
    if image_path.exists():
        with open(image_path, "rb") as f:
            return Response(content=f.read(), media_type="image/png")

    # If cache not found but doc active, render on the fly
    if doc_state.active_doc_id == doc_id and doc_state.active_file_path:
        try:
            img_bytes = pdf_service.render_page_image(doc_state.active_file_path, page_num)
            return Response(content=img_bytes, media_type="image/png")
        except Exception as e:
            raise HTTPException(status_code=404, detail=f"Could not render page: {str(e)}")

    raise HTTPException(status_code=404, detail="Page image not found.")
