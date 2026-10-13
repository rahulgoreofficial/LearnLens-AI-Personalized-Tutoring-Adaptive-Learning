import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from project root or backend directory
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR.parent / ".env")

class Settings:
    PROJECT_NAME: str = "LearnLens AI"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")
    
    BASE_DIR: Path = BASE_DIR
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    DATA_DIR: Path = BASE_DIR / "data"
    
    MAX_FILE_SIZE_MB: int = 50
    ALLOWED_EXTENSIONS: set = {".pdf", ".pptx", ".txt", ".md", ".srt", ".vtt"}
    
    # Retrieval parameters
    CHUNK_SIZE: int = 600 # characters
    CHUNK_OVERLAP: int = 100 # characters
    TOP_K_RETRIEVAL: int = 5
    SIMILARITY_THRESHOLD: float = 0.08 # Minimum cosine similarity for relevance

settings = Settings()
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
