"""
Machine Learning module for video clustering and deduplication.
Uses TF-IDF vectorization (sklearn) for embeddings and DBSCAN for clustering.
Lightweight: no PyTorch/sentence-transformers needed.
"""
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import DBSCAN
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from typing import List, Dict, Any, Tuple
import json
from datetime import datetime
from database.db import get_db
from config import settings


class VideoMLProcessor:
    """Handles ML operations: embeddings, clustering, deduplication."""
    
    def __init__(self, model_name: str = None):
        self.model_name = "tfidf"
        self.vectorizer = None
        print("🤖 Using TF-IDF vectorizer (lightweight, no GPU needed)")
    
    def _fit_vectorizer(self, texts: List[str]):
        """Fit TF-IDF vectorizer on a corpus of texts."""
        self.vectorizer = TfidfVectorizer(
            max_features=512,
            stop_words='english',
            ngram_range=(1, 2),
            min_df=1,
            sublinear_tf=True
        )
        self.vectorizer.fit(texts)
    
    def generate_embeddings_batch(self, texts: List[str]) -> np.ndarray:
        """Generate TF-IDF embedding vectors for a list of texts."""
        if self.vectorizer is None:
            self._fit_vectorizer(texts)
        matrix = self.vectorizer.transform(texts)
        return matrix.toarray().astype(np.float32)
    
    async def generate_embeddings_for_all_videos(self) -> int:
        """
        Generate embeddings for all videos that don't have them yet.
        
        Returns:
            Number of embeddings generated
        """
        db = await get_db()
        
        # Fetch videos without embeddings
        videos = await db.fetch_all("""
            SELECT v.video_id, v.title, v.description
            FROM videos v
            LEFT JOIN video_embeddings ve ON v.video_id = ve.video_id
            WHERE ve.video_id IS NULL
        """)
        
        if not videos:
            print("ℹ️  All videos already have embeddings")
            return 0
        
        print(f"🔄 Generating TF-IDF embeddings for {len(videos)} videos...")
        
        # Build text corpus and fit vectorizer in one pass
        texts = [
            f"{v['title']} {(v['description'] or '')[:500]}"
            for v in videos
        ]
        embeddings = self.generate_embeddings_batch(texts)
        
        # Store all embeddings
        now = datetime.utcnow().isoformat()
        for video, embedding in zip(videos, embeddings):
            await db.execute("""
                INSERT INTO video_embeddings (video_id, embedding, model_name, created_at)
                VALUES (?, ?, ?, ?)
            """, (
                video['video_id'],
                embedding.tobytes(),
                self.model_name,
                now
            ))
        
        print(f"✅ Generated {len(videos)} embeddings")
        return len(videos)
    
    async def detect_duplicates(self, threshold: float = None) -> List[Dict[str, Any]]:
        """
        Detect near-duplicate videos using cosine similarity.
        
        Args:
            threshold: Similarity threshold (0-1, default from settings)
        
        Returns:
            List of duplicate groups
        """
        threshold = threshold or settings.dedup_similarity_threshold
        db = await get_db()
        
        print(f"🔍 Detecting duplicates (threshold: {threshold})...")
        
        # Fetch all embeddings
        embeddings_data = await db.fetch_all("""
            SELECT video_id, embedding
            FROM video_embeddings
        """)
        
        if len(embeddings_data) < 2:
            print("ℹ️  Not enough videos to detect duplicates")
            return []
        
        # Deserialize embeddings
        video_ids = [row['video_id'] for row in embeddings_data]
        embeddings = np.array([
            np.frombuffer(row['embedding'], dtype=np.float32)
            for row in embeddings_data
        ])
        
        # Compute pairwise cosine similarity
        similarity_matrix = cosine_similarity(embeddings)
        
        # Find duplicate pairs
        duplicate_groups = []
        processed = set()
        
        for i in range(len(video_ids)):
            if video_ids[i] in processed:
                continue
            
            # Find videos similar to this one
            similar_indices = np.where(similarity_matrix[i] >= threshold)[0]
            similar_indices = [idx for idx in similar_indices if idx != i]
            
            if similar_indices:
                # Create duplicate group
                primary_video = video_ids[i]
                duplicates = [video_ids[idx] for idx in similar_indices]
                
                # Mark all as processed
                processed.add(primary_video)
                processed.update(duplicates)
                
                # Store in database
                await db.execute("""
                    INSERT INTO duplicate_groups (
                        primary_video_id, duplicate_video_ids, similarity_score, detected_at
                    ) VALUES (?, ?, ?, ?)
                """, (
                    primary_video,
                    json.dumps(duplicates),
                    float(np.max(similarity_matrix[i][similar_indices])),
                    datetime.utcnow().isoformat()
                ))
                
                duplicate_groups.append({
                    'primary_video_id': primary_video,
                    'duplicate_video_ids': duplicates,
                    'similarity_score': float(np.max(similarity_matrix[i][similar_indices]))
                })
        
        print(f"✅ Found {len(duplicate_groups)} duplicate groups")
        return duplicate_groups
    
    async def cluster_videos(self, eps: float = None, min_samples: int = None) -> Dict[str, Any]:
        """
        Cluster videos using DBSCAN on embeddings.
        
        Args:
            eps: Maximum distance between samples (default from settings)
            min_samples: Minimum samples per cluster (default from settings)
        
        Returns:
            Clustering results with statistics
        """
        eps = eps or settings.clustering_eps
        min_samples = min_samples or settings.clustering_min_samples
        
        db = await get_db()
        
        print(f"🎯 Clustering videos (eps={eps}, min_samples={min_samples})...")
        
        # Fetch all embeddings
        embeddings_data = await db.fetch_all("""
            SELECT video_id, embedding
            FROM video_embeddings
        """)
        
        if len(embeddings_data) < min_samples:
            print(f"⚠️  Not enough videos for clustering (need at least {min_samples})")
            return {'clusters': [], 'noise_count': len(embeddings_data)}
        
        # Deserialize embeddings
        video_ids = [row['video_id'] for row in embeddings_data]
        embeddings = np.array([
            np.frombuffer(row['embedding'], dtype=np.float32)
            for row in embeddings_data
        ])
        
        # Perform DBSCAN clustering with looser params for TF-IDF vectors
        clustering = DBSCAN(eps=eps, min_samples=min_samples, metric='cosine')
        labels = clustering.fit_predict(embeddings)
        
        # Count DBSCAN results
        unique_labels = set(labels)
        cluster_count = len(unique_labels) - (1 if -1 in unique_labels else 0)
        
        # If DBSCAN produces too few clusters, fall back to KMeans
        min_desired_clusters = 10
        if cluster_count < min_desired_clusters and len(video_ids) >= min_desired_clusters:
            from sklearn.cluster import KMeans
            n_clusters = min(14, max(min_desired_clusters, len(video_ids) // 7))
            print(f"📊 DBSCAN found only {cluster_count} clusters, switching to KMeans (k={n_clusters})...")
            kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
            labels = kmeans.fit_predict(embeddings)
        
        # Process final labels
        unique_labels = set(labels)
        noise_count = list(labels).count(-1)
        cluster_count = len(unique_labels) - (1 if -1 in unique_labels else 0)
        
        print(f"📊 Found {cluster_count} clusters, {noise_count} noise points")
        
        # Clear old cluster assignments
        await db.execute("DELETE FROM video_clusters")
        await db.execute("DELETE FROM clusters")
        
        clusters_info = []
        
        for label in unique_labels:
            if label == -1:  # Skip noise
                continue
            
            # Get videos in this cluster
            cluster_mask = labels == label
            cluster_video_ids = [video_ids[i] for i, mask in enumerate(cluster_mask) if mask]
            cluster_embeddings = embeddings[cluster_mask]
            
            # Find representative video (closest to centroid)
            centroid = np.mean(cluster_embeddings, axis=0)
            distances = np.linalg.norm(cluster_embeddings - centroid, axis=1)
            representative_idx = np.argmin(distances)
            representative_video_id = cluster_video_ids[representative_idx]
            
            # Get representative video details for labeling
            video_details = await db.fetch_one("""
                SELECT title, tags FROM videos WHERE video_id = ?
            """, (representative_video_id,))
            
            # Generate cluster label from representative video
            cluster_label = self._generate_cluster_label(
                video_details['title'] if video_details else f"Cluster {label}",
                video_details['tags'] if video_details else "[]"
            )
            
            # Get average trend score for cluster
            avg_trend_score = await db.fetch_one("""
                SELECT AVG(trend_score) as avg_score
                FROM video_metrics
                WHERE video_id IN ({})
            """.format(','.join(['?' for _ in cluster_video_ids])), tuple(cluster_video_ids))
            
            avg_score = avg_trend_score['avg_score'] if avg_trend_score else 0.0
            
            # Insert cluster
            cursor = await db.execute("""
                INSERT INTO clusters (
                    cluster_label, cluster_size, representative_video_id,
                    keywords, avg_trend_score, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                cluster_label,
                len(cluster_video_ids),
                representative_video_id,
                video_details['tags'] if video_details else "[]",
                round(avg_score, 4),
                datetime.utcnow().isoformat(),
                datetime.utcnow().isoformat()
            ))
            
            cluster_id = cursor.lastrowid
            
            # Insert video-cluster mappings
            for i, video_id in enumerate(cluster_video_ids):
                distance = float(distances[i])
                await db.execute("""
                    INSERT INTO video_clusters (
                        video_id, cluster_id, distance_to_center, assigned_at
                    ) VALUES (?, ?, ?, ?)
                """, (
                    video_id,
                    cluster_id,
                    distance,
                    datetime.utcnow().isoformat()
                ))
            
            clusters_info.append({
                'cluster_id': cluster_id,
                'cluster_label': cluster_label,
                'size': len(cluster_video_ids),
                'representative_video_id': representative_video_id,
                'avg_trend_score': round(avg_score, 4)
            })
        
        print(f"✅ Clustering complete: {len(clusters_info)} clusters created")
        
        return {
            'clusters': clusters_info,
            'cluster_count': len(clusters_info),
            'noise_count': noise_count,
            'total_videos': len(video_ids)
        }
    
    def _generate_cluster_label(self, title: str, tags_json: str) -> str:
        """Generate a human-readable cluster label."""
        # Simple heuristic: use first 3 words of title
        words = title.split()[:3]
        label = ' '.join(words)
        
        # Limit length
        if len(label) > 50:
            label = label[:47] + "..."
        
        return label or "Unlabeled Cluster"


async def run_ml_pipeline():
    """
    Run the complete ML pipeline:
    1. Generate embeddings
    2. Detect duplicates
    3. Cluster videos
    """
    processor = VideoMLProcessor()
    
    print("\n🤖 Starting ML pipeline...")
    
    # Step 1: Generate embeddings
    embeddings_count = await processor.generate_embeddings_for_all_videos()
    
    # Step 2: Detect duplicates
    duplicates = await processor.detect_duplicates()
    
    # Step 3: Cluster videos
    clustering_results = await processor.cluster_videos()
    
    print("\n🎉 ML pipeline complete!")
    print(f"   - Embeddings generated: {embeddings_count}")
    print(f"   - Duplicate groups found: {len(duplicates)}")
    print(f"   - Clusters created: {clustering_results['cluster_count']}")
    
    return {
        'embeddings_generated': embeddings_count,
        'duplicate_groups': len(duplicates),
        'clustering': clustering_results
    }
