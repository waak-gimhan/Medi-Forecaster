# Pharmacy Medicine Demand Forecasting and Inventory Recommendation System

> **v2.0** — AI/ML-powered medicine demand forecasting using Random Forest. Dockerized for one-command deployment.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite → served by Nginx |
| Backend | Python 3.12 + FastAPI + Uvicorn |
| ML Engine | Scikit-learn Random Forest (`random_forest_v1.pkl`) |
| Data | Pandas + NumPy |
| Database | PostgreSQL 16 |
| Containerization | Docker + Docker Compose |

---

## System Architecture

```
Browser
   │
   ▼  http://localhost:3000
┌──────────────────────┐
│  Nginx (frontend)    │  ← serves React SPA
│  port 80 (→ 3000)    │
└──────────┬───────────┘
           │ reverse-proxy /api/* → backend:8000
           ▼
┌──────────────────────┐
│  FastAPI (backend)   │  ← REST API + ML inference
│  port 8000           │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  PostgreSQL 16       │  ← persistent data
│  port 5432           │
└──────────────────────┘
```

---

## Requirements

- **Docker Desktop** (Windows/Mac/Linux) — [download here](https://www.docker.com/products/docker-desktop/)
- **Git** — to clone the repository

That's it. You do **NOT** need Python, Node.js, or PostgreSQL installed.

---

## Installation

```bash
git clone <your-repository-url>
cd pharmacy-demand-forecasting
```

### Important: ML Model File

The trained Random Forest model (`ml/models/random_forest_v1.pkl`, ~2 GB) is excluded from Git for size reasons.

**You must copy the model file manually before running Docker:**

```
ml/
└── models/
    └── random_forest_v1.pkl   ← place it here
```

If you received the project as a ZIP, the model should already be included.

---

## Run

### First time (or after changing code):
```bash
docker compose up --build
```

### Subsequent starts (no code changes):
```bash
docker compose up
```

### Run in background:
```bash
docker compose up -d
```

---

## Access

| Service | URL |
|---|---|
| **Frontend (React UI)** | http://localhost:3000 |
| **Backend API docs (Swagger)** | http://localhost:8000/docs |
| **API health check** | http://localhost:8000/health |

---

## Stop

```bash
# Stop containers (database data is preserved)
docker compose down

# View running containers
docker compose ps

# View logs
docker compose logs backend
docker compose logs frontend
docker compose logs postgres
```

---

## Database

The PostgreSQL database is initialized from:

```
database/
└── pharmacy_backup.sql    ← full dump of all tables + data
```

This file is automatically loaded by PostgreSQL the **first time** the `postgres_data` Docker volume is created (i.e., first run or after `docker compose down -v`).

The backup contains all tables and data:
- `medicines` — medicine catalog
- `sales` — historical daily sales
- `inventory` — current stock levels
- `forecasts` — forecast predictions
- `inventory_recommendations` — reorder recommendations
- `pharmacy_closed_dates` — closed pharmacy days

### Verify data loaded correctly

After starting, run these SQL queries to confirm:

```sql
-- Connect to the container
docker exec -it pharmacy_postgres psql -U pharmacy_user -d pharmacy_demand

-- Then run:
SELECT COUNT(*) FROM medicines;
SELECT COUNT(*) FROM sales;
SELECT COUNT(*) FROM inventory;
SELECT COUNT(*) FROM forecasts;
SELECT COUNT(*) FROM inventory_recommendations;
```

---

## Reset Database

> ⚠️ **WARNING:** This deletes ALL data in the Docker PostgreSQL volume and reloads from the backup file.

```bash
docker compose down -v       # deletes the postgres_data volume
docker compose up --build    # recreates from pharmacy_backup.sql
```

**Normal stop/start preserves all your data:**
```bash
docker compose down    # safe — data preserved
docker compose up      # data still there
```

---

## Environment Variables

Copy `.env.example` to `.env` to customize:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `POSTGRES_DB` | `pharmacy_demand` | Database name |
| `POSTGRES_USER` | `pharmacy_user` | DB username |
| `POSTGRES_PASSWORD` | `pharmacy_pass` | DB password |
| `CORS_ORIGINS` | `http://localhost:3000,...` | Allowed frontend origins |

---

## Troubleshooting

### Containers fail to start
```bash
docker compose logs backend
docker compose logs postgres
```

### Backend can't connect to database
The backend waits for PostgreSQL to be healthy before starting. If it still fails:
```bash
docker compose down -v
docker compose up --build
```

### Port already in use
Edit `docker-compose.yml` and change the host port:
- Frontend: `"3001:80"` → access at http://localhost:3001
- Backend: `"8001:8000"` → access at http://localhost:8001

### ML model not found
Ensure `ml/models/random_forest_v1.pkl` exists **before** running `docker compose up --build`.

### "permission denied" on Windows
Right-click Docker Desktop → "Run as administrator"

---

## Complete Workflow Test

After `docker compose up --build`, test the full pipeline:

1. Open http://localhost:3000
2. Go to **Current Stock** → verify medicines are listed
3. Go to **Daily Sales** → select today → enter quantities → **Save Sales**
4. Click **Save Sales & Run 7-Day Forecast**
5. Go to **Forecasts** → verify 7-day predictions appear
6. Go to **Purchase Recommendations** → verify BUY/SUFFICIENT status for each medicine

---

## Project Structure

```
pharmacy-demand-forecasting/
├── frontend/
│   ├── src/             ← React source
│   ├── package.json
│   ├── Dockerfile       ← Node build → Nginx serve
│   └── nginx.conf       ← reverse-proxy /api → backend
│
├── backend/
│   ├── main.py          ← FastAPI app + routes
│   ├── database.py      ← PostgreSQL connection
│   ├── sales_service.py
│   ├── inventory_service.py
│   ├── requirements.txt
│   └── Dockerfile       ← Python 3.12-slim
│
├── ml/
│   ├── models/
│   │   └── random_forest_v1.pkl   ← trained model (~2GB, not in git)
│   └── src/
│       ├── forecast_engine.py
│       ├── db_forecast_runner.py
│       └── load_data_db.py
│
├── database/
│   └── pharmacy_backup.sql        ← PostgreSQL init dump
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```
