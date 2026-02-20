#!/bin/bash

# TrendPulse Backend Launch Script

echo "🚀 Starting TrendPulse Backend..."
echo ""

# Check if we're in the backend directory
if [ ! -f "api/server.py" ]; then
    echo "❌ Error: Must run from backend/ directory"
    echo "   Run: cd backend && ./start.sh"
    exit 1
fi

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "❌ Error: Virtual environment not found"
    echo "   Run: python3 -m venv venv"
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found"
    echo "   Creating from .env.example..."
    cp .env.example .env
    echo ""
    echo "📝 Please edit backend/.env and add your RAPIDAPI_KEY"
    echo "   Get your FREE key at: https://rapidapi.com/Glavier/api/youtube138"
    echo ""
    read -p "Press Enter after you've added your API key..."
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Check if dependencies are installed
if ! python -c "import aiosqlite" 2>/dev/null; then
    echo "📦 Installing dependencies..."
    pip install -r requirements.txt
fi

# Start the server
echo "✅ Starting server on http://0.0.0.0:8000"
echo "📚 API docs will be at http://localhost:8000/docs"
echo ""
echo "Press CTRL+C to stop"
echo ""

python -m uvicorn api.server:app --host 0.0.0.0 --port 8000 --reload
