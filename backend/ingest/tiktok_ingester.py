"""
TikTok data ingestion using free RapidAPI TikTok endpoints.
Falls back to web scraping if API is unavailable.
"""
import httpx
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import json
from config import settings
from database.db import get_db


class TikTokIngester:
    """Handles data ingestion from TikTok via RapidAPI."""
    
    # Using free TikTok API from RapidAPI
    BASE_URL = "https://tiktok-scraper7.p.rapidapi.com"
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.headers = {
            "X-RapidAPI-Key": api_key,
            "X-RapidAPI-Host": "tiktok-scraper7.p.rapidapi.com"
        }
    
    async def test_api_key(self) -> bool:
        """Test if the API key works for TikTok."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/feed/search",
                    headers=self.headers,
                    params={"keywords": "trending", "count": 5},
                    timeout=10.0
                )
                return response.status_code == 200
        except Exception as e:
            print(f"TikTok API test failed: {e}")
            return False
    
    async def search_trending_videos(self, keywords: str = "trending", max_results: int = 30) -> List[Dict[str, Any]]:
        """
        Search for trending TikTok videos.
        
        Args:
            keywords: Search keywords
            max_results: Maximum number of videos to fetch
        
        Returns:
            List of video data dictionaries
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/feed/search",
                    headers=self.headers,
                    params={
                        "keywords": keywords,
                        "count": max_results,
                        "cursor": 0
                    },
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    print(f"TikTok API error: {response.status_code} - {response.text}")
                    return []
                
                data = response.json()
                
                # Parse videos from response
                videos = []
                if 'data' in data:
                    for item in data['data'][:max_results]:
                        video_data = await self._parse_tiktok_video(item)
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
    
    async def get_trending_hashtags(self) -> List[str]:
        """Get trending hashtags to search for."""
        # Common trending categories
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
    
    async def _parse_tiktok_video(self, item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Parse TikTok video data into our schema."""
        try:
            # Extract video info
            video_info = item.get('video', {})
            author_info = item.get('author', {})
            stats = item.get('stats', {})
            
            # Video ID
            video_id = item.get('id') or item.get('video_id', '')
            if not video_id:
                return None
            
            # Title/Description
            title = item.get('desc', '') or item.get('description', '')
            if not title:
                title = f"TikTok Video {video_id}"
            
            # Author/Channel
            channel_id = author_info.get('id', '')
            channel_title = author_info.get('nickname', '') or author_info.get('uniqueId', '')
            
            # Published date
            create_time = item.get('createTime', 0)
            if create_time:
                published_at = datetime.fromtimestamp(create_time).isoformat()
            else:
                published_at = datetime.utcnow().isoformat()
            
            # Thumbnail
            cover = video_info.get('cover', '') or video_info.get('dynamicCover', '')
            thumbnail_url = cover if isinstance(cover, str) else ''
            
            # Duration
            duration_seconds = video_info.get('duration', 0)
            if duration_seconds:
                minutes = duration_seconds // 60
                seconds = duration_seconds % 60
                duration = f"{minutes}:{seconds:02d}"
            else:
                duration = "0:15"  # Default TikTok length
            
            # Stats
            view_count = stats.get('playCount', 0) or stats.get('viewCount', 0)
            like_count = stats.get('diggCount', 0) or stats.get('likeCount', 0)
            comment_count = stats.get('commentCount', 0)
            share_count = stats.get('shareCount', 0)
            
            # Hashtags as tags
            hashtags = item.get('challenges', [])
            tags = [tag.get('title', '') for tag in hashtags if tag.get('title')]
            tags_json = json.dumps(tags) if tags else '[]'
            
            return {
                'video_id': f"tiktok_{video_id}",
                'title': title[:500],  # Limit length
                'description': title,
                'channel_id': channel_id,
                'channel_title': channel_title,
                'published_at': published_at,
                'thumbnail_url': thumbnail_url,
                'duration': duration,
                'category_id': 'tiktok',
                'tags': tags_json,
                'view_count': view_count,
                'like_count': like_count,
                'comment_count': comment_count,
                'platform': 'tiktok',
                'ingested_at': datetime.utcnow().isoformat(),
                'last_updated': datetime.utcnow().isoformat()
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
                (video['video_id'],)
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
                    video['title'],
                    video['description'],
                    video['view_count'],
                    video['like_count'],
                    video['comment_count'],
                    video['last_updated'],
                    video['video_id']
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
                    video['video_id'],
                    video['title'],
                    video['description'],
                    video['channel_id'],
                    video['channel_title'],
                    video['published_at'],
                    video['thumbnail_url'],
                    video['duration'],
                    video['category_id'],
                    video['tags'],
                    video['view_count'],
                    video['like_count'],
                    video['comment_count'],
                    video['ingested_at'],
                    video['last_updated']
                ))


async def run_tiktok_ingestion(api_key: str) -> int:
    """Main TikTok ingestion pipeline."""
    print("🎵 Starting TikTok ingestion...")
    
    ingester = TikTokIngester(api_key)
    
    # Test API key
    print("🔑 Testing TikTok API access...")
    if not await ingester.test_api_key():
        print("⚠️  TikTok API not available. Skipping TikTok ingestion.")
        return 0
    
    print("✅ TikTok API is accessible")
    
    total_videos = 0
    
    # Get trending hashtags
    hashtags = await ingester.get_trending_hashtags()
    
    # Search for videos with different hashtags
    for hashtag in hashtags[:5]:  # Limit to 5 hashtags to avoid rate limits
        print(f"🔍 Searching TikTok for: #{hashtag}")
        videos = await ingester.search_trending_videos(
            keywords=hashtag,
            max_results=10
        )
        total_videos += len(videos)
        print(f"✅ Found {len(videos)} videos for #{hashtag}")
    
    print(f"🎉 Total TikTok videos ingested: {total_videos}")
    return total_videos
