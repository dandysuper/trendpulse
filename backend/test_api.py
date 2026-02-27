"""
Quick test script to verify YouTube and TikTok API integration.
"""
import asyncio
import sys
from ingest.rapidapi_ingester import YouTubeDataAPIIngester
from ingest.tiktok_ingester import TikTokIngester
from config import get_api_key, get_youtube_api_key

async def test_api():
    """Test YouTube Data API v3 and TikTok Scraptik integration."""
    success = False
    
    # --- YouTube Data API v3 ---
    print("=" * 60)
    print("🧪 Testing YouTube Data API v3")
    print("=" * 60)
    
    youtube_key = get_youtube_api_key()
    if not youtube_key:
        print("⚠️  No YOUTUBE_API_KEY found in .env")
    else:
        print(f"✅ YouTube key found: {youtube_key[:10]}...")
        ingester = YouTubeDataAPIIngester(youtube_key)
        
        print("\n🔑 Testing YouTube API key...")
        is_valid = await ingester.test_api_key()
        if not is_valid:
            print("❌ YouTube API key is invalid")
        else:
            print("✅ YouTube API key is valid!")
            print("\n� Fetching trending videos...")
            videos = await ingester.ingest_trending_videos(country="US", max_results=5)
            if videos:
                print(f"✅ Found {len(videos)} trending videos!")
                for i, v in enumerate(videos[:3], 1):
                    print(f"  {i}. {v['title']} ({v['view_count']:,} views)")
                success = True
            else:
                print("⚠️  No videos returned")
    
    # --- TikTok Scraptik API ---
    print("\n" + "=" * 60)
    print("🧪 Testing TikTok Scraptik API (RapidAPI)")
    print("=" * 60)
    
    rapidapi_key = get_api_key()
    if not rapidapi_key:
        print("⚠️  No RAPIDAPI_KEY found in .env")
    else:
        print(f"✅ RapidAPI key found: {rapidapi_key[:10]}...")
        tiktok = TikTokIngester(rapidapi_key)
        
        print("\n🔑 Testing TikTok Scraptik API...")
        is_valid = await tiktok.test_api_key()
        if not is_valid:
            print("❌ RapidAPI key is invalid for Scraptik")
        else:
            print("✅ TikTok Scraptik API is accessible!")
            print("\n🔍 Searching TikTok for 'trending'...")
            videos = await tiktok.search_trending_videos(keywords="trending", max_results=5)
            if videos:
                print(f"✅ Found {len(videos)} TikTok videos!")
                for i, v in enumerate(videos[:3], 1):
                    print(f"  {i}. {v['title'][:60]}... ({v['view_count']:,} views)")
                success = True
            else:
                print("⚠️  No TikTok videos returned")
    
    return success

if __name__ == "__main__":
    success = asyncio.run(test_api())
    sys.exit(0 if success else 1)
