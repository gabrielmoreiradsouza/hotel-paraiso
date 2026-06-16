# Proteção de Propriedade Intelectual

## Princípio

Frontend nunca é 100% inviolável (navegador precisa executar). O que **é** inviolável fica no backend. Para o frontend, aplicamos camadas que aumentam o custo do atacante exponencialmente.

## Camadas defensivas

### Camada 1 — Lógica de negócio no backend

- Pricing, regras de disponibilidade, lógica de promoção: tudo em Fastify
- Frontend recebe apenas dados processados
- Quem copia o frontend copia uma casca

### Camada 2 — Build ofuscado

- Next.js produção: minify + tree-shake nativo
- Plus: `next-build-obfuscator` em rotas críticas (`/reservas/*`)
- Variable mangling, control flow flattening, string array encoding

### Camada 3 — Source maps off em produção

- `productionBrowserSourceMaps: false` no `next.config.js`
- Source maps gerados separadamente, enviados ao Sentry, deletados do bundle
- Debug de produção via Sentry, não DevTools

### Camada 4 — Watermarking invisível

- Cada build gera string única: hash do commit + timestamp
- String embarcada em comentários e em variável interna
- Provável de origem em caso de cópia
- Script de detecção: monitora periodicamente sites suspeitos

### Camada 5 — Cloudflare na frente

- DNS proxy mode (orange cloud)
- Rate limit: 100 req/min por IP
- Bot Fight Mode ativo
- Challenge automático para comportamento anômalo (headless detection)
- WAF rules customizadas

### Camada 6 — Rate limit aplicacional

- Fastify rate-limit por sessão: 60 req/min para endpoints públicos
- Endpoint `/api/availability`: 30 req/min (mais sensível)
- Burst tolerance: 10 req em 1s, depois throttle

### Camada 7 — Telemetria de scraping

Eventos monitorados:

- `unusual_request_pattern` — >100 req em 5min de mesmo IP
- `high_frequency_search` — >20 searches em 1min
- `headless_browser_detected` — User-Agent suspeito ou fingerprint
- `referer_missing` — endpoints internos chamados sem referer válido

Todos vão para `event_log` + alerta WhatsApp/Slack.

### Camada 8 — Termos legais

- `robots.txt` permissivo só em `/` e páginas institucionais
- `Disallow: /api/`, `Disallow: /admin`
- Footer com aviso de copyright
- Termos de uso citando proibição de scraping comercial

### Camada 9 — Imagens protegidas

- CDN com referer check (Cloudflare Workers ou nginx)
- Hotlinking quebra
- Watermark dinâmico discreto em fotos profissionais (canto inferior, 5% opacity)
- Resoluções servidas conforme contexto (sem versão alta exposta diretamente)

## O que NÃO fazemos (e por quê)

| Anti-padrão                      | Razão para não usar                                   |
| -------------------------------- | ----------------------------------------------------- |
| Disable right-click / F12        | Não funciona contra ninguém técnico, irrita legítimos |
| Eval com código encriptado       | Quebra source maps do Sentry, manutenção horrível     |
| WebAssembly para esconder código | Overkill, dificulta debug interno                     |
| DRM completo                     | Degrada UX, prejudica SEO, perde acessibilidade       |
| Hide CSS via JS após load        | Pisca conteúdo, ruim para Core Web Vitals             |

## Resposta a incidente de cópia

Se detectado scraping ou cópia:

1. **Verificar telemetria** — quem, quando, escopo
2. **Bloquear** — Cloudflare WAF rule específica
3. **Documentar** — `docs/incidents/INC-{n}-scraping-{slug}.md`
4. **Fortalecer** — atualizar `defensive-rules/` se padrão recorrente
5. **Notificar** — se cópia comercial, considerar notificação extrajudicial

## Métricas de proteção

| Métrica                               | Alvo                 |
| ------------------------------------- | -------------------- |
| Falsos positivos (bloqueios injustos) | <0.1%                |
| Detecção de scraping conhecido        | >95%                 |
| Tempo para bloqueio após detecção     | <5min                |
| Tentativas de scraping bloqueadas/mês | acompanhar tendência |
