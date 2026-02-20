# 🚀 How to Launch TrendPulse Locally

## ⚡ Quick Answer: Do You Need to Rebuild?

**NO REBUILD NEEDED!** ✅ The changes were Python-only. Just update your API key and launch!

---

## 🎯 Super Quick Start (Copy-Paste)

```bash
# 1. Get API key from: https://rapidapi.com/Glavier/api/youtube138 (FREE)

# 2. Set API key
cd backend
echo "RAPIDAPI_KEY=your_key_here" > .env

# 3. Test it (optional)
source venv/bin/activate
python test_api.py

# 4. Start backend (Terminal 1) - Use the launch script!
./start.sh

# OR manually:
# source venv/bin/activate
# python -m uvicorn api.server:app --host 0.0.0.0 --port 8000 --reload

# 5. Start frontend (Terminal 2 - in root directory)
cd ..
npm run dev

# 6. Open http://localhost:5173 in browser
```

---

## Step-by-Step Launch Instructions

### Prerequisites Check

Before starting, make sure you have:
- ✅ **Python 3.9+** installed (`python --version`)
- ✅ **Node.js 18+** installed (`node --version`)
- ✅ **RapidAPI Key** ([Get FREE key here](https://rapidapi.com/Glavier/api/youtube138))

---

## 🔧 Backend Setup (First Time Only)

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Create Virtual Environment

```bash
# Create virtual environment
python -m venv venv

# Activate it
source venv/bin/activate  # Mac/Linux
# OR
venv\Scripts\activate     # Windows
```

You should see `(venv)` in your terminal prompt.

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

This will take 2-3 minutes and install:
- FastAPI (web framework)
- sentence-transformers (ML model)
- YouTube API client
- SQLite database tools

### 4. Configure RapidAPI Key

**Get Your FREE API Key (2 minutes):**

1. Visit https://rapidapi.com/Glavier/api/youtube138
2. Click "Subscribe to Test"
3. Choose **FREE** plan (500 requests/month)
4. Copy your API key

**Add to Backend:**

```bash
# Quick method - create .env file with your key
echo "RAPIDAPI_KEY=your_actual_key_here" > .env

# OR manual method
nano .env
# Add this line:
# RAPIDAPI_KEY=your_actual_key_here
```

Replace `your_actual_key_here` with your actual RapidAPI key.

### 5. Test API Connection (Optional but Recommended)

```bash
python test_api.py
```

You should see:
```
🧪 Testing RapidAPI YouTube Integration
✅ API Key found: xxxxxxxxxx...
✅ API key is valid!
✅ Found 5 videos!

📹 Sample videos:
1. Luis Fonsi - Despacito ft. Daddy Yankee
   Channel: Luis Fonsi
   Views: 8,920,475,284
```

### 6. Run the Data Pipeline (First Time)

```bash
python main.py
```

This will:
- ✅ Fetch trending YouTube videos via RapidAPI
- ✅ Compute all metrics (views_per_hour, engagement, etc.)
- ✅ Download ML model (~80MB, first time only)
- ✅ Generate embeddings
- ✅ Cluster videos by topic
- ✅ Create SQLite database in `data/trends.db`

**Expected time:** 2-3 minutes first run, 30-60 seconds after

You should see output like:
```
🚀 VIDEO TRENDS ANALYZER - FULL PIPELINE
📦 Initializing database...
✅ Database ready: ./data/trends.db

STEP 1: DATA INGESTION (RapidAPI YouTube138)
🔑 Testing RapidAPI key...
✅ RapidAPI key is valid
🔄 Starting ingestion...
📊 Searching for trending videos...
✅ Ingested 50 trending videos
🔍 Searching for recent popular videos...
✅ Ingested 50 search results
🎉 Total videos ingested: 100

STEP 2: FEATURE ENGINEERING
🔧 Computing features for all videos...
✅ Computed features for 100 videos

STEP 3: MACHINE LEARNING
🤖 Loading embedding model: all-MiniLM-L6-v2
✅ Model loaded successfully
🎯 Clustering videos...
✅ Clustering complete: 8 clusters created

✅ PIPELINE COMPLETE!
📊 Videos processed: 100
🔧 Features computed: 100
🤖 Embeddings generated: 100
🎯 Clusters created: 8
```

---

## 🌐 Frontend Setup (First Time Only)

### 1. Open New Terminal

Keep the backend terminal open, open a **new terminal window**.

### 2. Navigate to Project Root

```bash
cd /path/to/trendpulse
# (The main project directory, NOT the backend folder)
```

### 3. Install Dependencies

```bash
npm install
```

This installs React, TypeScript, and other frontend dependencies.

### 4. Verify Environment Variables

Check that `.env.local` exists and contains:
```bash
VITE_API_URL=http://localhost:8000
```

(The GEMINI_API_KEY is optional and not required for core functionality)

---

## ▶️ Launch Both Services

### Terminal 1: Start Backend API

**Option A: Using the launch script (Easiest)**
```bash
cd backend
./start.sh
```

**Option B: Manual launch**
```bash
cd backend
source venv/bin/activate  # ⚠️ IMPORTANT: Must activate venv first!
python -m uvicorn api.server:app --host 0.0.0.0 --port 8000 --reload
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
✅ Database initialized: ./data/trends.db
INFO:     Application startup complete.
```

**Backend is now running at:** http://localhost:8000

### Terminal 2: Start Frontend

```bash
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

**Frontend is now running at:** http://localhost:5173

---

## ✅ Verify Everything Works

### 1. Test Backend API

Open in browser: http://localhost:8000/health

You should see:
```json
{
  "status": "healthy",
  "database": "connected",
  "video_count": 100,
  "timestamp": "2024-01-27T12:00:00Z"
}
```

### 2. Test API Documentation

Open in browser: http://localhost:8000/docs

You should see interactive Swagger UI with all endpoints.

### 3. Test Frontend

Open in browser: http://localhost:5173

You should see:
- ✅ TrendPulse dashboard
- ✅ Green "Backend Connected" indicator (bottom left)
- ✅ List of video clusters on the left
- ✅ Cluster details on the right

---

## 🔄 Daily Usage (After Initial Setup)

Once everything is set up, you only need to:

### Terminal 1: Start Backend
```bash
cd backend
./start.sh

# OR manually:
# source venv/bin/activate
# python -m uvicorn api.server:app --reload
```

### Terminal 2: Start Frontend
```bash
npm run dev
```

That's it! Both services will start in seconds.

---

## 🔄 Refresh Data (Optional)

To get fresh YouTube data:

```bash
# In backend directory with venv activated
python main.py
```

Then click the refresh button in the UI, or restart the backend.

---

## 🛑 Stop Services

### Stop Backend
Press `CTRL+C` in Terminal 1

### Stop Frontend
Press `CTRL+C` in Terminal 2

### Deactivate Virtual Environment
```bash
deactivate
```

---

## 🐛 Troubleshooting

### "Command not found: python"
Try `python3` instead of `python`

### "Port 8000 already in use"
```bash
# Kill the process
lsof -ti:8000 | xargs kill -9
```

### "No videos ingested"
- Check your RapidAPI key is correct in `backend/.env`
- Verify you subscribed to the YouTube138 API on RapidAPI
- Check your API quota (500 requests/month on free tier)
- Test with: `cd backend && python test_api.py`

### "Backend Connected but no data"
Run the pipeline first:
```bash
cd backend
python main.py
```

### Frontend shows "Using Mock Data"
- Check backend is running on port 8000
- Check `VITE_API_URL=http://localhost:8000` in `.env.local`
- Restart frontend after changing `.env.local`

### "Module not found" errors
```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
npm install
```

---

## 📊 What You'll See

### Backend Terminal
```
INFO:     127.0.0.1:xxxxx - "GET /health HTTP/1.1" 200 OK
INFO:     127.0.0.1:xxxxx - "GET /clusters HTTP/1.1" 200 OK
```

### Frontend Terminal
```
  ➜  Local:   http://localhost:5173/
```

### Browser (Frontend)
- Dashboard with trending video clusters
- Real-time data from YouTube
- ML-generated topic clusters
- Engagement metrics and trend scores

---

## 🎉 Success!

You should now have:
- ✅ Backend API running on http://localhost:8000
- ✅ Frontend UI running on http://localhost:5173
- ✅ Real YouTube data with ML clustering
- ✅ Interactive API docs at http://localhost:8000/docs

**Enjoy analyzing trends!** 🚀

---

## 📚 Next Steps

- Explore the API docs: http://localhost:8000/docs
- Read the full documentation: `INTEGRATION.md`
- Check backend details: `backend/README.md`
- View implementation summary: `IMPLEMENTATION_SUMMARY.md`
