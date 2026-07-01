#!/usr/bin/env bash
set -euo pipefail

# Wait for PostgreSQL to accept connections.
echo "Waiting for database at ${POSTGRES_HOST}:${POSTGRES_PORT}..."
python - <<'PY'
import os, time, socket
host = os.environ.get("POSTGRES_HOST", "db")
port = int(os.environ.get("POSTGRES_PORT", "5432"))
for _ in range(60):
    try:
        with socket.create_connection((host, port), timeout=2):
            print("Database is reachable.")
            break
    except OSError:
        time.sleep(1)
else:
    raise SystemExit("Database did not become ready in time.")
PY

# Generate the initial migration on first boot, then apply all migrations.
if [ -z "$(ls -A alembic/versions/*.py 2>/dev/null)" ]; then
  echo "No migrations found — generating initial migration."
  alembic revision --autogenerate -m "init schema"
fi

echo "Applying migrations..."
alembic upgrade head

echo "Starting API server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
