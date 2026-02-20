"""
Debug script to see the actual API response structure.
"""
import asyncio
import httpx
import json
from config import get_api_key

async def debug_api():
    """Debug the API response to understand the structure."""
    api_key = get_api_key()
    
    headers = {
        "X-RapidAPI-Key": api_key,
        "X-RapidAPI-Host": "youtube138.p.rapidapi.com"
    }
    
    print("Testing search endpoint...")
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://youtube138.p.rapidapi.com/search/",
            headers=headers,
            params={"q": "despacito", "hl": "en", "gl": "US"},
            timeout=30.0
        )
        
        print(f"Status: {response.status_code}")
        data = response.json()
        
        # Save full response
        with open("api_response_debug.json", "w") as f:
            json.dump(data, f, indent=2)
        
        print("\nFull response saved to api_response_debug.json")
        
        # Print first video structure
        if 'contents' in data and len(data['contents']) > 0:
            print("\nFirst video structure:")
            print(json.dumps(data['contents'][0], indent=2))

if __name__ == "__main__":
    asyncio.run(debug_api())
