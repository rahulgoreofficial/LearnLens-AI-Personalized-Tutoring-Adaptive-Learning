from typing import List, Dict, Any
from pathlib import Path
import pymupdf

def parse_pdf(file_path: Path) -> List[Dict[str, Any]]:
    """
    Extracts text from PDF documents using PyMuPDF while strictly preserving
    the exact 1-indexed page number for provenance.
    """
    doc = pymupdf.open(str(file_path))
    pages_data: List[Dict[str, Any]] = []

    for page_idx in range(len(doc)):
        page = doc[page_idx]
        text = page.get_text("text").strip()
        if not text:
            # Try block extraction or fallback
            blocks = page.get_text("blocks")
            text = "\n".join([b[4].strip() for b in blocks if len(b) > 4 and b[4].strip()])
        
        page_number = page_idx + 1
        pages_data.append({
            "page_number": page_number,
            "locator": f"Page {page_number}",
            "text": text or f"[Empty Page {page_number}]",
        })

    doc.close()
    return pages_data
