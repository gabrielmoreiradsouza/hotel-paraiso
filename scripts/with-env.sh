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

# Senha de admin de produção fica no Keychain (criptografada), não no .env.local.
# Só `-s`: `-a "$USER"` falha em silêncio quando USER não está no ambiente.
if command -v security >/dev/null 2>&1; then
  if KEYCHAIN_ADMIN="$(security find-generic-password -s hotel-paraiso-admin -w 2>/dev/null)"; then
    export ADMIN_PASSWORD="$KEYCHAIN_ADMIN"
  fi
  unset KEYCHAIN_ADMIN
fi

exec "$@"
