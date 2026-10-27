#!/usr/bin/env bash
# Confere o teste A/B da home pelo domínio público, com o Cloudflare na frente (INC-003).
# Falha se a primeira visita não recebe cookie e variante, ou se o sorteio não varia.
# Uso: scripts/check-ab-edge.sh [url]
set -euo pipefail

URL="${1:-https://hotelparaiso.moreirads.cloud/}"
UA='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1'
A=0
B=0

for _ in $(seq 1 20); do
  headers="$(curl -sS -o /dev/null -D - -A "$UA" "$URL" | tr -d '\r')"
  variant="$(printf '%s\n' "$headers" | awk -F': ' 'tolower($1)=="x-ab-variant"{print $2}')"
  if ! printf '%s\n' "$headers" | grep -qi '^set-cookie: hp_ab='; then
    echo "FALHA: primeira visita sem Set-Cookie hp_ab" >&2
    exit 1
  fi
  case "$variant" in
    A) A=$((A + 1)) ;;
    B) B=$((B + 1)) ;;
    *) echo "FALHA: resposta sem x-ab-variant (Worker fora da rota?)" >&2; exit 1 ;;
  esac
done

echo "A=$A B=$B (20 primeiras visitas)"

# Quem já tem cookie mantém a variante e não recebe cookie de novo.
for v in A B; do
  headers="$(curl -sS -o /dev/null -D - -A "$UA" -b "hp_ab=$v" "$URL" | tr -d '\r')"
  got="$(printf '%s\n' "$headers" | awk -F': ' 'tolower($1)=="x-ab-variant"{print $2}')"
  if [[ "$got" != "$v" ]] || printf '%s\n' "$headers" | grep -qi '^set-cookie: hp_ab='; then
    echo "FALHA: cookie hp_ab=$v não respeitado (veio '$got')" >&2
    exit 1
  fi
done
# 20 sorteios 50/50: chance de sair só uma variante é ~2e-6.
if [[ $A -eq 0 || $B -eq 0 ]]; then
  echo "FALHA: sorteio sem variação" >&2
  exit 1
fi
echo "ok"
