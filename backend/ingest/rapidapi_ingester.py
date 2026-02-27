"""
YouTube Data API v3 ingestion module.
Fetches trending videos and search results using the official YouTube API.
Free tier: 10,000 quota units/day (trending list = 1 unit, search = 100 units).
Get your free API key: https://console.cloud.google.com/apis/credentials
Enable: YouTube Data API v3
"""
import httpx
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import json
import re
from config import settings
from database.db import get_db


class YouTubeDataAPIIngester:
    """Handles data ingestion from the official YouTube Data API v3."""
    
    BASE_URL = "https://www.googleapis.com/youtube/v3"
    
    def __init__(self, api_key: str):
        self.api_key = api_key
    
    async def test_api_key(self) -> bool:
        """Test if the YouTube API key is valid."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/videos",
                    params={
                        "part": "snippet",
                        "chart": "mostPopular",
                        "regionCode": "US",
                        "maxResults": 1,
                        "key": self.api_key
                    },
                    timeout=10.0
                )
                return response.status_code == 200
        except Exception as e:
            print(f"YouTube API key test failed: {e}")
            return False
    
    async def ingest_trending_videos(self, country: str = "US", max_results: int = 50) -> List[Dict[str, Any]]:
        """
        Fetch trending/most-popular videos using chart=mostPopular.
        Costs only 1 quota unit per call.
        
        Args:
            country: ISO 3166-1 alpha-2 country code
            max_results: Maximum number of videos (max 50 per page)
        
        Returns:
            List of video data dictionaries
        """
        try:
            all_videos = []
            page_token = None
            remaining = min(max_results, 200)
            
            async with httpx.AsyncClient() as client:
                while remaining > 0:
                    per_page = min(remaining, 50)
                    params = {
                        "part": "snippet,statistics,contentDetails",
                        "chart": "mostPopular",
                        "regionCode": country,
                        "maxResults": per_page,
                        "key": self.api_key
                    }
                    if page_token:
                        params["pageToken"] = page_token
                    
                    response = await client.get(
                        f"{self.BASE_URL}/videos",
                        params=params,
                        timeout=30.0
                    )
                    
                    if response.status_code != 200:
                        print(f"YouTube API error: {response.status_code} - {response.text[:200]}")
                        break
                    
                    data = response.json()
                    
                    for item in data.get("items", []):
                        video_data = self._parse_video_item(item)
                        if video_data:
                            all_videos.append(video_data)
                    
                    page_token = data.get("nextPageToken")
                    if not page_token:
                        break
                    remaining -= per_page
            
            # Store in database
            if all_videos:
                await self._store_videos(all_videos)
            
            return all_videos
        
        except Exception as e:
            print(f"YouTube trending error: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    async def search_videos(self, query: str = "trending", max_results: int = 25) -> List[Dict[str, Any]]:
        """
        Search for videos. Costs 100 quota units per call, so use sparingly.
        
        Args:
            query: Search query
            max_results: Maximum number of videos
        
        Returns:
            List of video data dictionaries
        """
        try:
            async with httpx.AsyncClient() as client:
                # Step 1: Search for video IDs (100 units)
                search_params = {
                    "part": "id",
                    "q": query,
                    "type": "video",
                    "order": "viewCount",
                    "publishedAfter": (datetime.utcnow() - timedelta(hours=settings.search_published_after_hours)).strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "maxResults": min(max_results, 50),
                    "key": self.api_key
                }
                
                search_response = await client.get(
                    f"{self.BASE_URL}/search",
                    params=search_params,
                    timeout=30.0
                )
                
                if search_response.status_code != 200:
                    print(f"YouTube search error: {search_response.status_code} - {search_response.text[:200]}")
                    return []
                
                search_data = search_response.json()
                video_ids = [
                    item["id"]["videoId"]
                    for item in search_data.get("items", [])
                    if item.get("id", {}).get("videoId")
                ]
                
                if not video_ids:
                    return []
                
                # Step 2: Get full details for those video IDs (1 unit)
                details_response = await client.get(
                    f"{self.BASE_URL}/videos",
                    params={
                        "part": "snippet,statistics,contentDetails",
                        "id": ",".join(video_ids),
                        "key": self.api_key
                    },
                    timeout=30.0
                )
                
                if details_response.status_code != 200:
                    print(f"YouTube details error: {details_response.status_code}")
                    return []
                
                details_data = details_response.json()
                
                videos = []
                for item in details_data.get("items", []):
                    video_data = self._parse_video_item(item)
                    if video_data:
                        videos.append(video_data)
                
                # Store in database
                if videos:
                    await self._store_videos(videos)
                
                return videos
        
        except Exception as e:
            print(f"YouTube search error: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def _parse_video_item(self, item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Parse YouTube Data API v3 video item into our schema."""
        try:
            video_id = item.get("id")
            if isinstance(video_id, dict):
                video_id = video_id.get("videoId")
            if not video_id:
                return None
            
            snippet = item.get("snippet", {})
            statistics = item.get("statistics", {})
            content_details = item.get("contentDetails", {})
            
            # Title & description
            title = snippet.get("title", "")
            description = snippet.get("description", "")
            
            # Channel info
            channel_id = snippet.get("channelId", "")
            channel_title = snippet.get("channelTitle", "")
            
            # Published date (ISO 8601)
            published_at = snippet.get("publishedAt", datetime.utcnow().isoformat())
            
            # Thumbnail (prefer high > medium > default)
            thumbnails = snippet.get("thumbnails", {})
            thumbnail_url = ""
            for quality in ["high", "medium", "default"]:
                if quality in thumbnails:
                    thumbnail_url = thumbnails[quality].get("url", "")
                    break
            
            # Duration (ISO 8601 duration like PT4M13S)
            duration_iso = content_details.get("duration", "PT0S")
            duration = self._parse_iso_duration(duration_iso)
            
            # Category
            category_id = snippet.get("categoryId", "0")
            
            # Tags
            tags = snippet.get("tags", [])
            tags_json = json.dumps(tags[:20]) if tags else "[]"
            
            # Statistics (exact counts from the API)
            view_count = int(statistics.get("viewCount", 0))
            like_count = int(statistics.get("likeCount", 0))
            comment_count = int(statistics.get("commentCount", 0))
            
            return {
                "video_id": video_id,
                "title": title,
                "description": description[:1000],
                "channel_id": channel_id,
                "channel_title": channel_title,
                "published_at": published_at,
                "thumbnail_url": thumbnail_url,
                "duration": duration,
                "category_id": category_id,
                "tags": tags_json,
                "view_count": view_count,
                "like_count": like_count,
                "comment_count": comment_count,
                "ingested_at": datetime.utcnow().isoformat(),
                "last_updated": datetime.utcnow().isoformat()
            }
        
        except Exception as e:
            print(f"Error parsing YouTube video item: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    @staticmethod
    def _parse_iso_duration(iso_duration: str) -> str:
        """Convert ISO 8601 duration (PT4M13S) to human-readable (4:13)."""
        try:
            match = re.match(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", iso_duration)
            if not match:
                return "0:00"
            hours = int(match.group(1) or 0)
            minutes = int(match.group(2) or 0)
            seconds = int(match.group(3) or 0)
            if hours > 0:
                return f"{hours}:{minutes:02d}:{seconds:02d}"
            return f"{minutes}:{seconds:02d}"
        except Exception:
            return "0:00"
    
    async def _store_videos(self, videos: List[Dict[str, Any]]):
        """Store videos in database (upsert)."""
        db = await get_db()
        
        for video in videos:
            # Check if video exists
            existing = await db.fetch_one(
                "SELECT video_id, view_count FROM videos WHERE video_id = ?",
                (video["video_id"],)
            )
            
            if existing:
                # Update existing video
                await db.execute("""
                    UPDATE videos SET
                        title = ?,
                        description = ?,
                        view_count = ?,
                        like_count = ?,
                        comment_count = ?,
                        last_updated = ?
                    WHERE video_id = ?
                """, (
                    video["title"],
                    video["description"],
                    video["view_count"],
                    video["like_count"],
                    video["comment_count"],
                    video["last_updated"],
                    video["video_id"]
                ))
            else:
                # Insert new video
                await db.execute("""
                    INSERT INTO videos (
                        video_id, title, description, channel_id, channel_title,
                        published_at, thumbnail_url, duration, category_id, tags,
                        view_count, like_count, comment_count, ingested_at, last_updated
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    video["video_id"],
                    video["title"],
                    video["description"],
                    video["channel_id"],
                    video["channel_title"],
                    video["published_at"],
                    video["thumbnail_url"],
                    video["duration"],
                    video["category_id"],
                    video["tags"],
                    video["view_count"],
                    video["like_count"],
                    video["comment_count"],
                    video["ingested_at"],
                    video["last_updated"]
                ))


async def run_ingestion(api_key: Optional[str] = None):
    """Main YouTube ingestion pipeline using YouTube Data API v3."""
    from config import get_youtube_api_key
    # Use provided API key or fall back to settings
    api_key = api_key or get_youtube_api_key()
    
    if not api_key:
        print("❌ No YouTube API key provided. Please set YOUTUBE_API_KEY or provide via UI.")
        return 0
    
    ingester = YouTubeDataAPIIngester(api_key)
    
    # Test API key first
    print("🔑 Testing YouTube Data API v3 key...")
    if not await ingester.test_api_key():
        print("❌ Invalid YouTube API key. Please check your key and try again.")
        return 0
    
    print("✅ YouTube API key is valid")
    print("🔄 Starting YouTube ingestion...")
    
    # Fetch trending videos (costs only 1 quota unit per page!)
    print("📊 Fetching YouTube Trending (mostPopular)...")
    trending = await ingester.ingest_trending_videos(
        country=settings.trending_region_code,
        max_results=settings.max_trending_results
    )
    print(f"✅ Ingested {len(trending)} trending videos")
    
    # Search for category-specific popular videos (100 units each)
    print("🔍 Searching for category-specific popular videos...")
    search_queries = ["tech", "gaming", "music", "news"]
    search_videos = []
    
    for query in search_queries:
        results = await ingester.search_videos(
            query=query,
            max_results=settings.max_search_results // len(search_queries)
        )
        search_videos.extend(results)
    
    print(f"✅ Ingested {len(search_videos)} search results")
    
    total = len(trending) + len(search_videos)
    print(f"🎉 Total YouTube videos ingested: {total}")
    
    return total
