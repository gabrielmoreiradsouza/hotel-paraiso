#!/usr/bin/env bash
# Salva o relatório semanal do WhatsApp (ADR-0012) em JSON, sem sessão de admin.
# Usa o token só de leitura em ~/.claude/credentials/hrp-report-token.
# Agendado pelo launchd: ~/Library/LaunchAgents/com.moreirads.hotelparaiso-whatsapp-report.plist
# Uso: scripts/save-whatsapp-report.sh [dias] [pasta]
set -euo pipefail

DAYS="${1:-7}"
DIR="${2:-$HOME/dev/design-mds/clientes/hotel-paraiso/relatorios}"
TOKEN_FILE="$HOME/.claude/credentials/hrp-report-token"
URL="https://hotelparaiso.moreirads.cloud/api/admin/whatsapp-report?days=$DAYS"

mkdir -p "$DIR"
OUT="$DIR/whatsapp-$(date +%Y-%m-%d).json"
TMP="$(mktemp "$DIR/.whatsapp.XXXXXX")"
trap 'rm -f "$TMP"' EXIT

# O token vai pelo stdin do curl (-H @-): não aparece na lista de processos.
status="$(printf 'Authorization: Bearer %s\n' "$(cat "$TOKEN_FILE")" |
  curl -sS --max-time 120 -H @- -o "$TMP" -w '%{http_code}' "$URL")"

if [[ "$status" != "200" ]]; then
  echo "$(date '+%F %T') falhou: HTTP $status" >&2
  exit 1
fi
mv "$TMP" "$OUT"
echo "$(date '+%F %T') salvo em $OUT"
