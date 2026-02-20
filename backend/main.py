"""
Main entry point for running the complete pipeline.
"""
import asyncio
import sys
from database.db import init_db, close_db
from config import settings, get_api_key
from ingest.rapidapi_ingester import run_ingestion
from features.calculator import compute_all_features
from ml.processor import run_ml_pipeline


async def run_full_pipeline():
    """
    Execute the complete data pipeline:
    1. Initialize database
    2. Ingest YouTube data (RapidAPI)
    3. Compute features
    4. Run ML pipeline (embeddings, deduplication, clustering)
    """
    print("=" * 60)
    print("🚀 VIDEO TRENDS ANALYZER - FULL PIPELINE")
    print("=" * 60)
    
    try:
        # Initialize database
        print("\n📦 Initializing database...")
        await init_db(settings.database_path)
        print(f"✅ Database ready: {settings.database_path}")
        
        # Check for API key
        api_key = get_api_key()
        if not api_key:
            print("\n⚠️  No RapidAPI key found!")
            print("   You can either:")
            print("   1. Set RAPIDAPI_KEY in backend/.env")
            print("   2. Set it via the UI (Settings page)")
            print("\n   Get your free key at: https://rapidapi.com/Glavier/api/youtube138")
            print("\n   Skipping ingestion for now...")
            video_count = 0
        else:
            # Step 1: Ingest data
            print("\n" + "=" * 60)
            print("STEP 1: DATA INGESTION (RapidAPI YouTube V2)")
            print("=" * 60)
            video_count = await run_ingestion(api_key)
            
            if video_count == 0:
                print("⚠️  No videos ingested. Check your RapidAPI key.")
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
