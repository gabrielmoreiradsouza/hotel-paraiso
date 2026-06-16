#!/usr/bin/env bash
set -euo pipefail

echo "Starting Docker services (Postgres + Redis)..."
docker compose -f infra/docker/docker-compose.yml up -d

echo "Waiting for services to be healthy..."
docker compose -f infra/docker/docker-compose.yml exec postgres pg_isready -U hotel_paraiso > /dev/null 2>&1
docker compose -f infra/docker/docker-compose.yml exec redis redis-cli ping > /dev/null 2>&1

echo "✓ Services ready"
