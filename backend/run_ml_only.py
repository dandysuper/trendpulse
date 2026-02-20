#!/usr/bin/env python3
"""
Run ML pipeline on existing videos without ingesting new data.
"""
import asyncio
import sys
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).parent))

from features.calculator import compute_all_features
from ml.processor import run_ml_pipeline
from database.db import init_db, close_db
from config import settings


async def main():
    """Run feature computation and ML clustering on existing videos."""
    try:
        # Initialize database
        print(f"📊 Initializing database: {settings.database_path}")
        await init_db(settings.database_path)

        # Compute features
        print("🔧 Computing features for existing videos...")
        features_count = await compute_all_features()
        print(f"✅ Computed features for {features_count} videos")

        if features_count == 0:
            print("⚠️  No videos found to compute features for")
            return

        # Run ML pipeline
        print("🤖 Running ML clustering pipeline...")
        ml_results = await run_ml_pipeline()

        print(f"\n✅ ML Pipeline Complete!")
        print(f"   - Clusters created: {ml_results['clustering']['cluster_count']}")
        print(f"   - Videos clustered: {ml_results['clustering']['videos_clustered']}")

        # Close database
        await close_db()

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
