"""
RapidAPI YouTube ingestion module.
Fetches channel videos using RapidAPI YouTube endpoint.
"""
import httpx
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import json
from config import settings
from database.db import get_db


class RapidAPIYouTubeIngester:
    """Handles data ingestion from RapidAPI YouTube API."""
    
    BASE_URL = "https://youtube138.p.rapidapi.com"
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.headers = {
            "X-RapidAPI-Key": api_key,
            "X-RapidAPI-Host": "youtube138.p.rapidapi.com"
        }
    
    async def test_api_key(self) -> bool:
        """Test if the API key is valid by making a simple request."""
        try:
            async with httpx.AsyncClient() as client:
                # Test with a simple search query
                response = await client.get(
                    f"{self.BASE_URL}/search/",
                    headers=self.headers,
                    params={"q": "despacito", "hl": "en", "gl": "US"},
                    timeout=10.0
                )
                return response.status_code == 200
        except Exception as e:
            print(f"API key test failed: {e}")
            return False
    
    async def ingest_trending_videos(self, country: str = "US", max_results: int = 50) -> List[Dict[str, Any]]:
        """
        Fetch trending videos by searching for popular content.
        
        Args:
            country: ISO 3166-1 alpha-2 country code (e.g., 'US', 'GB')
            max_results: Maximum number of videos to fetch
        
        Returns:
            List of video data dictionaries
        """
        try:
            async with httpx.AsyncClient() as client:
                # Search for trending/popular videos
                response = await client.get(
                    f"{self.BASE_URL}/search/",
                    headers=self.headers,
                    params={"q": "trending viral popular", "hl": "en", "gl": country},
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    print(f"RapidAPI error: {response.status_code} - {response.text}")
                    return []
                
                data = response.json()
                
                # Parse the response and extract videos
                videos = []
                if 'contents' in data:
                    for item in data['contents'][:max_results]:
                        video_data = await self._parse_search_result(item)
                        if video_data:
                            videos.append(video_data)
                
                # Store in database
                if videos:
                    await self._store_videos(videos)
                
                return videos
        
        except Exception as e:
            print(f"RapidAPI error: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    async def search_videos(self, query: str = "trending", max_results: int = 50) -> List[Dict[str, Any]]:
        """
        Search for videos using RapidAPI YouTube.
        
        Args:
            query: Search query
            max_results: Maximum number of videos to fetch
        
        Returns:
            List of video data dictionaries
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/search/",
                    headers=self.headers,
                    params={"q": query, "hl": "en", "gl": "US"},
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    print(f"RapidAPI search error: {response.status_code} - {response.text}")
                    return []
                
                data = response.json()
                
                # Parse the response and extract videos
                videos = []
                if 'contents' in data:
                    for item in data['contents'][:max_results]:
                        video_data = await self._parse_search_result(item)
                        if video_data:
                            videos.append(video_data)
                
                # Store in database
                if videos:
                    await self._store_videos(videos)
                
                return videos
        
        except Exception as e:
            print(f"RapidAPI search error: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    async def get_video_details(self, video_id: str) -> Optional[Dict[str, Any]]:
        """
        Get detailed information for a specific video.
        
        Args:
            video_id: YouTube video ID
        
        Returns:
            Video data dictionary or None
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/video/details",
                    headers=self.headers,
                    params={"id": video_id},
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    return None
                
                data = response.json()
                return await self._parse_video_item(data)
        
        except Exception as e:
            print(f"Error fetching video details for {video_id}: {e}")
            return None
    
    async def get_channel_videos(self, channel_id: str, max_results: int = 50) -> List[Dict[str, Any]]:
        """
        Get videos from a specific channel.
        
        Args:
            channel_id: YouTube channel ID
            max_results: Maximum number of videos to fetch
        
        Returns:
            List of video data dictionaries
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.BASE_URL}/channel/videos",
                    headers=self.headers,
                    json={"channelId": channel_id},
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    print(f"Channel videos error: {response.status_code}")
                    return []
                
                data = response.json()
                
                # Extract video IDs
                video_ids = []
                if 'contents' in data:
                    for item in data['contents'][:max_results]:
                        if item.get('type') == 'video' and 'video' in item:
                            video_id = item['video'].get('videoId')
                            if video_id:
                                video_ids.append(video_id)
                
                # Fetch details for each video
                videos = []
                for video_id in video_ids:
                    video_data = await self.get_video_details(video_id)
                    if video_data:
                        videos.append(video_data)
                
                # Store in database
                await self._store_videos(videos)
                
                return videos
        
        except Exception as e:
            print(f"Channel videos error: {e}")
            return []
    
    async def _parse_search_result(self, item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Parse search result item from RapidAPI YouTube138 API."""
        try:
            # Check if this is a video item
            if item.get('type') != 'video':
                return None
            
            video = item.get('video', {})
            if not video:
                return None
            
            # Extract video ID
            video_id = video.get('videoId')
            if not video_id:
                return None
            
            # Extract basic info
            title = video.get('title', '')
            
            # Channel info from author object
            author = video.get('author', {})
            channel_id = author.get('channelId', '')
            channel_title = author.get('title', '')
            
            # Published date - convert relative time to approximate ISO format
            published_time_text = video.get('publishedTimeText', '')
            published_at = self._parse_published_time(published_time_text)
            
            # Thumbnail
            thumbnails = video.get('thumbnails', [])
            thumbnail_url = ''
            if thumbnails and len(thumbnails) > 0:
                # Get the highest quality thumbnail
                thumbnail_url = thumbnails[-1].get('url', '')
            
            # Duration - convert from lengthSeconds or lengthText
            length_seconds = video.get('lengthSeconds', 0)
            if length_seconds:
                minutes = length_seconds // 60
                seconds = length_seconds % 60
                duration = f"{minutes}:{seconds:02d}"
            else:
                duration = video.get('lengthText', '0:00')
            
            # View count from stats object
            stats = video.get('stats', {})
            view_count = stats.get('views', 0)
            
            # Description snippet
            description = video.get('descriptionSnippet', '')
            
            # Category (not provided by this API, default to 0)
            category_id = '0'
            
            # Tags/keywords (not in search results)
            tags_json = '[]'
            
            # Likes and comments (not in search results)
            like_count = 0
            comment_count = 0
            
            return {
                'video_id': video_id,
                'title': title,
                'description': description,
                'channel_id': channel_id,
                'channel_title': channel_title,
                'published_at': published_at,
                'thumbnail_url': thumbnail_url,
                'duration': duration,
                'category_id': category_id,
                'tags': tags_json,
                'view_count': view_count,
                'like_count': like_count,
                'comment_count': comment_count,
                'ingested_at': datetime.utcnow().isoformat(),
                'last_updated': datetime.utcnow().isoformat()
            }
        
        except Exception as e:
            print(f"Error parsing search result: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def _parse_published_time(self, time_text: str) -> str:
        """Convert relative time text to approximate ISO format."""
        try:
            if not time_text:
                return datetime.utcnow().isoformat()
            
            # Parse relative time like "2 hours ago", "3 days ago", etc.
            time_text = time_text.lower()
            now = datetime.utcnow()
            
            if 'hour' in time_text or 'hr' in time_text:
                hours = int(''.join(filter(str.isdigit, time_text)) or '1')
                published = now - timedelta(hours=hours)
            elif 'day' in time_text:
                days = int(''.join(filter(str.isdigit, time_text)) or '1')
                published = now - timedelta(days=days)
            elif 'week' in time_text:
                weeks = int(''.join(filter(str.isdigit, time_text)) or '1')
                published = now - timedelta(weeks=weeks)
            elif 'month' in time_text:
                months = int(''.join(filter(str.isdigit, time_text)) or '1')
                published = now - timedelta(days=months * 30)
            elif 'year' in time_text:
                years = int(''.join(filter(str.isdigit, time_text)) or '1')
                published = now - timedelta(days=years * 365)
            else:
                published = now
            
            return published.isoformat()
        
        except Exception:
            return datetime.utcnow().isoformat()
    
    async def _parse_video_item(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Parse RapidAPI video response into our schema."""
        try:
            # Extract video ID
            video_id = data.get('id') or data.get('videoId')
            if not video_id:
                return None
            
            # Extract basic info
            title = data.get('title', '')
            description = data.get('description', '')
            
            # Channel info
            channel_id = ''
            channel_title = ''
            if 'author' in data:
                channel_id = data['author'].get('channelId', '')
                channel_title = data['author'].get('title', '')
            
            # Published date
            published_at = data.get('publishedTimeText', '')
            if not published_at:
                published_at = datetime.utcnow().isoformat()
            else:
                # Convert relative time to ISO format (approximate)
                published_at = datetime.utcnow().isoformat()
            
            # Thumbnail
            thumbnails = data.get('thumbnails', [])
            thumbnail_url = ''
            if thumbnails and len(thumbnails) > 0:
                thumbnail_url = thumbnails[-1].get('url', '')
            
            # Duration
            duration = data.get('lengthText', '')
            
            # Category (not provided by this API, default to 0)
            category_id = '0'
            
            # Tags/keywords
            keywords = data.get('keywords', [])
            tags_json = json.dumps(keywords) if keywords else '[]'
            
            # Statistics
            view_count = 0
            if 'stats' in data and 'views' in data['stats']:
                view_text = data['stats']['views']
                # Parse view count (e.g., "1.2M views" -> 1200000)
                view_count = self._parse_view_count(view_text)
            
            # Likes and comments (not always available)
            like_count = 0
            comment_count = 0
            
            return {
                'video_id': video_id,
                'title': title,
                'description': description,
                'channel_id': channel_id,
                'channel_title': channel_title,
                'published_at': published_at,
                'thumbnail_url': thumbnail_url,
                'duration': duration,
                'category_id': category_id,
                'tags': tags_json,
                'view_count': view_count,
                'like_count': like_count,
                'comment_count': comment_count,
                'ingested_at': datetime.utcnow().isoformat(),
                'last_updated': datetime.utcnow().isoformat()
            }
        
        except Exception as e:
            print(f"Error parsing video item: {e}")
            return None
    
    def _parse_view_count(self, view_text: str) -> int:
        """Parse view count from text like '1.2M views' to integer."""
        try:
            if not view_text:
                return 0
            
            # Remove 'views' and whitespace
            view_text = view_text.lower().replace('views', '').replace('view', '').strip()
            
            # Handle K, M, B suffixes
            multiplier = 1
            if 'k' in view_text:
                multiplier = 1000
                view_text = view_text.replace('k', '')
            elif 'm' in view_text:
                multiplier = 1000000
                view_text = view_text.replace('m', '')
            elif 'b' in view_text:
                multiplier = 1000000000
                view_text = view_text.replace('b', '')
            
            # Convert to float then int
            number = float(view_text)
            return int(number * multiplier)
        
        except:
            return 0
    
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


async def run_ingestion(api_key: Optional[str] = None):
    """Main ingestion pipeline - fetch trending and search videos."""
    # Use provided API key or fall back to settings
    api_key = api_key or settings.rapidapi_key
    
    if not api_key:
        print("❌ No RapidAPI key provided. Please set RAPIDAPI_KEY in settings or provide via UI.")
        return 0
    
    ingester = RapidAPIYouTubeIngester(api_key)
    
    # Test API key first
    print("🔑 Testing RapidAPI key...")
    if not await ingester.test_api_key():
        print("❌ Invalid RapidAPI key. Please check your key and try again.")
        return 0
    
    print("✅ RapidAPI key is valid")
    print("🔄 Starting ingestion...")
    
    # Fetch trending videos via search
    print(f"📊 Searching for trending videos...")
    trending = await ingester.search_videos(
        query="trending viral popular",
        max_results=settings.max_trending_results
    )
    print(f"✅ Ingested {len(trending)} trending videos")
    
    # Fetch more videos with different queries
    print(f"🔍 Searching for recent popular videos...")
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
    print(f"🎉 Total videos ingested: {total}")
    
    return total
