from pydantic_settings import BaseSettings
from typing import Optional


# Built-in default API keys (ship with the app, work out of the box)
# Users can override these via .env or the Settings UI if they expire
DEFAULT_YOUTUBE_API_KEY = "AIzaSyCkbZzJfCkvZxXvzWocllE5PVOVyQD44UM"
DEFAULT_RAPIDAPI_KEY = "80659924dbmshc70623b53b1cf24p178d07jsne00e44f1a7b3"


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""
    
    # YouTube Data API v3 (free from Google Cloud Console)
    youtube_api_key: Optional[str] = None
    
    # RapidAPI key (used for TikTok via Scraptik)
    rapidapi_key: Optional[str] = None
    
    # Database
    database_path: str = "./data/trends.db"
    api_keys_db_path: str = "./data/api_keys.db"
    
    # API Configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    
    # Ingestion Settings
    trending_region_code: str = "US"
    max_trending_results: int = 50
    max_search_results: int = 50
    search_published_after_hours: int = 72
    
    # ML Settings
    embedding_model: str = "all-MiniLM-L6-v2"
    clustering_min_samples: int = 3
    clustering_eps: float = 0.3
    dedup_similarity_threshold: float = 0.95
    
    # Feature Engineering
    freshness_decay_hours: int = 48
    engagement_weights_likes: float = 1.0
    engagement_weights_comments: float = 2.0
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()


# Runtime API key storage (can be set via UI)
_runtime_youtube_key: Optional[str] = None
_runtime_rapidapi_key: Optional[str] = None


def set_runtime_api_key(api_key: str, key_type: str = "rapidapi"):
    """Set API key at runtime (from UI)."""
    global _runtime_youtube_key, _runtime_rapidapi_key
    if key_type == "youtube":
        _runtime_youtube_key = api_key
    else:
        _runtime_rapidapi_key = api_key


def get_api_key() -> Optional[str]:
    """Get RapidAPI key: UI-set > .env > built-in default."""
    return _runtime_rapidapi_key or settings.rapidapi_key or DEFAULT_RAPIDAPI_KEY


def get_youtube_api_key() -> Optional[str]:
    """Get YouTube API key: UI-set > .env > built-in default."""
    return _runtime_youtube_key or settings.youtube_api_key or DEFAULT_YOUTUBE_API_KEY


def is_using_default_key(key_type: str = "rapidapi") -> bool:
    """Check if the active key is the built-in default (not user-provided)."""
    if key_type == "youtube":
        return not _runtime_youtube_key and not settings.youtube_api_key
    else:
        return not _runtime_rapidapi_key and not settings.rapidapi_key
