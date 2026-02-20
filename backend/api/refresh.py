"""
API endpoint to trigger data refresh/ingestion.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import asyncio

from config import get_api_key
from ingest.rapidapi_ingester import run_ingestion
from ingest.tiktok_ingester import run_tiktok_ingestion
from features.calculator import compute_all_features
from ml.processor import run_ml_pipeline

router = APIRouter()


class RefreshResponse(BaseModel):
    status: str
    message: str
    videos_ingested: int
    tiktok_videos_ingested: int
    features_computed: int
    clusters_created: int


@router.post("/refresh", response_model=RefreshResponse)
async def refresh_data():
    """
    Trigger a full data refresh:
    1. Ingest new videos from RapidAPI
    2. Compute features
    3. Run ML clustering
    """
    api_key = get_api_key()
    
    if not api_key:
        raise HTTPException(
            status_code=400,
            detail="No API key configured. Please set your RapidAPI key first."
        )
    
    try:
        print("🔄 Starting data refresh...")
        
        # Run YouTube ingestion
        print("📊 Ingesting videos from YouTube...")
        youtube_count = await run_ingestion(api_key)
        print(f"✅ Ingested {youtube_count} YouTube videos")
        
        # Run TikTok ingestion
        print("🎵 Ingesting videos from TikTok...")
        tiktok_count = await run_tiktok_ingestion(api_key)
        print(f"✅ Ingested {tiktok_count} TikTok videos")
        
        video_count = youtube_count + tiktok_count
        
        if video_count == 0:
            return RefreshResponse(
                status="warning",
                message="No new videos ingested. API may have rate limits or no new content available.",
                videos_ingested=0,
                tiktok_videos_ingested=0,
                features_computed=0,
                clusters_created=0
            )
        
        # Compute features
        print("🔧 Computing features...")
        features_count = await compute_all_features()
        print(f"✅ Computed features for {features_count} videos")
        
        # Run ML pipeline
        print("🤖 Running ML pipeline...")
        ml_results = await run_ml_pipeline()
        print(f"✅ Created {ml_results['clustering']['cluster_count']} clusters")
        
        return RefreshResponse(
            status="success",
            message=f"Successfully refreshed data with {video_count} videos ({youtube_count} YouTube, {tiktok_count} TikTok)",
            videos_ingested=youtube_count,
            tiktok_videos_ingested=tiktok_count,
            features_computed=features_count,
            clusters_created=ml_results['clustering']['cluster_count']
        )
    
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"❌ Refresh failed: {error_details}")
        raise HTTPException(
            status_code=500, 
            detail=f"Refresh failed: {str(e)}. Check backend logs for details."
        )


@router.get("/refresh/status")
async def get_refresh_status():
    """Check if a refresh is currently running."""
    # For now, just return a simple status
    # In production, you'd track this with a background task
    return {
        "is_refreshing": False,
        "last_refresh": None
    }
