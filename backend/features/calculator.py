"""
Feature engineering module.
Computes derived metrics: views_per_hour, engagement_rate, freshness_score, trend_score.
"""
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
import math
from database.db import get_db
from config import settings


class FeatureCalculator:
    """Calculates derived features for videos."""
    
    @staticmethod
    def calculate_views_per_hour(view_count: int, published_at: str, current_time: Optional[datetime] = None) -> float:
        """
        Calculate views per hour since publication.
        
        Formula: views_per_hour = view_count / hours_since_published
        
        Args:
            view_count: Total view count
            published_at: ISO format timestamp
            current_time: Current time (defaults to now)
        
        Returns:
            Views per hour (float)
        """
        if current_time is None:
            current_time = datetime.now(timezone.utc)
        
        published = datetime.fromisoformat(published_at.replace('Z', '+00:00'))
        hours_elapsed = (current_time - published).total_seconds() / 3600
        
        # Avoid division by zero
        if hours_elapsed < 0.1:
            hours_elapsed = 0.1
        
        return view_count / hours_elapsed
    
    @staticmethod
    def calculate_engagement_rate(view_count: int, like_count: int, comment_count: int) -> float:
        """
        Calculate engagement rate.
        
        Formula: engagement_rate = (weighted_likes + weighted_comments) / views
        
        Args:
            view_count: Total views
            like_count: Total likes
            comment_count: Total comments
        
        Returns:
            Engagement rate (0-1 scale, can exceed 1 for highly engaged content)
        """
        if view_count == 0:
            return 0.0
        
        weighted_engagement = (
            like_count * settings.engagement_weights_likes +
            comment_count * settings.engagement_weights_comments
        )
        
        return weighted_engagement / view_count
    
    @staticmethod
    def calculate_freshness_score(published_at: str, current_time: Optional[datetime] = None) -> float:
        """
        Calculate freshness score with exponential decay.
        
        Formula: freshness = exp(-hours_elapsed / decay_constant)
        
        Args:
            published_at: ISO format timestamp
            current_time: Current time (defaults to now)
        
        Returns:
            Freshness score (0-1, where 1 is brand new)
        """
        if current_time is None:
            current_time = datetime.now(timezone.utc)
        
        published = datetime.fromisoformat(published_at.replace('Z', '+00:00'))
        hours_elapsed = (current_time - published).total_seconds() / 3600
        
        # Exponential decay
        decay_constant = settings.freshness_decay_hours
        freshness = math.exp(-hours_elapsed / decay_constant)
        
        return max(0.0, min(1.0, freshness))
    
    @staticmethod
    async def calculate_trend_score_with_normalization(
        video_id: str,
        views_per_hour: float,
        engagement_rate: float,
        freshness_score: float,
        category_id: str,
        published_at: str
    ) -> Dict[str, Any]:
        """
        Calculate TrendScore using peer-group normalization.
        
        Formula:
        1. Define peer group (same category + similar age)
        2. Normalize views_per_hour using z-score: z = (x - μ) / σ
        3. TrendScore = (z_views * 0.5) + (engagement * 0.3) + (freshness * 0.2)
        
        Args:
            video_id: Video identifier
            views_per_hour: Calculated VPH
            engagement_rate: Calculated engagement
            freshness_score: Calculated freshness
            category_id: YouTube category ID
            published_at: Publication timestamp
        
        Returns:
            Dict with trend_score and peer group stats
        """
        db = await get_db()
        
        # Define peer group: same category, published within ±24h
        published = datetime.fromisoformat(published_at.replace('Z', '+00:00'))
        time_window_start = (published - timedelta(hours=24)).isoformat()
        time_window_end = (published + timedelta(hours=24)).isoformat()
        
        peer_group_name = f"cat_{category_id}_age_24h"
        
        # Get peer group statistics
        peer_stats = await db.fetch_one("""
            SELECT 
                AVG(v.view_count / ((julianday('now') - julianday(v.published_at)) * 24)) as avg_vph,
                COUNT(*) as peer_count
            FROM videos v
            WHERE v.category_id = ?
                AND v.published_at BETWEEN ? AND ?
                AND v.video_id != ?
        """, (category_id, time_window_start, time_window_end, video_id))
        
        # Calculate standard deviation manually if needed
        if peer_stats and peer_stats['peer_count'] > 2:
            # Get all VPH values for std calculation
            vph_values = await db.fetch_all("""
                SELECT v.view_count / ((julianday('now') - julianday(v.published_at)) * 24) as vph
                FROM videos v
                WHERE v.category_id = ?
                    AND v.published_at BETWEEN ? AND ?
                    AND v.video_id != ?
            """, (category_id, time_window_start, time_window_end, video_id))
            
            avg_vph = peer_stats['avg_vph'] or views_per_hour
            
            # Calculate standard deviation manually
            vph_list = list(vph_values)  # Convert to list for len()
            if len(vph_list) > 1:
                variance = sum((row['vph'] - avg_vph) ** 2 for row in vph_list) / len(vph_list)
                std_vph = variance ** 0.5
            else:
                std_vph = 1.0
            
            if std_vph < 0.01:  # Avoid division by near-zero
                std_vph = 1.0
            
            # Z-score normalization
            z_views = (views_per_hour - avg_vph) / std_vph
            
            # Clip z-score to reasonable range (-3 to 3)
            z_views = max(-3.0, min(3.0, z_views))
            
            # Normalize z-score to 0-1 range (sigmoid-like)
            normalized_views = (z_views + 3) / 6  # Maps [-3, 3] to [0, 1]
        else:
            # Fallback: no peer group, use raw normalized values
            avg_vph = views_per_hour
            std_vph = 1.0
            normalized_views = min(1.0, views_per_hour / 1000)  # Simple normalization
        
        # Calculate final TrendScore (weighted combination)
        trend_score = (
            normalized_views * 0.5 +
            min(1.0, engagement_rate * 10) * 0.3 +  # Scale engagement to 0-1
            freshness_score * 0.2
        )
        
        return {
            'trend_score': round(trend_score, 4),
            'peer_group': peer_group_name,
            'peer_avg_views': round(avg_vph, 2) if avg_vph else None,
            'peer_std_views': round(std_vph, 2) if std_vph else None
        }


async def compute_all_features():
    """
    Compute features for all videos in the database.
    This is the main feature engineering pipeline.
    """
    db = await get_db()
    calculator = FeatureCalculator()
    
    print("🔧 Computing features for all videos...")
    
    # Fetch all videos
    videos = await db.fetch_all("""
        SELECT video_id, view_count, like_count, comment_count, 
               published_at, category_id
        FROM videos
    """)
    
    if not videos:
        print("⚠️  No videos found in database")
        return 0
    
    current_time = datetime.now(timezone.utc)
    processed = 0
    
    for video in videos:
        video_id = video['video_id']
        
        # Calculate basic features
        views_per_hour = calculator.calculate_views_per_hour(
            video['view_count'],
            video['published_at'],
            current_time
        )
        
        engagement_rate = calculator.calculate_engagement_rate(
            video['view_count'],
            video['like_count'],
            video['comment_count']
        )
        
        freshness_score = calculator.calculate_freshness_score(
            video['published_at'],
            current_time
        )
        
        # Calculate TrendScore with peer normalization
        trend_data = await calculator.calculate_trend_score_with_normalization(
            video_id,
            views_per_hour,
            engagement_rate,
            freshness_score,
            video['category_id'],
            video['published_at']
        )
        
        # Store metrics
        await db.execute("""
            INSERT OR REPLACE INTO video_metrics (
                video_id, views_per_hour, engagement_rate, freshness_score,
                trend_score, peer_group, peer_avg_views, peer_std_views,
                calculated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            video_id,
            round(views_per_hour, 2),
            round(engagement_rate, 4),
            round(freshness_score, 4),
            trend_data['trend_score'],
            trend_data['peer_group'],
            trend_data['peer_avg_views'],
            trend_data['peer_std_views'],
            current_time.isoformat()
        ))
        
        processed += 1
    
    print(f"✅ Computed features for {processed} videos")
    return processed
