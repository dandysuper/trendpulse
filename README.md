<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# TrendPulse - Video Trends Analyzer

**AI-powered trend analysis for YouTube videos with ML-based clustering and real-time insights.**

[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)

## 🎯 Overview

TrendPulse is a full-stack application that analyzes trending YouTube videos using machine learning to identify emerging topics, compute engagement metrics, and provide actionable insights for content creators.

### Key Features

- 🎥 **Real YouTube Data** - Ingests trending and fast-growing videos via YouTube Data API v3
- 📊 **Advanced Metrics** - Computes views_per_hour, engagement_rate, freshness_score, and trend_score
- 🤖 **ML Clustering** - Automatically groups videos by topic using sentence-transformers
- 🔍 **Deduplication** - Detects near-identical content using cosine similarity
- 🚀 **REST API** - Clean FastAPI backend with pagination and filtering
- 💾 **SQLite Database** - Lightweight persistence with full schema
- ⚡ **Real-time UI** - React frontend with live backend integration

## 🏗️ Architecture

```
Frontend (React + TypeScript)  ←→  Backend (FastAPI + Python)  ←→  YouTube API v3
    Port: 5173                         Port: 8000                    (External)
```

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** (for frontend)
- **Python 3.9+** (for backend)
- **YouTube Data API Key** ([Get one free](https://console.cloud.google.com/))

### 1. Frontend Setup

```bash
# Install dependencies
npm install

# Configure environment
# Add your Gemini API key to .env.local (already exists)
# GEMINI_API_KEY=your_key_here

# Start development server
npm run dev
```

Frontend will run at: **http://localhost:5173**

### 2. Backend Setup

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

# Start API server (in a new terminal)
python -m uvicorn api.server:app --host 0.0.0.0 --port 8000 --reload
```

Backend will run at: **http://localhost:8000**

API docs available at: **http://localhost:8000/docs**

## 📊 Features in Detail

### Backend Pipeline

1. **Data Ingestion** (`ingest/youtube_ingester.py`)
   - Fetches 50 trending videos from YouTube
   - Fetches 50 recent high-velocity videos (last 72h)
   - Stores raw metrics in SQLite

2. **Feature Engineering** (`features/calculator.py`)
   - **views_per_hour**: `view_count / hours_since_published`
   - **engagement_rate**: `(likes × 1.0 + comments × 2.0) / views`
   - **freshness_score**: `exp(-hours_elapsed / 48)`
   - **trend_score**: Peer-group normalized z-score

3. **ML Pipeline** (`ml/processor.py`)
   - Generates embeddings using sentence-transformers (MiniLM)
   - Clusters videos by topic using DBSCAN
   - Detects duplicate videos (95% similarity threshold)

### REST API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/trends` | GET | Get trending videos (paginated) |
| `/trend/{video_id}` | GET | Get single video details |
| `/clusters` | GET | Get all topic clusters |
| `/clusters/{cluster_id}` | GET | Get cluster with videos |

### Frontend Features

- ✅ Real-time backend integration
- ✅ Automatic health check and fallback
- ✅ Live data loading with loading states
- ✅ Status indicator (connected/mock data)
- ✅ Refresh button to reload data
- ✅ Responsive design (mobile + desktop)

## 📚 Documentation

- **[Backend README](backend/README.md)** - Detailed backend setup and API reference
- **[Integration Guide](INTEGRATION.md)** - Full stack integration instructions
- **[Implementation Summary](IMPLEMENTATION_SUMMARY.md)** - Complete feature overview
- **[API Docs](http://localhost:8000/docs)** - Interactive Swagger UI (when running)

## 🧪 Testing

### Test Backend

```bash
# Health check
curl http://localhost:8000/health

# Get trends
curl http://localhost:8000/trends?page=1&page_size=5

# Get clusters
curl http://localhost:8000/clusters
```

### Test Frontend

1. Open http://localhost:5173
2. Check status indicator (green = connected, amber = mock data)
3. Click refresh button to reload data
4. Stop backend → should show "Using Mock Data"

## 🔧 Configuration

### Backend (.env)

```bash
YOUTUBE_API_KEY=your_key_here
TRENDING_REGION_CODE=US
MAX_TRENDING_RESULTS=50
CLUSTERING_MIN_SAMPLES=3
CLUSTERING_EPS=0.3
```

### Frontend (.env.local)

```bash
VITE_API_URL=http://localhost:8000
GEMINI_API_KEY=your_gemini_key_here
```

## 📈 Performance

- **Backend first run**: 2-3 minutes (downloads ML model)
- **Subsequent runs**: 30-60 seconds
- **API response time**: <100ms
- **Database size**: ~5-10MB for 100 videos
- **YouTube API quota**: ~300 units per run (10,000 free daily)

## 🐛 Troubleshooting

### "No videos ingested"
- Check YouTube API key is valid
- Verify YouTube Data API v3 is enabled in Google Cloud Console

### "Backend Connected but no data"
- Run the pipeline: `cd backend && python main.py`

### CORS errors
- Backend has CORS enabled for all origins in development
- Verify backend is running on port 8000

### Port already in use
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9
```

## 🚀 Deployment

### Backend (Production)

```bash
# Use production ASGI server
pip install gunicorn
gunicorn api.server:app -w 4 -k uvicorn.workers.UvicornWorker

# Or use Docker
docker build -t trendpulse-backend backend/
docker run -p 8000:8000 -e YOUTUBE_API_KEY=xxx trendpulse-backend
```

### Frontend (Production)

```bash
# Build for production
npm run build

# Serve with nginx or any static host
# Update VITE_API_URL to production backend URL
```

## 🔮 Future Enhancements

- [ ] Add more data sources (TikTok, Instagram)
- [ ] Implement time-series trend detection
- [ ] Add sentiment analysis
- [ ] Build recommendation engine
- [ ] Add user authentication
- [ ] Migrate to PostgreSQL + pgvector
- [ ] Add caching layer (Redis)
- [ ] Add monitoring (Prometheus + Grafana)

## 🤝 Contributing

This is an MVP project. Contributions welcome!

## 📝 License

MIT License - Free for commercial and personal use

## 🙏 Acknowledgments

Built with:
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [sentence-transformers](https://www.sbert.net/) - State-of-the-art embeddings
- [React](https://reactjs.org/) - UI framework
- [YouTube Data API v3](https://developers.google.com/youtube/v3) - Video data

---

**View your app in AI Studio:** https://ai.studio/apps/temp/1

**Built with ❤️ by senior backend + ML engineers**
