# Setup Guide

This file provides a complete setup flow for the Enterprise Real-Time Chat Application.

## 1) Prerequisites

Install these first:

- Docker Desktop (latest)
- Git
- Node.js 20+ and npm 10+ (for local frontend development)
- Python 3.12+ and pip (for local backend development)
- PostgreSQL 16 (only required for fully local backend setup)

Optional:

- Ollama (only for non-Docker local AI usage)

## 2) Recommended: Run Everything with Docker

From the workspace root:

```powershell
Copy-Item backend/.env.example backend/.env
docker compose up --build
```

Open:

- App: http://localhost
- API docs (through nginx): http://localhost/api/docs
- API docs (backend direct): http://localhost:8000/api/docs

Stop all services:

```powershell
docker compose down
```

Reset containers + volumes (removes DB and model cache data):

```powershell
docker compose down -v
```

## 3) Local Development (Without Docker)

### 3.1 Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Update `backend/.env` for local database access:

- `POSTGRES_HOST=localhost`
- `POSTGRES_PORT=5432`
- Keep `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` aligned with your local Postgres instance.

Then run migrations and start API:

```powershell
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### 3.2 Frontend

In a second terminal:

```powershell
cd frontend
npm install
npm start
```

Default frontend URL:

- http://localhost:4200

## 4) Hybrid Mode (Common During Development)

If you want local frontend/backend but Dockerized database only:

1. Start only DB service with Docker.
2. Point `backend/.env` to `POSTGRES_HOST=localhost`.

```powershell
docker compose up -d db
```

Then run backend and frontend locally as in section 3.

## 5) Testing

Backend tests:

```powershell
cd backend
pytest
```

Frontend unit tests:

```powershell
cd frontend
npm test
```

Frontend e2e tests:

```powershell
cd frontend
npx playwright test
```

## 6) Useful Commands

Rebuild containers after dependency changes:

```powershell
docker compose up --build
```

View logs:

```powershell
docker compose logs -f
```

Run a shell inside backend container:

```powershell
docker compose exec backend sh
```

## 7) Troubleshooting

- Port conflict on `80`: stop any local server using port 80 or remap nginx port in `docker-compose.yml`.
- Backend cannot connect to DB in local mode: verify `POSTGRES_HOST=localhost` and Postgres is running.
- Frontend API errors in local mode: confirm backend is running on port 8000 and frontend environment points to the right API base URL.
- AI responses missing: ensure `OLLAMA_ENABLED=true` and Ollama service/model is available (Docker setup handles this automatically).

## 8) First Success Checklist

- Can open app at http://localhost (Docker) or http://localhost:4200 (local frontend).
- Can open API docs.
- Can register/login.
- Can create a chat and send a message.
- Can run backend tests successfully.
