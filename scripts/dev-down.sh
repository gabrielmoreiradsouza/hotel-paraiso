#!/usr/bin/env bash
set -euo pipefail

echo "Stopping Docker services..."
docker compose -f infra/docker/docker-compose.yml down

echo "✓ Services stopped"
