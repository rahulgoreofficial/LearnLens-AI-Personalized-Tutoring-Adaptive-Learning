import uuid
from typing import List, Dict, Any
from app.models.schemas import DocumentChunk
from app.config import settings

def chunk_segments(
    material_id: str,
    material_title: str,
    doc_type: str,
    segments: List[Dict[str, Any]],
    chunk_size: int = settings.CHUNK_SIZE,
    chunk_overlap: int = settings.CHUNK_OVERLAP,
) -> List[DocumentChunk]:
    """
    Chunks parsed segments while strictly retaining original provenance metadata
    (page numbers, slide numbers, timestamps, section headers).
    """
    chunks: List[DocumentChunk] = []

    for seg in segments:
        text = seg.get("text", "").strip()
        if not text:
            continue

        locator = seg.get("locator", "Section 1")
        page_number = seg.get("page_number")
        slide_number = seg.get("slide_number")
        timestamp = seg.get("timestamp")

        # If text fits comfortably in one chunk
        if len(text) <= chunk_size + 150:
            chunks.append(
                DocumentChunk(
                    chunk_id=str(uuid.uuid4()),
                    material_id=material_id,
                    material_title=material_title,
                    doc_type=doc_type,
                    locator=locator,
                    page_number=page_number,
                    slide_number=slide_number,
                    timestamp=timestamp,
                    text=text,
                    char_count=len(text),
                )
            )
        else:
            # Split into sub-chunks while maintaining the exact locator
            start = 0
            part = 1
            while start < len(text):
                end = min(start + chunk_size, len(text))
                # Break at next space or period if possible
                if end < len(text):
                    last_space = text.rfind(" ", start + chunk_size // 2, end)
                    if last_space != -1:
                        end = last_space

                sub_text = text[start:end].strip()
                if sub_text:
                    sub_locator = f"{locator} (part {part})" if part > 1 else locator
                    chunks.append(
                        DocumentChunk(
                            chunk_id=str(uuid.uuid4()),
                            material_id=material_id,
                            material_title=material_title,
                            doc_type=doc_type,
                            locator=sub_locator,
                            page_number=page_number,
                            slide_number=slide_number,
                            timestamp=timestamp,
                            text=sub_text,
                            char_count=len(sub_text),
                        )
                    )
                    part += 1

                start = end - chunk_overlap if end - chunk_overlap > start else end
                if start >= len(text):
                    break

    return chunks
