# TrendPulse - Full Stack Integration Guide

Complete guide for running the Video Trends Analyzer with both frontend and backend.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     TrendPulse System                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │   Frontend   │ ◄─────► │   Backend    │                 │
│  │  React + TS  │  REST   │ FastAPI + ML │                 │
│  │  Port: 5173  │   API   │  Port: 8000  │                 │
│  └──────────────┘         └──────┬───────┘                 │
│                                   │                          │
│                          ┌────────▼────────┐                │
│                          │  SQLite + Data  │                │
│                          │  backend/data/  │                │
│                          └─────────────────┘                │
│                                   │                          │
│                          ┌────────▼────────┐                │
│                          │  YouTube API v3 │                │
│                          │  (External)     │                │
│                          └─────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

## 📋 Prerequisites

- **Python 3.9+** (for backend)
- **Node.js 18+** (for frontend)
- **YouTube Data API v3 Key** (free from Google Cloud Console)

## 🚀 Quick Start (Both Services)

### Step 1: Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your YouTube API key:
# YOUTUBE_API_KEY=your_actual_key_here

# Run the full pipeline (ingestion + features + ML)
python main.py

# Start the API server (in a new terminal)
python -m uvicorn api.server:app --host 0.0.0.0 --port 8000 --reload
```

**Backend will be running at:** `http://localhost:8000`

### Step 2: Frontend Setup

```bash
# Navigate to project root
cd ..

# Install dependencies
npm install

# Start development server
npm run dev
```

**Frontend will be running at:** `http://localhost:5173`

## 🔄 Data Flow

1. **Backend Pipeline** (`python main.py`):
   - Fetches trending YouTube videos (50 videos)
   - Fetches recent high-velocity videos (50 videos)
   - Computes metrics: views_per_hour, engagement_rate, freshness_score
   - Calculates TrendScore with peer-group normalization
   - Generates embeddings using sentence-transformers
   - Detects duplicate videos
   - Clusters videos by topic using DBSCAN

2. **API Server** (`uvicorn api.server:app`):
   - Exposes REST endpoints
   - Serves data to frontend
   - Handles CORS for local development

3. **Frontend** (`npm run dev`):
   - Checks backend health on load
   - Fetches clusters from `/clusters` endpoint
   - Displays trends in real-time
   - Falls back to mock data if backend unavailable

## 🔌 API Integration

### Backend Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/trends` | GET | Get trending videos (paginated) |
| `/trend/{video_id}` | GET | Get single video details |
| `/clusters` | GET | Get all clusters |
| `/clusters/{cluster_id}` | GET | Get cluster with videos |

### Frontend API Service

Located at: `services/api.ts`

**Key Functions:**
- `fetchTrendClusters()` - Fetches all clusters with videos
- `fetchTrendingVideos()` - Fetches individual trending videos
- `checkBackendHealth()` - Checks if backend is available

**Data Mapping:**
- Backend uses snake_case (Python convention)
- Frontend uses camelCase (TypeScript convention)
- API service handles conversion automatically

## 🎨 Frontend Features

### Real-time Backend Integration
- ✅ Automatic backend health check
- ✅ Live data loading with loading states
- ✅ Error handling with fallback to mock data
- ✅ Refresh button to reload data
- ✅ Status indicator (green = connected, amber = mock data)

### UI Components
- **TrendList**: Displays clusters sorted by growth rate
- **TrendDetail**: Shows detailed cluster information
- **Status Indicator**: Shows backend connection status

## 🧪 Testing the Integration

### 1. Test Backend Only

```bash
cd backend

# Check health
curl http://localhost:8000/health

# Get trends
curl http://localhost:8000/trends?page=1&page_size=5

# Get clusters
curl http://localhost:8000/clusters
```

### 2. Test Frontend Only (Mock Data)

```bash
# Stop backend if running
# Start frontend
npm run dev
# Should show "Using Mock Data" indicator
```

### 3. Test Full Integration

```bash
# Ensure backend is running on port 8000
# Ensure frontend is running on port 5173
# Open http://localhost:5173
# Should show "Backend Connected" indicator
# Click refresh button to reload data
```

## 📊 Example API Responses

### GET /clusters

```json
{
  "clusters": [
    {
      "cluster_id": 1,
      "cluster_label": "Tech Reviews",
      "cluster_size": 12,
      "representative_video_id": "dQw4w9WgXcQ",
      "avg_trend_score": 0.7845,
      "created_at": "2024-01-27T12:00:00Z"
    }
  ],
  "total_clusters": 8
}
```

### GET /clusters/1

```json
{
  "cluster_id": 1,
  "cluster_label": "Tech Reviews",
  "cluster_size": 12,
  "representative_video_id": "dQw4w9WgXcQ",
  "avg_trend_score": 0.7845,
  "videos": [
    {
      "video_id": "dQw4w9WgXcQ",
      "title": "Amazing Tech Review 2024",
      "description": "Full review...",
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
      "cluster_id": 1,
      "cluster_label": "Tech Reviews"
    }
  ]
}
```

## 🔧 Configuration

### Backend (.env)

```bash
# YouTube API
YOUTUBE_API_KEY=your_key_here
TRENDING_REGION_CODE=US
MAX_TRENDING_RESULTS=50
MAX_SEARCH_RESULTS=50
SEARCH_PUBLISHED_AFTER_HOURS=72

# Database
DATABASE_PATH=./data/trends.db

# API
API_HOST=0.0.0.0
API_PORT=8000

# ML
EMBEDDING_MODEL=all-MiniLM-L6-v2
CLUSTERING_MIN_SAMPLES=3
CLUSTERING_EPS=0.3
DEDUP_SIMILARITY_THRESHOLD=0.95
```

### Frontend (.env.local)

```bash
VITE_API_URL=http://localhost:8000
GEMINI_API_KEY=your_gemini_key_here
```

## 🐛 Troubleshooting

### Backend Issues

**"No videos ingested"**
- Check YouTube API key is valid
- Verify API is enabled in Google Cloud Console
- Check internet connection

**"Not enough videos for clustering"**
- Need at least 3 videos (CLUSTERING_MIN_SAMPLES)
- Run ingestion again or lower threshold

**"Port 8000 already in use"**
```bash
# Find and kill process
lsof -ti:8000 | xargs kill -9
```

### Frontend Issues

**"Backend Connected" but no data**
- Backend may need data ingestion: `cd backend && python main.py`
- Check backend logs for errors

**CORS errors**
- Backend has CORS enabled for all origins in development
- Check API_HOST is set to 0.0.0.0 in backend/.env

**"Using Mock Data" when backend is running**
- Check VITE_API_URL in .env.local
- Verify backend is accessible: `curl http://localhost:8000/health`
- Restart frontend dev server after changing .env.local

## 🔄 Development Workflow

### Daily Development

```bash
# Terminal 1: Backend API (keep running)
cd backend
source venv/bin/activate
python -m uvicorn api.server:app --reload

# Terminal 2: Frontend (keep running)
npm run dev

# Terminal 3: Run pipeline when needed
cd backend
source venv/bin/activate
python main.py
```

### Refresh Data

```bash
# Re-run pipeline to get fresh YouTube data
cd backend
python main.py

# Or click refresh button in frontend UI
```

### Reset Database

```bash
cd backend
rm -rf data/
python main.py  # Will recreate database
```

## 📈 Performance Notes

### Backend
- **First run**: ~2-3 minutes (downloads ML model + ingests data)
- **Subsequent runs**: ~30-60 seconds
- **API response time**: <100ms for most endpoints
- **Database size**: ~5-10MB for 100 videos

### Frontend
- **Initial load**: ~1-2 seconds (fetches all clusters)
- **Cluster switch**: Instant (data already loaded)
- **Refresh**: ~1-2 seconds

## 🚀 Production Deployment

### Backend

```bash
# Use production ASGI server
pip install gunicorn
gunicorn api.server:app -w 4 -k uvicorn.workers.UvicornWorker

# Or use Docker
docker build -t trendpulse-backend .
docker run -p 8000:8000 -e YOUTUBE_API_KEY=xxx trendpulse-backend
```

### Frontend

```bash
# Build for production
npm run build

# Serve with nginx or any static host
# Update VITE_API_URL to production backend URL
```

## 📝 Next Steps

1. **Add Authentication**: Protect API endpoints
2. **Add Caching**: Redis for API responses
3. **Add Scheduling**: Cron job for automatic data refresh
4. **Add Monitoring**: Prometheus + Grafana
5. **Add More Sources**: TikTok, Instagram APIs
6. **Enhance ML**: Better clustering, trend prediction

## 🤝 Support

- Backend docs: `backend/README.md`
- API docs: `http://localhost:8000/docs` (when running)
- Frontend: Check browser console for errors

---

**Built with ❤️ using React, FastAPI, and sentence-transformers**
