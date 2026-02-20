"""
Database schema and connection management for Video Trends Analyzer.
"""
import aiosqlite
import os
from typing import Optional
from datetime import datetime


class Database:
    """SQLite database manager with async support."""
    
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.connection: Optional[aiosqlite.Connection] = None
    
    async def connect(self):
        """Establish database connection and create tables if needed."""
        # Ensure directory exists
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        self.connection = await aiosqlite.connect(self.db_path)
        self.connection.row_factory = aiosqlite.Row
        await self._create_tables()
    
    async def close(self):
        """Close database connection."""
        if self.connection:
            await self.connection.close()
    
    async def _create_tables(self):
        """Create database schema."""
        await self.connection.executescript("""
            -- Videos table: stores raw YouTube data
            CREATE TABLE IF NOT EXISTS videos (
                video_id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                channel_id TEXT NOT NULL,
                channel_title TEXT NOT NULL,
                published_at TEXT NOT NULL,
                thumbnail_url TEXT,
                duration TEXT,
                category_id TEXT,
                tags TEXT,  -- JSON array as string
                
                -- Raw metrics
                view_count INTEGER DEFAULT 0,
                like_count INTEGER DEFAULT 0,
                comment_count INTEGER DEFAULT 0,
                
                -- Metadata
                ingested_at TEXT NOT NULL,
                last_updated TEXT NOT NULL,
                
                -- Indexes for common queries
                UNIQUE(video_id)
            );
            
            CREATE INDEX IF NOT EXISTS idx_published_at ON videos(published_at);
            CREATE INDEX IF NOT EXISTS idx_ingested_at ON videos(ingested_at);
            CREATE INDEX IF NOT EXISTS idx_category ON videos(category_id);
            
            -- Derived metrics table
            CREATE TABLE IF NOT EXISTS video_metrics (
                video_id TEXT PRIMARY KEY,
                
                -- Computed features
                views_per_hour REAL DEFAULT 0.0,
                engagement_rate REAL DEFAULT 0.0,
                freshness_score REAL DEFAULT 0.0,
                trend_score REAL DEFAULT 0.0,
                
                -- Peer group stats (for normalization)
                peer_group TEXT,  -- e.g., "category_10_age_24h"
                peer_avg_views REAL,
                peer_std_views REAL,
                
                -- Timestamps
                calculated_at TEXT NOT NULL,
                
                FOREIGN KEY (video_id) REFERENCES videos(video_id) ON DELETE CASCADE
            );
            
            CREATE INDEX IF NOT EXISTS idx_trend_score ON video_metrics(trend_score DESC);
            CREATE INDEX IF NOT EXISTS idx_peer_group ON video_metrics(peer_group);
            
            -- Clusters table: stores ML clustering results
            CREATE TABLE IF NOT EXISTS clusters (
                cluster_id INTEGER PRIMARY KEY AUTOINCREMENT,
                cluster_label TEXT NOT NULL,  -- e.g., "tech_reviews", "gaming"
                cluster_size INTEGER DEFAULT 0,
                representative_video_id TEXT,  -- Most central video
                keywords TEXT,  -- Top keywords as JSON
                avg_trend_score REAL DEFAULT 0.0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            
            -- Video-cluster mapping
            CREATE TABLE IF NOT EXISTS video_clusters (
                video_id TEXT NOT NULL,
                cluster_id INTEGER NOT NULL,
                distance_to_center REAL DEFAULT 0.0,
                assigned_at TEXT NOT NULL,
                
                PRIMARY KEY (video_id, cluster_id),
                FOREIGN KEY (video_id) REFERENCES videos(video_id) ON DELETE CASCADE,
                FOREIGN KEY (cluster_id) REFERENCES clusters(cluster_id) ON DELETE CASCADE
            );
            
            CREATE INDEX IF NOT EXISTS idx_cluster_id ON video_clusters(cluster_id);
            
            -- Embeddings table: stores vector representations
            CREATE TABLE IF NOT EXISTS video_embeddings (
                video_id TEXT PRIMARY KEY,
                embedding BLOB NOT NULL,  -- Numpy array serialized
                model_name TEXT NOT NULL,
                created_at TEXT NOT NULL,
                
                FOREIGN KEY (video_id) REFERENCES videos(video_id) ON DELETE CASCADE
            );
            
            -- Deduplication tracking
            CREATE TABLE IF NOT EXISTS duplicate_groups (
                group_id INTEGER PRIMARY KEY AUTOINCREMENT,
                primary_video_id TEXT NOT NULL,
                duplicate_video_ids TEXT NOT NULL,  -- JSON array
                similarity_score REAL NOT NULL,
                detected_at TEXT NOT NULL,
                
                FOREIGN KEY (primary_video_id) REFERENCES videos(video_id) ON DELETE CASCADE
            );
        """)
        await self.connection.commit()
    
    async def execute(self, query: str, params: tuple = ()):
        """Execute a single query."""
        cursor = await self.connection.execute(query, params)
        await self.connection.commit()
        return cursor
    
    async def fetch_one(self, query: str, params: tuple = ()):
        """Fetch a single row."""
        cursor = await self.connection.execute(query, params)
        return await cursor.fetchone()
    
    async def fetch_all(self, query: str, params: tuple = ()):
        """Fetch all rows."""
        cursor = await self.connection.execute(query, params)
        return await cursor.fetchall()


# Global database instance
db: Optional[Database] = None


async def get_db() -> Database:
    """Get database instance (dependency injection for FastAPI)."""
    global db
    if db is None:
        from config import settings
        db = Database(settings.database_path)
        await db.connect()
    return db


async def init_db(db_path: str):
    """Initialize database on startup."""
    global db
    db = Database(db_path)
    await db.connect()
    return db


async def close_db():
    """Close database on shutdown."""
    global db
    if db:
        await db.close()
        db = None
