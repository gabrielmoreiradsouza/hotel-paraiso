#!/usr/bin/env bash
# Salva a conferência semanal "categoria reservada no site × UH alocada" (ADR-0014).
# Chamado por save-whatsapp-report.sh (launchd, segunda 9h). Só leitura na Artax.
# Uso: scripts/save-category-check.sh [pasta]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIR="${1:-$HOME/dev/design-mds/clientes/hotel-paraiso/relatorios}"
OUT="$DIR/categoria-$(date +%Y-%m-%d).txt"

# launchd roda com PATH mínimo: pnpm/node vêm do nvm.
NODE_BIN="$(ls -d "$HOME"/.nvm/versions/node/*/bin 2>/dev/null | tail -1)"
export PATH="${NODE_BIN:+$NODE_BIN:}/opt/homebrew/bin:/usr/local/bin:$PATH"

mkdir -p "$DIR"
cd "$ROOT"

# ~12 páginas cobrem pouco mais de uma semana de reservas; DR-001: o script pausa entre páginas.
set +e
scripts/with-env.sh pnpm exec tsx scripts/check-category-assignment.ts 12 >"$OUT" 2>&1
code=$?
set -e

# Saída 2 = divergências encontradas (o relatório é exatamente isso), não falha do script.
if [[ $code -ne 0 && $code -ne 2 ]]; then
  echo "$(date '+%F %T') conferência de categoria falhou (código $code), ver $OUT" >&2
  exit 1
fi
echo "$(date '+%F %T') conferência de categoria salva em $OUT"
