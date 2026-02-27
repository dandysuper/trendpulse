"""
Main entry point for running the complete pipeline.
"""
import asyncio
import sys
from database.db import init_db, close_db
from config import settings, get_api_key, get_youtube_api_key
from ingest.rapidapi_ingester import run_ingestion
from ingest.tiktok_ingester import run_tiktok_ingestion
from features.calculator import compute_all_features
from ml.processor import run_ml_pipeline


async def run_full_pipeline():
    """
    Execute the complete data pipeline:
    1. Initialize database
    2. Ingest YouTube data (YouTube Data API v3)
    3. Ingest TikTok data (Scraptik on RapidAPI)
    4. Compute features
    5. Run ML pipeline (embeddings, deduplication, clustering)
    """
    print("=" * 60)
    print("🚀 VIDEO TRENDS ANALYZER - FULL PIPELINE")
    print("=" * 60)
    
    try:
        # Initialize database
        print("\n📦 Initializing database...")
        await init_db(settings.database_path)
        print(f"✅ Database ready: {settings.database_path}")
        
        # Check for API keys
        youtube_key = get_youtube_api_key()
        rapidapi_key = get_api_key()
        
        if not youtube_key and not rapidapi_key:
            print("\n⚠️  No API keys found!")
            print("   You can either:")
            print("   1. Set YOUTUBE_API_KEY in backend/.env (free from Google Cloud Console)")
            print("   2. Set RAPIDAPI_KEY in backend/.env (free from RapidAPI for TikTok)")
            print("   3. Set them via the UI (Settings page)")
            print("\n   Skipping ingestion for now...")
            video_count = 0
        else:
            # Step 1: Ingest YouTube data
            youtube_count = 0
            if youtube_key:
                print("\n" + "=" * 60)
                print("STEP 1a: YOUTUBE INGESTION (YouTube Data API v3)")
                print("=" * 60)
                youtube_count = await run_ingestion(youtube_key)
            else:
                print("\n⚠️  No YouTube API key. Skipping YouTube ingestion.")
            
            # Step 1b: Ingest TikTok data
            tiktok_count = 0
            if rapidapi_key:
                print("\n" + "=" * 60)
                print("STEP 1b: TIKTOK INGESTION (Scraptik on RapidAPI)")
                print("=" * 60)
                tiktok_count = await run_tiktok_ingestion(rapidapi_key)
            else:
                print("\n⚠️  No RapidAPI key. Skipping TikTok ingestion.")
            
            video_count = youtube_count + tiktok_count
            
            if video_count == 0:
                print("⚠️  No videos ingested. Check your API keys.")
                return
        
        # Step 2: Compute features
        print("\n" + "=" * 60)
        print("STEP 2: FEATURE ENGINEERING")
        print("=" * 60)
        features_count = await compute_all_features()
        
        if features_count == 0:
            print("⚠️  No features computed. Need videos first.")
            return
        
        # Step 3: ML pipeline
        print("\n" + "=" * 60)
        print("STEP 3: MACHINE LEARNING")
        print("=" * 60)
        ml_results = await run_ml_pipeline()
        
        # Summary
        print("\n" + "=" * 60)
        print("✅ PIPELINE COMPLETE!")
        print("=" * 60)
        print(f"📊 Videos processed: {video_count}")
        print(f"🔧 Features computed: {features_count}")
        print(f"🤖 Embeddings generated: {ml_results['embeddings_generated']}")
        print(f"🔍 Duplicate groups: {ml_results['duplicate_groups']}")
        print(f"🎯 Clusters created: {ml_results['clustering']['cluster_count']}")
        print(f"📉 Noise points: {ml_results['clustering']['noise_count']}")
        print("\n🌐 Ready to start API server!")
        print(f"   Run: python -m uvicorn api.server:app --host {settings.api_host} --port {settings.api_port}")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Pipeline failed: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    finally:
        await close_db()


if __name__ == "__main__":
    asyncio.run(run_full_pipeline())
