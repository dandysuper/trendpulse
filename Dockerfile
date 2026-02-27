FROM python:3.11-slim

WORKDIR /app

# Install build deps and clean up in the same layer
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && rm -rf /root/.cache/pip

# Copy backend source
COPY backend/ .

# Create data directory for SQLite
RUN mkdir -p /app/data

# Railway injects PORT env var - use shell form so variable expansion works
CMD ["sh", "-c", "uvicorn api.server:app --host 0.0.0.0 --port ${PORT:-8000}"]
