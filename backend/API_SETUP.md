# TrendPulse Backend - RapidAPI YouTube138 Integration

## Overview

This backend uses the **RapidAPI YouTube138** API to fetch trending YouTube videos and analyze them using machine learning.

## Getting Your API Key

1. **Sign up for RapidAPI** (if you haven't already):
   - Go to [https://rapidapi.com/](https://rapidapi.com/)
   - Create a free account

2. **Subscribe to YouTube138 API**:
   - Visit [https://rapidapi.com/Glavier/api/youtube138](https://rapidapi.com/Glavier/api/youtube138)
   - Click "Subscribe to Test" or "Pricing"
   - Choose the **FREE** plan (includes 500 requests/month)
   - Complete the subscription

3. **Get Your API Key**:
   - After subscribing, go to the API's "Endpoints" tab
   - Your API key will be shown in the code snippets
   - Look for `X-RapidAPI-Key: YOUR_KEY_HERE`

## Setting Up Your API Key

### Option 1: Via Environment File (Recommended for Development)

1. Copy the example environment file:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Edit `backend/.env` and add your API key:
   ```bash
   RAPIDAPI_KEY=your_actual_api_key_here
   ```

### Option 2: Via UI (Recommended for Production)

1. Start the backend server (see below)
2. Open the frontend application
3. Go to **Settings** page
4. Enter your RapidAPI key in the "API Key" field
5. Click "Save" - the key will be validated automatically

## Installation

1. **Create virtual environment**:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up your API key** (see above)

## Running the Backend

### Start the API Server

```bash
cd backend
source venv/bin/activate
python -m uvicorn api.server:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at: `http://localhost:8000`

### Run the Full Pipeline

To ingest data, compute features, and run ML clustering:

```bash
cd backend
source venv/bin/activate
python main.py
```

This will:
1. ✅ Initialize the database
2. 📊 Fetch trending videos from YouTube (via RapidAPI)
3. 🔧 Compute engagement metrics and trend scores
4. 🤖 Generate embeddings and cluster similar videos
5. 🎯 Create trend clusters

## API Endpoints

Once the server is running, visit:
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **Trending Videos**: http://localhost:8000/trends
- **Clusters**: http://localhost:8000/clusters

## Testing the Integration

Run the test script to verify your API key works:

```bash
cd backend
source venv/bin/activate
python test_api.py
```

Expected output:
```
🧪 Testing RapidAPI YouTube Integration
✅ API Key found: xxxxxxxxxx...
✅ API key is valid!
✅ Found 5 videos!
```

## API Usage & Limits

**Free Plan Limits**:
- 500 requests per month
- Rate limit: ~16 requests per day
- Perfect for development and testing

**What counts as a request**:
- Each search query = 1 request
- The backend is optimized to minimize API calls

**Tips to stay within limits**:
- Run the pipeline once per day
- Use the cached database for development
- Upgrade to a paid plan if you need more requests

## Troubleshooting

### "No API key found"
- Make sure you've set `RAPIDAPI_KEY` in `backend/.env`
- Or set it via the UI Settings page

### "API key is invalid"
- Double-check your API key from RapidAPI
- Make sure you've subscribed to the YouTube138 API
- Verify the key has no extra spaces or quotes

### "No videos returned"
- Check your API quota on RapidAPI dashboard
- You may have exceeded the free tier limit
- Wait for the quota to reset (monthly)

### Database errors
- Delete `backend/data/trends.db` and run `python main.py` again
- This will recreate the database from scratch

## Architecture

```
backend/
├── api/
│   └── server.py          # FastAPI REST endpoints
├── ingest/
│   └── rapidapi_ingester.py  # YouTube138 API integration
├── features/
│   └── calculator.py      # Engagement metrics & trend scores
├── ml/
│   ├── embeddings.py      # Sentence transformers
│   ├── deduplication.py   # Similarity detection
│   └── clustering.py      # DBSCAN clustering
├── database/
│   └── db.py             # SQLite async database
├── config.py             # Configuration & settings
└── main.py              # Full pipeline orchestration
```

## Environment Variables

All configurable via `backend/.env`:

```bash
# API Key (Required)
RAPIDAPI_KEY=your_key_here

# Database
DATABASE_PATH=./data/trends.db

# API Server
API_HOST=0.0.0.0
API_PORT=8000

# Ingestion
TRENDING_REGION_CODE=US
MAX_TRENDING_RESULTS=50
MAX_SEARCH_RESULTS=50

# Machine Learning
EMBEDDING_MODEL=all-MiniLM-L6-v2
CLUSTERING_MIN_SAMPLES=3
CLUSTERING_EPS=0.3
```

## Support

- **RapidAPI Issues**: Contact RapidAPI support
- **API Documentation**: https://rapidapi.com/Glavier/api/youtube138
- **Backend Issues**: Check the logs and error messages

## License

MIT License - See LICENSE file for details
