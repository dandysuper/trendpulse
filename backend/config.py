from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""
    
    # RapidAPI YouTube138
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
_runtime_api_key: Optional[str] = None


def set_runtime_api_key(api_key: str):
    """Set API key at runtime (from UI)."""
    global _runtime_api_key
    _runtime_api_key = api_key


def get_api_key() -> Optional[str]:
    """Get API key from runtime or settings."""
    return _runtime_api_key or settings.rapidapi_key
