"""
Debug script to see the actual API response structure.
"""
import asyncio
import httpx
import json
from config import get_youtube_api_key, get_api_key

async def debug_api():
    """Debug the API response to understand the structure."""
    # Test YouTube Data API v3
    youtube_key = get_youtube_api_key()
    if youtube_key:
        print("Testing YouTube Data API v3...")
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://www.googleapis.com/youtube/v3/videos",
                params={
                    "part": "snippet,statistics,contentDetails",
                    "chart": "mostPopular",
                    "regionCode": "US",
                    "maxResults": 5,
                    "key": youtube_key
                },
                timeout=30.0
            )
            
            print(f"YouTube Status: {response.status_code}")
            data = response.json()
            
            with open("api_response_debug.json", "w") as f:
                json.dump(data, f, indent=2)
            
            print("\nFull response saved to api_response_debug.json")
            
            if 'items' in data and len(data['items']) > 0:
                print("\nFirst video structure:")
                print(json.dumps(data['items'][0], indent=2))
    else:
        print("No YOUTUBE_API_KEY set. Skipping YouTube debug.")
    
    # Test TikTok Scraptik API
    rapidapi_key = get_api_key()
    if rapidapi_key:
        print("\nTesting TikTok Scraptik API...")
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://scraptik.p.rapidapi.com/search-video",
                headers={
                    "X-RapidAPI-Key": rapidapi_key,
                    "X-RapidAPI-Host": "scraptik.p.rapidapi.com"
                },
                params={"keyword": "trending", "count": 3},
                timeout=30.0
            )
            print(f"TikTok Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(json.dumps(data, indent=2)[:2000])
    else:
        print("No RAPIDAPI_KEY set. Skipping TikTok debug.")

if __name__ == "__main__":
    asyncio.run(debug_api())
