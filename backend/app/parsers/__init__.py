from pathlib import Path
from typing import List, Dict, Any, Tuple
from app.parsers.pdf_parser import parse_pdf
from app.parsers.pptx_parser import parse_pptx
from app.parsers.transcript_parser import parse_transcript
from app.parsers.text_parser import parse_text_or_markdown
from app.parsers.youtube_parser import parse_youtube_transcript

def parse_document(file_path: Path) -> Tuple[str, List[Dict[str, Any]]]:
    """
    Dispatches file to the appropriate provenance-preserving parser based on extension.
    Returns (doc_type, list_of_segments).
    """
    ext = file_path.suffix.lower()
    
    if ext == ".pdf":
        return "pdf", parse_pdf(file_path)
    elif ext == ".pptx":
        return "pptx", parse_pptx(file_path)
    elif ext in (".srt", ".vtt"):
        return "transcript", parse_transcript(file_path)
    elif ext in (".txt", ".md"):
        return "text", parse_text_or_markdown(file_path)
    else:
        raise ValueError(f"Unsupported file format: {ext}. Supported formats are PDF, PPTX, TXT, MD, SRT, VTT.")
