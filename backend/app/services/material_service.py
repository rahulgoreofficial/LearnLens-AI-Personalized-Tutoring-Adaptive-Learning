import json
import uuid
import datetime
import re
from pathlib import Path
from typing import List, Optional, Dict, Any

from app.config import settings
from app.models.schemas import MaterialMetadata, DocumentChunk
from app.parsers import parse_document
from app.parsers.youtube_parser import parse_youtube_transcript
from app.retrieval.chunker import chunk_segments
from app.retrieval.engine import retrieval_engine

MATERIALS_FILE = settings.DATA_DIR / "materials.json"
CHUNKS_FILE = settings.DATA_DIR / "chunks.json"

def _extract_topics(text: str) -> List[str]:
    """Extract heuristic topic keywords from document content."""
    common_stops = {"the", "and", "for", "with", "that", "this", "from", "have", "are", "which"}
    # Look for capitalized terminology or common technical concepts
    words = re.findall(r"\b[A-Z][a-zA-Z]{3,}\b", text)
    freq: Dict[str, int] = {}
    for w in words:
        w_lower = w.lower()
        if w_lower not in common_stops:
            freq[w] = freq.get(w, 0) + 1
    sorted_words = sorted(freq.items(), key=lambda x: x[1], reverse=True)
    return [w for w, _ in sorted_words[:6]]

class MaterialService:
    def __init__(self):
        self.materials: Dict[str, MaterialMetadata] = {}
        self.chunks: List[DocumentChunk] = []
        self._load_from_disk()

    def _load_from_disk(self):
        if MATERIALS_FILE.exists():
            try:
                data = json.loads(MATERIALS_FILE.read_text(encoding="utf-8"))
                self.materials = {m["id"]: MaterialMetadata(**m) for m in data}
            except Exception as e:
                print(f"[Error loading materials]: {e}")
                self.materials = {}

        if CHUNKS_FILE.exists():
            try:
                data = json.loads(CHUNKS_FILE.read_text(encoding="utf-8"))
                self.chunks = [DocumentChunk(**c) for c in data]
                retrieval_engine.index_chunks(self.chunks)
            except Exception as e:
                print(f"[Error loading chunks]: {e}")
                self.chunks = []
                retrieval_engine.index_chunks([])

        # Auto-seed sample materials if store is empty
        if not self.materials:
            self.seed_sample_materials()

    def seed_sample_materials(self):
        sample_dir = settings.BASE_DIR.parent / "sample_data"
        if not sample_dir.exists():
            return
        for file_path in sample_dir.iterdir():
            if file_path.suffix.lower() in settings.ALLOWED_EXTENSIONS:
                try:
                    # Copy to temp file and upload
                    import tempfile, shutil
                    with tempfile.NamedTemporaryFile(delete=False, suffix=file_path.suffix) as tmp:
                        shutil.copyfile(file_path, tmp.name)
                        tmp_path = Path(tmp.name)
                    self.add_uploaded_file(tmp_path, file_path.name)
                except Exception as ex:
                    print(f"[Error seeding {file_path.name}]: {ex}")

    def _save_to_disk(self):
        MATERIALS_FILE.parent.mkdir(parents=True, exist_ok=True)
        materials_data = [m.model_dump() for m in self.materials.values()]
        MATERIALS_FILE.write_text(json.dumps(materials_data, indent=2), encoding="utf-8")

        chunks_data = [c.model_dump() for c in self.chunks]
        CHUNKS_FILE.write_text(json.dumps(chunks_data, indent=2), encoding="utf-8")

        # Update retrieval engine
        retrieval_engine.index_chunks(self.chunks)

    def list_materials(self) -> List[MaterialMetadata]:
        return list(self.materials.values())

    def get_material(self, material_id: str) -> Optional[MaterialMetadata]:
        return self.materials.get(material_id)

    def get_material_chunks(self, material_id: str) -> List[DocumentChunk]:
        return [c for c in self.chunks if c.material_id == material_id]

    def add_uploaded_file(self, temp_path: Path, original_filename: str) -> MaterialMetadata:
        ext = Path(original_filename).suffix.lower()
        if ext not in settings.ALLOWED_EXTENSIONS:
            raise ValueError(f"Unsupported file type: {ext}. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}")

        material_id = str(uuid.uuid4())
        saved_filename = f"{material_id}_{original_filename}"
        dest_path = settings.UPLOAD_DIR / saved_filename
        
        # Move or write file
        temp_path.replace(dest_path)
        file_size = dest_path.stat().st_size

        # Parse document preserving exact provenance
        doc_type, segments = parse_document(dest_path)
        
        title = Path(original_filename).stem.replace("_", " ").title()
        
        # Calculate totals
        total_pages_or_slides = None
        total_duration = None
        if doc_type == "pdf":
            total_pages_or_slides = max([s.get("page_number", 1) for s in segments], default=1)
        elif doc_type == "pptx":
            total_pages_or_slides = max([s.get("slide_number", 1) for s in segments], default=1)
        elif doc_type == "transcript":
            if segments:
                last_loc = segments[-1].get("locator", "")
                total_duration = last_loc.split("-")[-1].strip() if "-" in last_loc else "Lecture"

        # Chunk with provenance
        new_chunks = chunk_segments(
            material_id=material_id,
            material_title=title,
            doc_type=doc_type,
            segments=segments,
        )

        all_text = " ".join([c.text for c in new_chunks])
        topics = _extract_topics(all_text)

        material = MaterialMetadata(
            id=material_id,
            title=title,
            filename=original_filename,
            doc_type=doc_type,
            file_size=file_size,
            upload_date=datetime.datetime.now().strftime("%Y-%m-%d %H:%M"),
            total_pages_or_slides=total_pages_or_slides,
            total_duration=total_duration,
            chunk_count=len(new_chunks),
            topics=topics,
        )

        self.materials[material_id] = material
        self.chunks.extend(new_chunks)
        self._save_to_disk()
        return material

    def import_youtube(self, url: str, custom_title: Optional[str] = None) -> MaterialMetadata:
        material_id = str(uuid.uuid4())
        video_id, segments = parse_youtube_transcript(url)

        title = custom_title or f"YouTube Lecture ({video_id})"
        doc_type = "youtube"

        new_chunks = chunk_segments(
            material_id=material_id,
            material_title=title,
            doc_type=doc_type,
            segments=segments,
        )

        total_duration = segments[-1].get("locator", "").split("-")[-1].strip() if segments else "Video"
        all_text = " ".join([c.text for c in new_chunks])
        topics = _extract_topics(all_text)

        material = MaterialMetadata(
            id=material_id,
            title=title,
            filename=f"youtube_{video_id}",
            doc_type=doc_type,
            file_size=0,
            upload_date=datetime.datetime.now().strftime("%Y-%m-%d %H:%M"),
            total_duration=total_duration,
            chunk_count=len(new_chunks),
            topics=topics,
        )

        self.materials[material_id] = material
        self.chunks.extend(new_chunks)
        self._save_to_disk()
        return material

    def delete_material(self, material_id: str) -> bool:
        if material_id in self.materials:
            del self.materials[material_id]
            self.chunks = [c for c in self.chunks if c.material_id != material_id]
            self._save_to_disk()
            return True
        return False

material_service = MaterialService()
