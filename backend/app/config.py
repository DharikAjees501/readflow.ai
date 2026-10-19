import os
from pathlib import Path
from dotenv import load_dotenv

# Search for .env in current directory, backend directory, or root
env_paths = [
    Path(__file__).resolve().parent.parent / ".env",
    Path(__file__).resolve().parent.parent.parent / ".env",
    Path(".env")
]

for p in env_paths:
    if p.exists():
        load_dotenv(p)
        break

class Settings:
    PROJECT_NAME: str = "ReadFlow.ai - Multi-Domain Interactive Learning Platform"
    VERSION: str = "1.0.0"
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Gemini AI configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # Modular Model Splitting Architecture
    IMAGE_MODELS: list = [
        "gemini-3.5-flash-lite",
        "gemini-3.8-flash",
        "gemini-3.5-flash",
        "gemini-3.1-flash-lite",
    ]
    SEARCH_MODELS: list = [
        "gemini-3.5-flash-lite",
        "gemini-3.8-flash",
        "gemini-3.5-flash",
        "gemini-3.1-flash-lite",
    ]
    SYNTHESIS_MODELS: list = [
        "gemini-3.5-flash-lite",
        "gemini-3.8-flash",
        "gemini-3.5-flash",
        "gemini-3.1-flash-lite",
    ]
    EMBEDDING_MODELS: list = [
        "gemini-embedding-001",
        "gemini-embedding-2",
    ]
    
    # Upload and static directories
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    CACHE_DIR: Path = BASE_DIR / "uploads" / "cache"

settings = Settings()
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.CACHE_DIR.mkdir(parents=True, exist_ok=True)
