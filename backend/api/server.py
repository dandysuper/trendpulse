"""
REST API endpoints for Video Trends Analyzer.
"""
import os

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import json

from database.db import get_db, init_db, close_db
from config import settings, set_runtime_api_key, get_api_key, get_youtube_api_key, is_using_default_key
from ingest.rapidapi_ingester import YouTubeDataAPIIngester, run_ingestion
from features.calculator import compute_all_features
from ml.processor import run_ml_pipeline
from api.refresh import router as refresh_router
from api.refresh import refresh_data as refresh_data_handler


# Pydantic models for API responses
class VideoMetrics(BaseModel):
    views_per_hour: float
    engagement_rate: float
    freshness_score: float
    trend_score: float


class VideoResponse(BaseModel):
    video_id: str
    title: str
    description: Optional[str]
    channel_title: str
    published_at: str
    thumbnail_url: Optional[str]
    view_count: int
    like_count: int
    comment_count: int
    metrics: VideoMetrics
    cluster_id: Optional[int] = None
    cluster_label: Optional[str] = None


class TrendsResponse(BaseModel):
    videos: List[VideoResponse]
    total: int
    page: int
    page_size: int


class ClusterResponse(BaseModel):
    cluster_id: int
    cluster_label: str
    cluster_size: int
    representative_video_id: str
    avg_trend_score: float
    videos: List[VideoResponse]


class ClustersListResponse(BaseModel):
    clusters: List[dict]
    total_clusters: int


class APIKeyRequest(BaseModel):
    api_key: str
    key_type: str = "rapidapi"  # "youtube" or "rapidapi"


class APIKeyResponse(BaseModel):
    status: str
    message: str
    is_valid: Optional[bool] = None


class PipelineResponse(BaseModel):
    status: str
    message: str
    videos_ingested: Optional[int] = None
    features_computed: Optional[int] = None
    clusters_created: Optional[int] = None


# Initialize FastAPI app
app = FastAPI(
    title="Video Trends Analyzer API",
    description="MVP backend for analyzing trending YouTube & TikTok videos with ML-based clustering",
    version="1.0.0"
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include refresh router
app.include_router(refresh_router, prefix="/api", tags=["refresh"])

# Serve the built React frontend (exists in Docker builds)
STATIC_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static")
if os.path.isdir(STATIC_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="static-assets")


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    await init_db(settings.database_path)
    print(f"✅ Database initialized: {settings.database_path}")


@app.on_event("shutdown")
async def shutdown_event():
    """Close database on shutdown."""
    await close_db()
    print("✅ Database connection closed")


@app.get("/")
async def root():
    """Serve frontend SPA or API info."""
    index_file = os.path.join(STATIC_DIR, "index.html")
    if os.path.isdir(STATIC_DIR) and os.path.isfile(index_file):
        return FileResponse(index_file)
    return {
        "message": "Video Trends Analyzer API",
        "version": "1.0.0",
        "endpoints": {
            "trends": "/trends",
            "trend_detail": "/trend/{video_id}",
            "clusters": "/clusters",
            "cluster_detail": "/clusters/{cluster_id}",
            "health": "/health"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    db = await get_db()
    
    # Check database connectivity
    try:
        result = await db.fetch_one("SELECT COUNT(*) as count FROM videos")
        video_count = result['count'] if result else 0
        
        return {
            "status": "healthy",
            "database": "connected",
            "video_count": video_count,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database error: {str(e)}")


@app.get("/trends", response_model=TrendsResponse)
async def get_trends(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    min_trend_score: float = Query(0.0, ge=0.0, le=1.0, description="Minimum trend score"),
    category_id: Optional[str] = Query(None, description="Filter by YouTube category ID"),
    sort_by: str = Query("trend_score", description="Sort field: trend_score, views_per_hour, engagement_rate")
):
    """
    Get trending videos with pagination and filtering.
    
    Returns videos sorted by trend score (or other metrics) with computed features.
    """
    db = await get_db()
    
    # Build query
    where_clauses = ["vm.trend_score >= ?"]
    params = [min_trend_score]
    
    if category_id:
        where_clauses.append("v.category_id = ?")
        params.append(category_id)
    
    where_sql = " AND ".join(where_clauses)
    
    # Validate sort field
    valid_sort_fields = ["trend_score", "views_per_hour", "engagement_rate", "freshness_score"]
    if sort_by not in valid_sort_fields:
        sort_by = "trend_score"
    
    # Get total count
    count_query = f"""
        SELECT COUNT(*) as total
        FROM videos v
        INNER JOIN video_metrics vm ON v.video_id = vm.video_id
        WHERE {where_sql}
    """
    total_result = await db.fetch_one(count_query, tuple(params))
    total = total_result['total'] if total_result else 0
    
    # Get paginated results
    offset = (page - 1) * page_size
    
    query = f"""
        SELECT 
            v.video_id, v.title, v.description, v.channel_title, v.published_at,
            v.thumbnail_url, v.view_count, v.like_count, v.comment_count,
            vm.views_per_hour, vm.engagement_rate, vm.freshness_score, vm.trend_score,
            vc.cluster_id, c.cluster_label
        FROM videos v
        INNER JOIN video_metrics vm ON v.video_id = vm.video_id
        LEFT JOIN video_clusters vc ON v.video_id = vc.video_id
        LEFT JOIN clusters c ON vc.cluster_id = c.cluster_id
        WHERE {where_sql}
        ORDER BY vm.{sort_by} DESC
        LIMIT ? OFFSET ?
    """
    
    params.extend([page_size, offset])
    rows = await db.fetch_all(query, tuple(params))
    
    # Format response
    videos = []
    for row in rows:
        videos.append(VideoResponse(
            video_id=row['video_id'],
            title=row['title'],
            description=row['description'],
            channel_title=row['channel_title'],
            published_at=row['published_at'],
            thumbnail_url=row['thumbnail_url'],
            view_count=row['view_count'],
            like_count=row['like_count'],
            comment_count=row['comment_count'],
            metrics=VideoMetrics(
                views_per_hour=row['views_per_hour'],
                engagement_rate=row['engagement_rate'],
                freshness_score=row['freshness_score'],
                trend_score=row['trend_score']
            ),
            cluster_id=row['cluster_id'],
            cluster_label=row['cluster_label']
        ))
    
    return TrendsResponse(
        videos=videos,
        total=total,
        page=page,
        page_size=page_size
    )


@app.get("/trend/{video_id}", response_model=VideoResponse)
async def get_trend_detail(video_id: str):
    """
    Get detailed information for a specific video.
    """
    db = await get_db()
    
    query = """
        SELECT 
            v.video_id, v.title, v.description, v.channel_title, v.published_at,
            v.thumbnail_url, v.view_count, v.like_count, v.comment_count,
            vm.views_per_hour, vm.engagement_rate, vm.freshness_score, vm.trend_score,
            vc.cluster_id, c.cluster_label
        FROM videos v
        LEFT JOIN video_metrics vm ON v.video_id = vm.video_id
        LEFT JOIN video_clusters vc ON v.video_id = vc.video_id
        LEFT JOIN clusters c ON vc.cluster_id = c.cluster_id
        WHERE v.video_id = ?
    """
    
    row = await db.fetch_one(query, (video_id,))
    
    if not row:
        raise HTTPException(status_code=404, detail=f"Video {video_id} not found")
    
    # Handle case where metrics haven't been calculated yet
    if row['views_per_hour'] is None:
        raise HTTPException(
            status_code=404,
            detail=f"Metrics not yet calculated for video {video_id}. Run feature computation first."
        )
    
    return VideoResponse(
        video_id=row['video_id'],
        title=row['title'],
        description=row['description'],
        channel_title=row['channel_title'],
        published_at=row['published_at'],
        thumbnail_url=row['thumbnail_url'],
        view_count=row['view_count'],
        like_count=row['like_count'],
        comment_count=row['comment_count'],
        metrics=VideoMetrics(
            views_per_hour=row['views_per_hour'],
            engagement_rate=row['engagement_rate'],
            freshness_score=row['freshness_score'],
            trend_score=row['trend_score']
        ),
        cluster_id=row['cluster_id'],
        cluster_label=row['cluster_label']
    )


@app.get("/clusters", response_model=ClustersListResponse)
async def get_clusters():
    """
    Get all video clusters with summary statistics.
    """
    db = await get_db()
    
    query = """
        SELECT 
            cluster_id, cluster_label, cluster_size, representative_video_id,
            avg_trend_score, created_at
        FROM clusters
        ORDER BY avg_trend_score DESC
    """
    
    rows = await db.fetch_all(query)
    
    clusters = []
    for row in rows:
        clusters.append({
            "cluster_id": row['cluster_id'],
            "cluster_label": row['cluster_label'],
            "cluster_size": row['cluster_size'],
            "representative_video_id": row['representative_video_id'],
            "avg_trend_score": row['avg_trend_score'],
            "created_at": row['created_at']
        })
    
    return ClustersListResponse(
        clusters=clusters,
        total_clusters=len(clusters)
    )


@app.get("/clusters/{cluster_id}", response_model=ClusterResponse)
async def get_cluster_detail(cluster_id: int):
    """
    Get detailed information for a specific cluster, including all videos.
    """
    db = await get_db()
    
    # Get cluster info
    cluster_query = """
        SELECT 
            cluster_id, cluster_label, cluster_size, representative_video_id,
            avg_trend_score
        FROM clusters
        WHERE cluster_id = ?
    """
    
    cluster_row = await db.fetch_one(cluster_query, (cluster_id,))
    
    if not cluster_row:
        raise HTTPException(status_code=404, detail=f"Cluster {cluster_id} not found")
    
    # Get all videos in cluster
    videos_query = """
        SELECT 
            v.video_id, v.title, v.description, v.channel_title, v.published_at,
            v.thumbnail_url, v.view_count, v.like_count, v.comment_count,
            vm.views_per_hour, vm.engagement_rate, vm.freshness_score, vm.trend_score,
            vc.cluster_id, c.cluster_label
        FROM video_clusters vc
        INNER JOIN videos v ON vc.video_id = v.video_id
        INNER JOIN video_metrics vm ON v.video_id = vm.video_id
        INNER JOIN clusters c ON vc.cluster_id = c.cluster_id
        WHERE vc.cluster_id = ?
        ORDER BY vm.trend_score DESC
    """
    
    video_rows = await db.fetch_all(videos_query, (cluster_id,))
    
    videos = []
    for row in video_rows:
        videos.append(VideoResponse(
            video_id=row['video_id'],
            title=row['title'],
            description=row['description'],
            channel_title=row['channel_title'],
            published_at=row['published_at'],
            thumbnail_url=row['thumbnail_url'],
            view_count=row['view_count'],
            like_count=row['like_count'],
            comment_count=row['comment_count'],
            metrics=VideoMetrics(
                views_per_hour=row['views_per_hour'],
                engagement_rate=row['engagement_rate'],
                freshness_score=row['freshness_score'],
                trend_score=row['trend_score']
            ),
            cluster_id=row['cluster_id'],
            cluster_label=row['cluster_label']
        ))
    
    return ClusterResponse(
        cluster_id=cluster_row['cluster_id'],
        cluster_label=cluster_row['cluster_label'],
        cluster_size=cluster_row['cluster_size'],
        representative_video_id=cluster_row['representative_video_id'],
        avg_trend_score=cluster_row['avg_trend_score'],
        videos=videos
    )


@app.post("/api/set-api-key", response_model=APIKeyResponse)
async def set_api_key(request: APIKeyRequest):
    """
    Set API key for the application.
    Supports key_type: 'youtube' (YouTube Data API v3) or 'rapidapi' (TikTok via Scraptik).
    """
    api_key = request.api_key.strip()
    key_type = request.key_type.strip().lower()
    
    if not api_key:
        raise HTTPException(status_code=400, detail="API key cannot be empty")
    
    # Test the API key based on type
    if key_type == "youtube":
        ingester = YouTubeDataAPIIngester(api_key)
        is_valid = await ingester.test_api_key()
        label = "YouTube Data API v3"
    else:
        from ingest.tiktok_ingester import TikTokIngester
        ingester = TikTokIngester(api_key)
        is_valid = await ingester.test_api_key()
        label = "RapidAPI (TikTok Scraptik)"
    
    if not is_valid:
        return APIKeyResponse(
            status="error",
            message=f"Invalid {label} key. Please check and try again.",
            is_valid=False
        )
    
    # Store the API key in runtime
    set_runtime_api_key(api_key, key_type=key_type)
    
    return APIKeyResponse(
        status="success",
        message=f"{label} key validated and saved successfully!",
        is_valid=True
    )


@app.get("/api/check-api-key")
async def check_api_key():
    """
    Check which API keys are configured and whether they are defaults or custom.
    """
    youtube_key = get_youtube_api_key()
    rapidapi_key = get_api_key()
    yt_default = is_using_default_key("youtube")
    ra_default = is_using_default_key("rapidapi")
    
    return {
        "has_api_key": True,
        "has_youtube_key": youtube_key is not None,
        "has_rapidapi_key": rapidapi_key is not None,
        "youtube_is_default": yt_default,
        "rapidapi_is_default": ra_default,
        "message": "API keys ready (built-in defaults active)"
    }


@app.post("/api/run-pipeline", response_model=PipelineResponse)
async def run_pipeline_endpoint():
    """
    Run the full data pipeline (alias).

    NOTE: This endpoint now delegates to /api/refresh so the UI and docs stay consistent.
    """
    result = await refresh_data_handler()
    # Map RefreshResponse -> PipelineResponse
    return PipelineResponse(
        status=result.status,
        message=result.message,
        videos_ingested=(result.videos_ingested + result.tiktok_videos_ingested),
        features_computed=result.features_computed,
        clusters_created=result.clusters_created,
    )



# ---- SPA catch-all: serve index.html for any non-API route ----
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    """Serve the React SPA for any route not handled by the API."""
    index_file = os.path.join(STATIC_DIR, "index.html")
    if os.path.isdir(STATIC_DIR) and os.path.isfile(index_file):
        # If the exact file exists in static dir, serve it (e.g. favicon, manifest)
        static_file = os.path.join(STATIC_DIR, full_path)
        if full_path and os.path.isfile(static_file):
            return FileResponse(static_file)
        return FileResponse(index_file)
    # Fallback when running without frontend build (dev mode)
    return {"detail": "Frontend not built. Use /docs for API documentation."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "api.server:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=True
    )
