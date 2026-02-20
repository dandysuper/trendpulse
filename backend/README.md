# Video Trends Analyzer - Backend

A production-ready MVP backend for analyzing trending YouTube videos using real-time data from YouTube Data API v3, with ML-based clustering and trend scoring.

## 🎯 Features

- **Real YouTube Data**: Ingests trending and fast-growing videos via YouTube Data API v3
- **Advanced Metrics**: Computes views_per_hour, engagement_rate, freshness_score
- **TrendScore Algorithm**: Peer-group normalized scoring for fair comparison
- **ML Clustering**: Unsupervised topic clustering using sentence-transformers (MiniLM)
- **Deduplication**: Detects near-identical videos using cosine similarity
- **REST API**: Clean FastAPI endpoints with pagination and filtering
- **SQLite Database**: Lightweight, zero-config persistence

## 📁 Project Structure

```
backend/
├── api/
│   └── server.py           # FastAPI REST endpoints
├── database/
│   └── db.py              # SQLite schema and connection management
├── features/
│   └── calculator.py      # Feature engineering (metrics computation)
├── ingest/
│   └── youtube_ingester.py # YouTube Data API v3 integration
├── ml/
│   └── processor.py       # ML pipeline (embeddings, clustering, dedup)
├── config.py              # Configuration management
├── main.py                # Full pipeline orchestration
├── requirements.txt       # Python dependencies
├── .env.example          # Environment variables template
└── README.md             # This file
```

## 🚀 Quick Start

### 1. Prerequisites

- Python 3.9+
- YouTube Data API v3 key (free from Google Cloud Console)

### 2. Get YouTube API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable **YouTube Data API v3**
4. Create credentials → API Key
5. Copy your API key

### 3. Installation

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 4. Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your YouTube API key
# YOUTUBE_API_KEY=your_actual_api_key_here
```

### 5. Run the Pipeline

```bash
# Run full pipeline (ingestion → features → ML)
python main.py
```

This will:
1. ✅ Fetch 50 trending videos (US region)
2. ✅ Fetch 50 recent high-velocity videos (last 72h)
3. ✅ Compute all derived metrics
4. ✅ Generate embeddings using sentence-transformers
5. ✅ Detect duplicate videos
6. ✅ Cluster videos by topic

### 6. Start API Server

```bash
# Start FastAPI server
python -m uvicorn api.server:app --host 0.0.0.0 --port 8000 --reload
```

API will be available at: `http://localhost:8000`

Interactive docs: `http://localhost:8000/docs`

## 📊 API Endpoints

### GET /trends

Get trending videos with pagination and filtering.

**Query Parameters:**
- `page` (int): Page number (default: 1)
- `page_size` (int): Items per page (default: 20, max: 100)
- `min_trend_score` (float): Minimum trend score filter (0-1)
- `category_id` (string): Filter by YouTube category
- `sort_by` (string): Sort field (trend_score, views_per_hour, engagement_rate)

**Example Request:**
```bash
curl "http://localhost:8000/trends?page=1&page_size=10&min_trend_score=0.5"
```

**Example Response:**
```json
{
  "videos": [
    {
      "video_id": "dQw4w9WgXcQ",
      "title": "Amazing Tech Review 2024",
      "description": "Full review of...",
      "channel_title": "TechChannel",
      "published_at": "2024-01-27T10:00:00Z",
      "thumbnail_url": "https://i.ytimg.com/...",
      "view_count": 150000,
      "like_count": 12000,
      "comment_count": 850,
      "metrics": {
        "views_per_hour": 6250.5,
        "engagement_rate": 0.0856,
        "freshness_score": 0.9234,
        "trend_score": 0.7845
      },
      "cluster_id": 3,
      "cluster_label": "Tech Reviews"
    }
  ],
  "total": 87,
  "page": 1,
  "page_size": 10
}
```

### GET /trend/{video_id}

Get detailed information for a specific video.

**Example Request:**
```bash
curl "http://localhost:8000/trend/dQw4w9WgXcQ"
```

### GET /clusters

Get all video clusters with summary statistics.

**Example Response:**
```json
{
  "clusters": [
    {
      "cluster_id": 1,
      "cluster_label": "Gaming Highlights",
      "cluster_size": 15,
      "representative_video_id": "abc123",
      "avg_trend_score": 0.6234,
      "created_at": "2024-01-27T12:00:00Z"
    }
  ],
  "total_clusters": 8
}
```

### GET /clusters/{cluster_id}

Get detailed information for a specific cluster, including all videos.

**Example Request:**
```bash
curl "http://localhost:8000/clusters/1"
```

### GET /health

Health check endpoint.

```json
{
  "status": "healthy",
  "database": "connected",
  "video_count": 87,
  "timestamp": "2024-01-27T12:00:00Z"
}
```

## 🧮 Metric Formulas

### 1. Views Per Hour
```
views_per_hour = view_count / hours_since_published
```

### 2. Engagement Rate
```
engagement_rate = (likes × 1.0 + comments × 2.0) / views
```
*Comments weighted 2x as they indicate deeper engagement*

### 3. Freshness Score
```
freshness_score = exp(-hours_elapsed / 48)
```
*Exponential decay with 48-hour half-life*

### 4. TrendScore (Peer-Normalized)
```
1. Define peer group: same category + published within ±24h
2. Calculate z-score: z = (views_per_hour - peer_avg) / peer_std
3. Normalize z to [0,1]: normalized_views = (z + 3) / 6
4. TrendScore = (normalized_views × 0.5) + (engagement × 0.3) + (freshness × 0.2)
```

## 🤖 ML Pipeline

### Embeddings
- **Model**: `all-MiniLM-L6-v2` (sentence-transformers)
- **Input**: Video title + description (first 500 chars)
- **Output**: 384-dimensional dense vectors

### Clustering
- **Algorithm**: DBSCAN (density-based)
- **Metric**: Cosine similarity
- **Parameters**: 
  - `eps=0.3` (max distance between samples)
  - `min_samples=3` (minimum cluster size)

### Deduplication
- **Method**: Cosine similarity threshold
- **Threshold**: 0.95 (95% similarity = duplicate)
- **Output**: Duplicate groups with primary video

## 🗄️ Database Schema

### Tables

**videos**: Raw YouTube data
- video_id (PK), title, description, channel info
- view_count, like_count, comment_count
- published_at, ingested_at

**video_metrics**: Computed features
- video_id (FK), views_per_hour, engagement_rate
- freshness_score, trend_score
- peer_group, peer_avg_views, peer_std_views

**clusters**: ML clustering results
- cluster_id (PK), cluster_label, cluster_size
- representative_video_id, avg_trend_score

**video_clusters**: Video-cluster mapping
- video_id (FK), cluster_id (FK), distance_to_center

**video_embeddings**: Vector representations
- video_id (FK), embedding (BLOB), model_name

**duplicate_groups**: Deduplication tracking
- group_id (PK), primary_video_id, duplicate_video_ids

## ⚙️ Configuration

Edit `.env` to customize:

```bash
# YouTube API
YOUTUBE_API_KEY=your_key_here
TRENDING_REGION_CODE=US
MAX_TRENDING_RESULTS=50
MAX_SEARCH_RESULTS=50
SEARCH_PUBLISHED_AFTER_HOURS=72

# ML Settings
EMBEDDING_MODEL=all-MiniLM-L6-v2
CLUSTERING_MIN_SAMPLES=3
CLUSTERING_EPS=0.3
DEDUP_SIMILARITY_THRESHOLD=0.95

# Feature Engineering
FRESHNESS_DECAY_HOURS=48
ENGAGEMENT_WEIGHTS_LIKES=1.0
ENGAGEMENT_WEIGHTS_COMMENTS=2.0
```

## 🔄 Running Individual Modules

```bash
# Run only ingestion
python -c "import asyncio; from ingest.youtube_ingester import run_ingestion; from database.db import init_db, close_db; from config import settings; asyncio.run(init_db(settings.database_path)); asyncio.run(run_ingestion()); asyncio.run(close_db())"

# Run only feature computation
python -c "import asyncio; from features.calculator import compute_all_features; from database.db import init_db, close_db; from config import settings; asyncio.run(init_db(settings.database_path)); asyncio.run(compute_all_features()); asyncio.run(close_db())"

# Run only ML pipeline
python -c "import asyncio; from ml.processor import run_ml_pipeline; from database.db import init_db, close_db; from config import settings; asyncio.run(init_db(settings.database_path)); asyncio.run(run_ml_pipeline()); asyncio.run(close_db())"
```

## 📈 Scaling Considerations

### Current MVP Limitations
- Single-threaded ingestion
- In-memory embedding computation
- SQLite (single-writer)
- No caching layer

### Future Scaling Path
1. **Database**: Migrate to PostgreSQL with pgvector for embeddings
2. **Caching**: Add Redis for API responses
3. **Queue**: Use Celery for async ingestion jobs
4. **Embeddings**: Batch processing with GPU acceleration
5. **API**: Add rate limiting and authentication
6. **Monitoring**: Prometheus + Grafana for metrics
7. **Deployment**: Docker + Kubernetes for horizontal scaling

## 🧪 Testing

```bash
# Test API endpoints
curl http://localhost:8000/health
curl http://localhost:8000/trends?page=1&page_size=5
curl http://localhost:8000/clusters

# Check database
sqlite3 data/trends.db "SELECT COUNT(*) FROM videos;"
sqlite3 data/trends.db "SELECT cluster_label, cluster_size FROM clusters;"
```

## 🐛 Troubleshooting

### "YouTube API quota exceeded"
- Free tier: 10,000 units/day
- Each video fetch costs ~3 units
- Solution: Reduce MAX_TRENDING_RESULTS or wait 24h

### "No videos ingested"
- Check API key is valid
- Verify internet connection
- Check YouTube API is enabled in Google Cloud Console

### "Not enough videos for clustering"
- Need at least `CLUSTERING_MIN_SAMPLES` videos
- Lower the threshold or ingest more data

### "Model download fails"
- sentence-transformers downloads on first run
- Requires ~80MB download
- Check internet connection

## 📝 License

MIT License - Free for commercial and personal use

## 🤝 Contributing

This is an MVP. Suggested improvements:
- Add more data sources (Twitter, Reddit)
- Implement time-series trend detection
- Add sentiment analysis
- Build recommendation engine
- Create admin dashboard

## 📧 Support

For issues or questions, check:
- YouTube Data API docs: https://developers.google.com/youtube/v3
- FastAPI docs: https://fastapi.tiangolo.com/
- sentence-transformers: https://www.sbert.net/

---

**Built with ❤️ using Python, FastAPI, and sentence-transformers**
