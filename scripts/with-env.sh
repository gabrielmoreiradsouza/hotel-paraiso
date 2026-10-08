#!/usr/bin/env bash
# Roda um comando com as variáveis de .env.local carregadas, sem imprimir valores.
# Uso: scripts/with-env.sh <comando> [args...]
set -euo pipefail

if [[ $# -eq 0 ]]; then
  echo "uso: scripts/with-env.sh <comando> [args...]" >&2
  exit 2
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env.local"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "with-env: $ENV_FILE não encontrado" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

exec "$@"
