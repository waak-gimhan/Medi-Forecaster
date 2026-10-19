# ── Backend Dockerfile ────────────────────────────────────────────────
# Context: PROJECT ROOT (not just backend/)
# Reason: imports use "from backend.xxx" and "from ml.xxx",
#         so the entire project tree must be available inside the container.
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies for psycopg2-binary and general builds
RUN apt-get update && apt-get install -y --no-install-recommends \
        gcc \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies first (Docker layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire project so that package imports work:
#   from backend.database import ...
#   from ml.src.forecast_engine import ...
COPY backend/    ./backend/
COPY ml/         ./ml/
COPY __init__.py ./

# Create empty __init__.py files so Python treats directories as packages
RUN touch ml/__init__.py ml/src/__init__.py

EXPOSE 8000

# Health-check: FastAPI /api/health endpoint (defined in main.py)
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# Run with the module path reflecting the package structure
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]