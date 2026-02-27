"""
TikTok data ingestion using Scraptik on RapidAPI.
Scraptik is the most reliable and maintained TikTok API on RapidAPI.
Free tier available at: https://rapidapi.com/scraptik-api-scraptik-api-default/api/scraptik
"""
import httpx
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import json
from config import settings
from database.db import get_db


class TikTokIngester:
    """Handles data ingestion from TikTok via Scraptik on RapidAPI."""
    
    BASE_URL = "https://scraptik.p.rapidapi.com"
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.headers = {
            "X-RapidAPI-Key": api_key,
            "X-RapidAPI-Host": "scraptik.p.rapidapi.com"
        }
    
    async def test_api_key(self) -> bool:
        """Test if the RapidAPI key works for Scraptik TikTok."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/search-video",
                    headers=self.headers,
                    params={"keyword": "trending", "count": 1},
                    timeout=10.0
                )
                # 200 = success, 429 = rate limited but key is valid
                return response.status_code in (200, 429)
        except Exception as e:
            print(f"TikTok Scraptik API test failed: {e}")
            return False
    
    async def search_trending_videos(self, keywords: str = "trending", max_results: int = 30) -> List[Dict[str, Any]]:
        """
        Search for trending TikTok videos via Scraptik.
        
        Args:
            keywords: Search keywords
            max_results: Maximum number of videos to fetch
        
        Returns:
            List of video data dictionaries
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/search-video",
                    headers=self.headers,
                    params={
                        "keyword": keywords,
                        "count": min(max_results, 30),
                        "offset": 0,
                        "sort_type": 0,  # 0 = relevance
                        "publish_time": 1,  # 1 = last 24h, 7 = last week
                    },
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    print(f"TikTok Scraptik API error: {response.status_code} - {response.text[:200]}")
                    return []
                
                data = response.json()
                
                # Scraptik returns data in 'data' array or 'item_list'
                items = []
                if isinstance(data, dict):
                    items = data.get("data", []) or data.get("item_list", []) or data.get("videos", [])
                    # Some responses nest inside 'data' -> list
                    if isinstance(items, dict):
                        items = items.get("videos", []) or items.get("items", [])
                elif isinstance(data, list):
                    items = data
                
                # Parse videos from response
                videos = []
                for item in items[:max_results]:
                    video_data = self._parse_tiktok_video(item)
                    if video_data:
                        videos.append(video_data)
                
                # Store in database
                if videos:
                    await self._store_videos(videos)
                
                return videos
        
        except Exception as e:
            print(f"TikTok search error: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    async def get_trending_feed(self, count: int = 30) -> List[Dict[str, Any]]:
        """
        Get TikTok trending/For You feed via Scraptik.
        
        Args:
            count: Number of videos to fetch
        
        Returns:
            List of video data dictionaries
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/trending-feed",
                    headers=self.headers,
                    params={"count": min(count, 30)},
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    print(f"TikTok trending feed error: {response.status_code} - {response.text[:200]}")
                    return []
                
                data = response.json()
                
                items = []
                if isinstance(data, dict):
                    items = data.get("aweme_list", []) or data.get("item_list", []) or data.get("data", [])
                elif isinstance(data, list):
                    items = data
                
                videos = []
                for item in items[:count]:
                    video_data = self._parse_tiktok_video(item)
                    if video_data:
                        videos.append(video_data)
                
                if videos:
                    await self._store_videos(videos)
                
                return videos
        
        except Exception as e:
            print(f"TikTok trending feed error: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    async def get_trending_hashtags(self) -> List[str]:
        """Get trending hashtags to search for."""
        return [
            "fyp",
            "viral",
            "trending",
            "foryou",
            "comedy",
            "dance",
            "food",
            "diy",
            "tutorial",
            "lifehack"
        ]
    
    def _parse_tiktok_video(self, item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Parse TikTok video data from Scraptik response into our schema."""
        try:
            # Scraptik can return data in different shapes
            # Handle aweme_list format (common in trending-feed)
            video_info = item.get("video", {}) or {}
            author_info = item.get("author", {}) or {}
            stats = item.get("statistics", {}) or item.get("stats", {}) or {}
            
            # Video ID - try multiple fields
            video_id = (
                item.get("aweme_id") or
                item.get("id") or
                item.get("video_id") or
                str(item.get("item_id", ""))
            )
            if not video_id:
                return None
            
            # Title/Description
            title = (
                item.get("desc", "") or
                item.get("description", "") or
                item.get("title", "")
            )
            if not title:
                title = f"TikTok Video {video_id}"
            
            # Author/Channel
            channel_id = (
                author_info.get("uid", "") or
                author_info.get("id", "") or
                author_info.get("sec_uid", "")
            )
            channel_title = (
                author_info.get("nickname", "") or
                author_info.get("unique_id", "") or
                author_info.get("uniqueId", "")
            )
            
            # Published date
            create_time = item.get("create_time", 0) or item.get("createTime", 0)
            if create_time and isinstance(create_time, (int, float)) and create_time > 1000000000:
                published_at = datetime.utcfromtimestamp(create_time).isoformat()
            else:
                published_at = datetime.utcnow().isoformat()
            
            # Thumbnail
            cover = (
                video_info.get("cover", {}) if isinstance(video_info.get("cover"), dict)
                else video_info.get("cover", "")
            )
            if isinstance(cover, dict):
                thumbnail_url = cover.get("url_list", [""])[0] if cover.get("url_list") else ""
            elif isinstance(cover, str):
                thumbnail_url = cover
            else:
                thumbnail_url = video_info.get("dynamicCover", "") or video_info.get("origin_cover", {}).get("url_list", [""])[0] if isinstance(video_info.get("origin_cover"), dict) else ""
            
            # Duration
            duration_seconds = (
                video_info.get("duration", 0) or
                item.get("duration", 0)
            )
            if isinstance(duration_seconds, (int, float)) and duration_seconds > 0:
                # Duration might be in milliseconds
                if duration_seconds > 1000:
                    duration_seconds = duration_seconds // 1000
                minutes = int(duration_seconds) // 60
                seconds = int(duration_seconds) % 60
                duration = f"{minutes}:{seconds:02d}"
            else:
                duration = "0:15"
            
            # Stats - try multiple field names (Scraptik varies)
            view_count = int(
                stats.get("play_count", 0) or
                stats.get("playCount", 0) or
                stats.get("digg_count", 0) or
                0
            )
            like_count = int(
                stats.get("digg_count", 0) or
                stats.get("diggCount", 0) or
                stats.get("like_count", 0) or
                stats.get("likeCount", 0) or
                0
            )
            comment_count = int(
                stats.get("comment_count", 0) or
                stats.get("commentCount", 0) or
                0
            )
            
            # Hashtags as tags
            challenges = item.get("challenges", []) or item.get("text_extra", []) or []
            tags = []
            for tag in challenges:
                tag_title = tag.get("title", "") or tag.get("hashtag_name", "")
                if tag_title:
                    tags.append(tag_title)
            tags_json = json.dumps(tags[:20]) if tags else "[]"
            
            return {
                "video_id": f"tiktok_{video_id}",
                "title": title[:500],
                "description": title,
                "channel_id": str(channel_id),
                "channel_title": channel_title,
                "published_at": published_at,
                "thumbnail_url": thumbnail_url if isinstance(thumbnail_url, str) else "",
                "duration": duration,
                "category_id": "tiktok",
                "tags": tags_json,
                "view_count": view_count,
                "like_count": like_count,
                "comment_count": comment_count,
                "platform": "tiktok",
                "ingested_at": datetime.utcnow().isoformat(),
                "last_updated": datetime.utcnow().isoformat()
            }
        
        except Exception as e:
            print(f"Error parsing TikTok video: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    async def _store_videos(self, videos: List[Dict[str, Any]]):
        """Store TikTok videos in database (upsert)."""
        db = await get_db()
        
        for video in videos:
            # Check if video exists
            existing = await db.fetch_one(
                "SELECT video_id FROM videos WHERE video_id = ?",
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


async def run_tiktok_ingestion(api_key: str) -> int:
    """Main TikTok ingestion pipeline using Scraptik on RapidAPI."""
    print("🎵 Starting TikTok ingestion via Scraptik...")
    
    ingester = TikTokIngester(api_key)
    
    # Test API key
    print("🔑 Testing TikTok Scraptik API access...")
    if not await ingester.test_api_key():
        print("⚠️  TikTok Scraptik API not available. Skipping TikTok ingestion.")
        return 0
    
    print("✅ TikTok Scraptik API is accessible")
    
    total_videos = 0
    
    # First, try to get the trending feed
    print("📊 Fetching TikTok trending feed...")
    trending = await ingester.get_trending_feed(count=20)
    total_videos += len(trending)
    print(f"✅ Got {len(trending)} trending videos")
    
    # Then search for videos with trending hashtags
    hashtags = await ingester.get_trending_hashtags()
    
    for hashtag in hashtags[:5]:
        print(f"🔍 Searching TikTok for: #{hashtag}")
        videos = await ingester.search_trending_videos(
            keywords=hashtag,
            max_results=10
        )
        total_videos += len(videos)
        print(f"✅ Found {len(videos)} videos for #{hashtag}")
    
    print(f"🎉 Total TikTok videos ingested: {total_videos}")
    return total_videos
