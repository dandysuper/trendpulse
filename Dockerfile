FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for ML libraries
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ .

# Create data directory for SQLite
RUN mkdir -p /app/data

# Railway injects PORT env var - uvicorn must bind to it
CMD uvicorn api.server:app --host 0.0.0.0 --port ${PORT:-8000}
