# 🔑 RapidAPI Integration Guide

## Overview

TrendPulse now uses **RapidAPI YouTube V2** instead of YouTube Data API v3. This provides:
- ✅ **No Google Cloud setup required**
- ✅ **Easier API key management**
- ✅ **UI-based configuration** (no .env file editing needed)
- ✅ **Production-ready** (users can set their own keys)
- ✅ **Free tier available** (500 requests/month)

---

## 🚀 Quick Start

### 1. Get Your RapidAPI Key

1. Visit [RapidAPI YouTube V2](https://rapidapi.com/ytdlfree/api/youtube-v2)
2. Sign up or log in (free account)
3. Click **"Subscribe to Test"**
4. Choose the **Basic (Free)** plan
5. Copy your **X-RapidAPI-Key**

### 2. Configure via UI (Recommended)

**For Production/End Users:**

1. Start the backend: `cd backend && python -m uvicorn api.server:app --reload`
2. Start the frontend: `npm run dev`
3. Open http://localhost:5173
4. Click **Settings** (gear icon in sidebar)
5. Paste your RapidAPI key
6. Click **"Save & Validate"**
7. Click **"Run Pipeline"** to fetch data

✅ **Done!** Your API key is validated and stored in backend memory.

### 3. Configure via .env (Optional)

**For Development:**

```bash
cd backend
cp .env.example .env
# Edit .env and add:
RAPIDAPI_KEY=your_rapidapi_key_here
```

Then run the pipeline:
```bash
python main.py
```

---

## 🎯 How It Works

### Backend Changes

1. **New Ingester**: `backend/ingest/rapidapi_ingester.py`
   - Uses RapidAPI YouTube V2 endpoints
   - Supports trending videos and search
   - Validates API keys before use

2. **Runtime API Key Storage**: `backend/config.py`
   - API keys can be set via UI
   - Stored in memory (not persisted to disk)
   - Falls back to .env if not set via UI

3. **New API Endpoints**: `backend/api/server.py`
   - `POST /api/set-api-key` - Set and validate API key
   - `GET /api/check-api-key` - Check if key is configured
   - `POST /api/run-pipeline` - Run ingestion pipeline

### Frontend Changes

1. **Settings Modal**: `components/SettingsModal.tsx`
   - Beautiful UI for API key configuration
   - Real-time validation
   - One-click pipeline execution
   - Instructions and help links

2. **Updated App**: `App.tsx`
   - Settings button in sidebar
   - Modal integration
   - Auto-refresh after key setup

---

## 📊 API Comparison

| Feature | YouTube Data API v3 | RapidAPI YouTube V2 |
|---------|---------------------|---------------------|
| Setup | Google Cloud Console | RapidAPI signup |
| API Key | Complex OAuth setup | Simple API key |
| Free Tier | 10,000 units/day | 500 requests/month |
| Configuration | .env file only | UI + .env |
| Production | Users need Google account | Users need RapidAPI account |
| Quota Management | Per project | Per user |

---

## 🔧 API Endpoints Used

### 1. Trending Videos
```
GET https://youtube-v2.p.rapidapi.com/trending
Parameters:
  - country: US (or any ISO 3166-1 alpha-2 code)
  - lang: en
```

### 2. Search Videos
```
GET https://youtube-v2.p.rapidapi.com/search
Parameters:
  - query: search term
  - country: US
  - lang: en
```

### 3. Video Details
```
GET https://youtube-v2.p.rapidapi.com/video/details
Parameters:
  - video_id: YouTube video ID
```

---

## 💡 Usage Examples

### Via UI (Production)

```
1. User opens TrendPulse
2. Clicks Settings
3. Enters RapidAPI key
4. System validates key
5. User clicks "Run Pipeline"
6. Data is fetched and processed
7. Dashboard shows real trends
```

### Via CLI (Development)

```bash
# Set key in .env
echo "RAPIDAPI_KEY=your_key_here" >> backend/.env

# Run pipeline
cd backend
python main.py

# Start API
python -m uvicorn api.server:app --reload
```

### Via API (Programmatic)

```bash
# Set API key
curl -X POST http://localhost:8000/api/set-api-key \
  -H "Content-Type: application/json" \
  -d '{"api_key": "your_rapidapi_key"}'

# Check if key is set
curl http://localhost:8000/api/check-api-key

# Run pipeline
curl -X POST http://localhost:8000/api/run-pipeline
```

---

## 🔒 Security Notes

### API Key Storage

- **UI Method**: Stored in backend runtime memory only
- **Not persisted**: Key is lost on server restart
- **No disk writes**: More secure for production
- **.env Method**: Stored in .env file (development only)

### Best Practices

1. ✅ **Never commit** .env files to git
2. ✅ **Use UI method** for production deployments
3. ✅ **Rotate keys** regularly
4. ✅ **Monitor usage** on RapidAPI dashboard
5. ✅ **Set rate limits** in production

---

## 📈 Rate Limits

### Free Tier (Basic Plan)
- **500 requests/month**
- **~16 requests/day**
- **Sufficient for**: Testing, small projects
- **Cost**: $0/month

### Pro Tier
- **10,000 requests/month**
- **~333 requests/day**
- **Sufficient for**: Production apps
- **Cost**: Check RapidAPI pricing

### Optimization Tips

1. **Cache results**: Store data in database
2. **Batch requests**: Fetch multiple videos at once
3. **Schedule wisely**: Run pipeline once per day
4. **Use search smartly**: Limit search queries

---

## 🐛 Troubleshooting

### "Invalid API key"

**Problem**: API key validation fails

**Solutions**:
1. Check you copied the full key (no spaces)
2. Verify you subscribed to the API on RapidAPI
3. Check your subscription is active
4. Try generating a new key

### "No videos ingested"

**Problem**: Pipeline runs but no data

**Solutions**:
1. Check API key is valid
2. Verify you have remaining quota
3. Check backend logs for errors
4. Try a different region code

### "Rate limit exceeded"

**Problem**: Too many requests

**Solutions**:
1. Wait for quota to reset (monthly)
2. Upgrade to Pro plan
3. Reduce pipeline frequency
4. Use cached data

### "Backend not responding"

**Problem**: UI can't connect to backend

**Solutions**:
1. Ensure backend is running on port 8000
2. Check VITE_API_URL in .env.local
3. Verify CORS is enabled
4. Check firewall settings

---

## 🔄 Migration from YouTube Data API v3

If you were using the old YouTube Data API v3:

### 1. Update Dependencies

```bash
cd backend
pip install -r requirements.txt  # Updated to remove google-api-python-client
```

### 2. Update Configuration

```bash
# Old .env
YOUTUBE_API_KEY=AIza...

# New .env
RAPIDAPI_KEY=your_rapidapi_key
```

### 3. Database Compatible

✅ No database changes needed - same schema works!

### 4. Re-run Pipeline

```bash
python main.py
```

---

## 📚 Additional Resources

- **RapidAPI YouTube V2**: https://rapidapi.com/ytdlfree/api/youtube-v2
- **API Documentation**: Check RapidAPI dashboard
- **Support**: RapidAPI support forum
- **Pricing**: https://rapidapi.com/ytdlfree/api/youtube-v2/pricing

---

## 🎉 Benefits Summary

### For Developers
- ✅ Simpler setup (no Google Cloud)
- ✅ Easier testing (straightforward API key)
- ✅ Better error messages
- ✅ Consistent response format

### For End Users
- ✅ No technical setup required
- ✅ UI-based configuration
- ✅ Instant validation
- ✅ One-click data refresh

### For Production
- ✅ User-managed API keys
- ✅ No shared quota issues
- ✅ Better security (runtime storage)
- ✅ Easier deployment

---

## 🚀 Next Steps

1. Get your RapidAPI key
2. Configure via UI or .env
3. Run the pipeline
4. Start analyzing trends!

**Need help?** Check the main README.md or LAUNCH_GUIDE.md

---

**Built with ❤️ using RapidAPI YouTube V2**
