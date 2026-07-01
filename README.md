# Enterprise Real-Time Chat Application

A production-shaped, full-stack real-time chat platform built to learn enterprise engineering practices.

## Setup Guide

For complete setup options (Docker, local, hybrid, tests, and troubleshooting), see [SETUP_README.md](SETUP_README.md).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 19, TypeScript, Angular Material, RxJS, Signals, SCSS |
| Backend | FastAPI, Python 3.12, SQLAlchemy 2.0, Alembic, Pydantic v2 |
| Realtime | WebSockets |
| Database | PostgreSQL 16 |
| DevOps | Docker, Docker Compose, Nginx, GitHub Actions |
| Testing | Pytest (backend), Playwright (frontend) |

## Architecture

Clean Architecture with strict layering on the backend:

```
Router (presentation) -> Service (business logic) -> Repository (interface)
    -> SQLAlchemy implementation -> PostgreSQL
```

- **REST** is the system of record (durable reads/writes).
- **WebSocket** is the real-time notification layer (live messages, typing, presence).
- **Persist, then broadcast.** Authorization happens in the service layer.

## Monorepo Layout

```
.
├── backend/      # FastAPI application
├── frontend/     # Angular 19 SPA
├── nginx/        # Reverse proxy config
├── docker-compose.yml
└── .github/      # CI/CD workflows
```

## Quick Start (Docker)

```bash
cp backend/.env.example backend/.env
docker compose up --build
```

- Frontend: http://localhost
- API docs: http://localhost/api/docs
- API direct: http://localhost:8000/api/docs

## Local Backend Dev

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

## Local Frontend Dev

```bash
cd frontend
npm install
npm start
```

## Testing

```bash
# Backend
cd backend && pytest

# Frontend E2E
cd frontend && npx playwright test
```
