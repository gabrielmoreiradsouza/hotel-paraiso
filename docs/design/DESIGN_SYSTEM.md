# Sistema de Design — Hotel Paraíso

> Linguagem visual, padrões de UI e diretrizes de UX do projeto. Atualizações requerem ADR.

## Estratégia visual

### Posicionamento

**Conversion-first com refinamento premium sutil.** O site deve parecer familiar a quem usa Booking/Airbnb/Decolar (cognitive load mínimo) mas com refinamento que comunica que é uma reserva direta com o hotel (não uma OTA).

### Público-alvo principal

**Executivos.** Implicações práticas:

- **Mobile-first não-negociável** — 70%+ das reservas executivas começam no celular
- **Decisão em 30-90 segundos** — não há jornada de descoberta longa, é compra rápida
- **Tolerância zero a fricção** — sem animações lentas, vídeos pesados, ou storytelling longo
- **Confiança em padrões conhecidos** — Booking-style é uma feature, não um defeito
- **Sinais de confiança são críticos** — preço claro, foto fiel, política de cancelamento explícita, reviews visíveis
- **Eficiência > criatividade** — mas premium não pode parecer barato

### Estilo de referência (ground truth)

Padrão **OTA-style** (Booking.com, Airbnb, Decolar) usado como **biblioteca de padrões validados**. Esses sites investem bilhões em A/B testing — copiar a estrutura é copiar resultados.

**O que copiar literalmente:**

- Search bar persistente no topo (datas + hóspedes + buscar)
- Cards de quarto: foto grande à esquerda, info à direita, preço destacado, CTA à direita
- Filtros à esquerda em desktop, modal full-screen em mobile
- Calendário inline em desktop, modal em mobile
- Selo de "sem taxa de OTA" / "preço direto melhor"
- Reviews com nota destacada + texto + nome + data
- Breadcrumb de etapas no checkout (1. Quartos → 2. Seus dados → 3. Confirmação)

**O que NÃO copiar (e fazer melhor):**

- ❌ Ruído visual de "31 pessoas vendo agora" / "só 2 quartos disponíveis" exagerado
- ❌ Pop-ups invasivos de desconto
- ❌ Tipografia genérica system-ui sem personalidade
- ❌ Imagens pequenas e thumbnails ruins
- ❌ Anúncios e cross-sell agressivo

## Identidade Visual

### Status: **Pendente — aguardando definição do cliente**

> O Hotel Paraíso ainda não definiu identidade visual (logo, paleta, tipografia da marca). O sistema deve **solicitar essa informação no início da Fase 3** antes de começar a tematizar componentes.

### Fallback temporário (até IDV chegar)

Para desenvolvimento e testes durante Fases 0-2, usar **paleta neutra premium**:

```
Primary:    slate-900 (#0F172A) — texto, headers
Secondary:  stone-100 (#F5F5F4) — fundos, cards
Accent:     emerald-600 (#059669) — CTAs, confirmações
Neutral:    zinc-500 (#71717A) — textos secundários
Surface:    white (#FFFFFF) — base
Border:     zinc-200 (#E4E4E7) — divisões
```

Tipografia fallback:

```
Display:    Fraunces (serif elegante para títulos)
Body:       Inter (sans-serif limpa para tudo mais)
Mono:       JetBrains Mono (para códigos no admin)
```

### Quando o cliente fornecer IDV

Sistema deve solicitar (script `scripts/request-brand.ts` que gera prompt formal):

1. Logo (SVG vetorial + PNG transparente, mínimo 512px)
2. Paleta completa (mínimo: primary, secondary, accent, success, warning, error)
3. Tipografia (display + body; se específica, fonte file ou link Google Fonts)
4. Tom de voz (formal/informal, primeira/terceira pessoa, exemplos)
5. 3-5 fotos de referência do que NÃO querem (anti-exemplos)
6. Eventual brand book PDF

Após receber, atualizar:

- `packages/ui/src/tokens/brand.ts` (única fonte da verdade)
- `docs/design/BRAND_TOKENS.md` (documentação)
- Tailwind config consumindo os tokens
- Criar ADR documentando a IDV

## Documentos detalhados

| Tópico                             | Documento               |
| ---------------------------------- | ----------------------- |
| Tokens, paleta, tipografia, escala | `DESIGN_TOKENS.md`      |
| Sistema de componentes             | `COMPONENTS.md`         |
| Padrões de UI por contexto         | `UI_PATTERNS.md`        |
| Animações e microinterações        | `MOTION.md`             |
| Padrões do motor de reservas       | `BOOKING_FLOW.md`       |
| Padrões do admin                   | `ADMIN_PATTERNS.md`     |
| Responsividade e breakpoints       | `RESPONSIVE.md`         |
| Acessibilidade                     | `ACCESSIBILITY.md`      |
| Imagens e mídia                    | `MEDIA.md`              |
| Sistema de referências curadas     | `REFERENCES.md`         |
| Solicitações abertas (TODOs)       | `references/PENDING.md` |

## Princípios de design (não-negociáveis)

### 1. Mobile-first sempre

Layouts são desenhados pensando primeiro em 375px (iPhone SE) e progressivamente aumentam. Desktop é enhancement, não default.

### 2. Performance é design

- Imagens sempre com `next/image`, formatos AVIF/WebP, lazy load
- Animações usando apenas `transform` e `opacity` (compositor)
- Sem JS bloqueante; tudo crítico em SSR/SSG
- `prefers-reduced-motion` respeitado SEMPRE

### 3. Conversão > criatividade

Quando há conflito entre "ficaria mais bonito" e "converte mais", **conversão ganha**. Decisões estéticas que não passam por validação são experimentos opcionais, não defaults.

### 4. Familiaridade reduz fricção

Reinventar UI conhecida (ex: trocar onde fica o calendário, ou usar palavras incomuns para "buscar") é caro. Inovar onde diferencia (microinteractions premium, fotografia, copy), padronizar onde converte (estrutura, fluxo).

### 5. Premium é detalhe, não exagero

Premium se comunica por:

- Tipografia de qualidade (não system-ui)
- Whitespace generoso
- Fotos profissionais grandes
- Microinteractions sutis e precisas
- Tom de voz cuidadoso

NÃO se comunica por:

- Animações longas e flamboyant
- Vídeo hero pesado
- Cores excêntricas
- Logos animados na entrada

### 6. Identidade injetável

Tudo parametrizado por **design tokens**. Mudar IDV = trocar um arquivo de tokens. Nada hardcoded em componentes.

### 7. Sistema de referências vivo

Toda decisão estética relevante é apoiada por referência curada em `docs/design/references/`. Não há "achismo" — toda escolha tem precedente validado.

## Fluxo de design durante desenvolvimento

Quando uma decisão visual relevante aparecer, o sistema:

1. **Identifica a necessidade** (ex: "Como vai ser o card de quarto?")
2. **Consulta `REFERENCES.md`** para padrões já validados
3. **Se houver referência**, aplica o padrão
4. **Se não houver**, abre uma solicitação em `references/PENDING.md`:
   - Descreve o componente/contexto
   - Sugere 2-3 sites/apps para você analisar
   - Aguarda você enviar referências OU autorizar decisão baseada em best practice
5. **Após decisão**, documenta em `REFERENCES.md` com:
   - Screenshots/links das referências usadas
   - Componente afetado
   - Justificativa da escolha

Isso transforma o projeto em uma **biblioteca curada de padrões validados** ao longo do tempo.

## Stack de design

| Camada                 | Ferramenta                              |
| ---------------------- | --------------------------------------- |
| Tokens                 | TypeScript + CSS variables              |
| Componentes base       | shadcn/ui (customizado)                 |
| Estilização            | Tailwind CSS 4                          |
| Animações              | Framer Motion (estritamente controlado) |
| Ícones                 | Lucide React (mesmo set do shadcn)      |
| Tipografia             | Fontes auto-hospedadas via `next/font`  |
| Imagens                | next/image + Cloudflare Images          |
| Dashboards admin       | Tremor (consumindo tokens próprios)     |
| Gráficos custom        | Recharts                                |
| Component library docs | Storybook (Fase 3)                      |
