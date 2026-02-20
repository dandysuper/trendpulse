"""
YouTube Data API v3 ingestion module.
Fetches trending videos and fast-growing content.
"""
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import json
from config import settings
from database.db import get_db


class YouTubeIngester:
    """Handles data ingestion from YouTube Data API v3."""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.youtube = build('youtube', 'v3', developerKey=api_key)
    
    async def ingest_trending_videos(self, region_code: str = None, max_results: int = 50) -> List[Dict[str, Any]]:
        """
        Fetch trending videos from YouTube.
        
        Args:
            region_code: ISO 3166-1 alpha-2 country code (e.g., 'US', 'GB')
            max_results: Maximum number of videos to fetch (max 50 per request)
        
        Returns:
            List of video data dictionaries
        """
        region_code = region_code or settings.trending_region_code
        max_results = min(max_results, 50)  # API limit
        
        try:
            # Fetch trending videos
            request = self.youtube.videos().list(
                part='snippet,statistics,contentDetails',
                chart='mostPopular',
                regionCode=region_code,
                maxResults=max_results
            )
            response = request.execute()
            
            videos = []
            for item in response.get('items', []):
                video_data = self._parse_video_item(item)
                videos.append(video_data)
            
            # Store in database
            await self._store_videos(videos)
            
            return videos
        
        except HttpError as e:
            print(f"YouTube API error: {e}")
            raise
    
    async def ingest_recent_videos(self, query: str = None, published_after_hours: int = 72, max_results: int = 50) -> List[Dict[str, Any]]:
        """
        Search for recent videos with high view velocity.
        
        Args:
            query: Search query (if None, searches broadly)
            published_after_hours: Only fetch videos published within this timeframe
            max_results: Maximum number of videos to fetch
        
        Returns:
            List of video data dictionaries
        """
        published_after = datetime.utcnow() - timedelta(hours=published_after_hours)
        published_after_str = published_after.isoformat() + 'Z'
        
        try:
            # Search for recent videos
            search_params = {
                'part': 'id',
                'type': 'video',
                'order': 'viewCount',  # Sort by view count
                'publishedAfter': published_after_str,
                'maxResults': min(max_results, 50),
                'relevanceLanguage': 'en',
                'safeSearch': 'none',
                'videoDefinition': 'any'
            }
            
            if query:
                search_params['q'] = query
            
            search_request = self.youtube.search().list(**search_params)
            search_response = search_request.execute()
            
            # Extract video IDs
            video_ids = [item['id']['videoId'] for item in search_response.get('items', [])]
            
            if not video_ids:
                return []
            
            # Fetch full video details
            videos_request = self.youtube.videos().list(
                part='snippet,statistics,contentDetails',
                id=','.join(video_ids)
            )
            videos_response = videos_request.execute()
            
            videos = []
            for item in videos_response.get('items', []):
                video_data = self._parse_video_item(item)
                videos.append(video_data)
            
            # Store in database
            await self._store_videos(videos)
            
            return videos
        
        except HttpError as e:
            print(f"YouTube API error: {e}")
            raise
    
    def _parse_video_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Parse YouTube API video item into our schema."""
        snippet = item.get('snippet', {})
        statistics = item.get('statistics', {})
        content_details = item.get('contentDetails', {})
        
        return {
            'video_id': item['id'],
            'title': snippet.get('title', ''),
            'description': snippet.get('description', ''),
            'channel_id': snippet.get('channelId', ''),
            'channel_title': snippet.get('channelTitle', ''),
            'published_at': snippet.get('publishedAt', ''),
            'thumbnail_url': snippet.get('thumbnails', {}).get('high', {}).get('url', ''),
            'duration': content_details.get('duration', ''),
            'category_id': snippet.get('categoryId', ''),
            'tags': json.dumps(snippet.get('tags', [])),
            'view_count': int(statistics.get('viewCount', 0)),
            'like_count': int(statistics.get('likeCount', 0)),
            'comment_count': int(statistics.get('commentCount', 0)),
            'ingested_at': datetime.utcnow().isoformat(),
            'last_updated': datetime.utcnow().isoformat()
        }
    
    async def _store_videos(self, videos: List[Dict[str, Any]]):
        """Store videos in database (upsert)."""
        db = await get_db()
        
        for video in videos:
            # Check if video exists
            existing = await db.fetch_one(
                "SELECT video_id, view_count FROM videos WHERE video_id = ?",
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


async def run_ingestion():
    """Main ingestion pipeline - fetch trending and recent videos."""
    ingester = YouTubeIngester(settings.youtube_api_key)
    
    print("🔄 Starting ingestion...")
    
    # Fetch trending videos
    print(f"📊 Fetching trending videos ({settings.trending_region_code})...")
    trending = await ingester.ingest_trending_videos(
        region_code=settings.trending_region_code,
        max_results=settings.max_trending_results
    )
    print(f"✅ Ingested {len(trending)} trending videos")
    
    # Fetch recent high-velocity videos
    print(f"🚀 Fetching recent videos (last {settings.search_published_after_hours}h)...")
    recent = await ingester.ingest_recent_videos(
        published_after_hours=settings.search_published_after_hours,
        max_results=settings.max_search_results
    )
    print(f"✅ Ingested {len(recent)} recent videos")
    
    total = len(trending) + len(recent)
    print(f"🎉 Total videos ingested: {total}")
    
    return total
