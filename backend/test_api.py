"""
Quick test script to verify RapidAPI integration.
"""
import asyncio
import sys
from ingest.rapidapi_ingester import RapidAPIYouTubeIngester
from config import get_api_key

async def test_api():
    """Test the RapidAPI YouTube integration."""
    print("=" * 60)
    print("🧪 Testing RapidAPI YouTube Integration")
    print("=" * 60)
    
    # Get API key
    api_key = get_api_key()
    if not api_key:
        print("❌ No API key found in .env file")
        print("   Please set RAPIDAPI_KEY in backend/.env")
        return False
    
    print(f"✅ API Key found: {api_key[:10]}...")
    
    # Create ingester
    ingester = RapidAPIYouTubeIngester(api_key)
    
    # Test API key
    print("\n🔑 Testing API key validity...")
    is_valid = await ingester.test_api_key()
    
    if not is_valid:
        print("❌ API key is invalid or API is not responding")
        return False
    
    print("✅ API key is valid!")
    
    # Test search
    print("\n🔍 Testing search for 'despacito'...")
    try:
        videos = await ingester.search_videos(query="despacito", max_results=5)
        
        if not videos:
            print("⚠️  No videos returned from search")
            return False
        
        print(f"✅ Found {len(videos)} videos!")
        print("\n📹 Sample videos:")
        for i, video in enumerate(videos[:3], 1):
            print(f"\n{i}. {video['title']}")
            print(f"   Channel: {video['channel_title']}")
            print(f"   Views: {video['view_count']:,}")
            print(f"   Video ID: {video['video_id']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Search failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_api())
    sys.exit(0 if success else 1)
