# ---- Stage 1: Build the React frontend ----
FROM node:20-slim AS frontend-builder

WORKDIR /app

# Install frontend dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy frontend source files
COPY index.html index.tsx index.css App.tsx types.ts mockData.ts tsconfig.json vite.config.ts ./
COPY components/ ./components/
COPY services/ ./services/

# Build with empty API URL so frontend uses same-origin requests
ENV VITE_API_URL=""
RUN npm run build

# ---- Stage 2: Python backend + static frontend ----
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

# Copy the built frontend from stage 1
COPY --from=frontend-builder /app/dist ./static

# Create data directory for SQLite
RUN mkdir -p /app/data

# Railway injects PORT env var - use shell form so variable expansion works
CMD ["sh", "-c", "uvicorn api.server:app --host 0.0.0.0 --port ${PORT:-8000}"]
