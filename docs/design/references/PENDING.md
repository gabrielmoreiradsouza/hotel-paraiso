# Solicitações Pendentes de Referência

> Lista de pontos do projeto onde precisamos de referências, identidade visual ou inputs específicos do cliente. Atualizada conforme novas necessidades surgem.

## Status: solicitações ativas

### 🟡 BRAND-001 — Identidade Visual completa

**Quando precisamos:** Início da Fase 3 (Frontend público)

**O que precisamos receber:**

- [ ] Logo final em SVG vetorial + PNG transparente (mínimo 512px)
- [ ] Logo alternativo (versão clara para fundos escuros)
- [ ] Paleta de cores completa:
  - Primary (cor principal da marca)
  - Secondary (cor de apoio)
  - Accent (cor para CTAs e conversão)
  - Success, Warning, Error (estados)
  - Neutral/grays (5 tons)
- [ ] Tipografia:
  - Fonte para títulos (display)
  - Fonte para corpo de texto
  - Se for fonte paga, arquivos `.woff2`; se Google Font, nome exato
- [ ] Tom de voz da marca (formal/informal, 1ª/3ª pessoa, exemplos)
- [ ] Brand guidelines (se houver PDF)

**Por que precisamos:** Sem isso, todo componente visual fica com fallback temporário. Toda decisão de cor, tipografia e tom precisa esperar.

**Workaround atual:** Sistema usa paleta neutra premium (slate/stone/emerald) e Fraunces+Inter como fallback. Fases 0-2 podem ser desenvolvidas sem IDV final.

---

### 🟡 REF-001 — Sites concorrentes que convertem com ads

**Quando precisamos:** Antes da Fase 3 (quando começarmos frontend público)

**Contexto:** Você mencionou que quer fazer pesquisa profunda de sites diretos de hotéis que performam com anúncios pagos no Google Ads e Meta Ads.

**O que precisamos receber:**

- [ ] Lista de 3-5 sites de hotéis (preferencialmente brasileiros, mas internacionais também) que você sabe que rodam ads e convertem bem
- [ ] Para cada um, anote:
  - URL
  - Por que você considera que converte bem (impressão, dado, ou intuição)
  - O que mais te chama atenção visualmente
  - O que você considera ruim ou evitaria

**Como pesquisar:**

1. Procure "[seu destino] hotel" no Google e veja quais aparecem como Anúncio
2. No Facebook/Instagram, observe quais hotéis aparecem em ads patrocinados pra você
3. Use a [Biblioteca de Anúncios do Meta](https://www.facebook.com/ads/library) buscando por hotéis brasileiros
4. Veja [Google Ads Transparency Center](https://adstransparency.google.com) para ads pagos

**Por que precisamos:** Quer mais que best practices genéricas — quer copiar (e melhorar) o que está provadamente funcionando no seu nicho.

---

### 🟡 REF-002 — Fotos do hotel (placeholder até real)

**Quando precisamos:** Fase 2 (CMS) — mas pode ser progressivo

**O que precisamos receber:**

- [ ] Fotos profissionais dos quartos (mínimo 1 por categoria, ideal 5-8)
- [ ] Fotos das áreas comuns (recepção, restaurante, piscina, etc.)
- [ ] Fotos externas (fachada, vista, paisagem)
- [ ] Fotos de gastronomia (pratos, café da manhã)
- [ ] Fotos de experiências (atividades oferecidas)

**Especificações técnicas:**

- Resolução mínima: 2400px no lado maior
- Formato: JPG ou PNG (sistema converte para WebP/AVIF)
- Bem iluminadas, com pessoas (gera identificação) ou sem (mais aspiracional)
- Direitos de uso: garantir que tem licença pra usar comercialmente

**Workaround atual:** Usar fotos de banco de imagens (Unsplash) como placeholder durante desenvolvimento. Substituição em Fase 2.

---

### 🟡 REF-003 — Tom de voz e copy

**Quando precisamos:** Fase 2-3 (quando começarmos a escrever conteúdo real)

**O que precisamos receber:**

- [ ] Como vocês falam com hóspedes no WhatsApp hoje? (cole 3-5 exemplos)
- [ ] Vocês usam "você" ou "senhor/senhora"?
- [ ] Há jargões específicos do hotel ou da região que querem manter/evitar?
- [ ] Há histórias institucionais (do hotel, da família proprietária, da região) que queiram destacar?

**Workaround atual:** Sistema usa tom direto e claro padrão para executivos. Pode ser refinado quando você enviar.

---

### 🟡 REF-004 — Concorrentes diretos

**Quando precisamos:** Fase 0.5 (paralelo com criação de contas)

**O que precisamos receber:**

- [ ] Quem são os 3-5 maiores concorrentes diretos do Hotel Paraíso? (mesma cidade, mesmo público)
- [ ] Site deles (URL)
- [ ] Faixa de preço deles (se você sabe)
- [ ] O que vocês fazem melhor que eles
- [ ] O que eles fazem que vocês deveriam considerar

**Por que precisamos:** Para benchmarking de UX, copy e SEO. Não para copiar, mas para diferenciar conscientemente.

---

### 🟡 INFO-001 — Informações operacionais do hotel

**Quando precisamos:** Fase 2 (CMS) e Fase 4 (tracking de conversão = valor da reserva)

**O que precisamos receber:**

- [ ] Lista completa de categorias de quarto (com nomes oficiais)
- [ ] Faixa de preço por categoria
- [ ] Política de cancelamento padrão (em texto)
- [ ] Política de cancelamento alternativa (se houver tarifa não-reembolsável)
- [ ] Check-in / check-out (horários)
- [ ] O que está incluso no preço (café da manhã, Wi-Fi, etc.)
- [ ] Comodidades por categoria de quarto
- [ ] Endereço completo + telefone + email
- [ ] CNPJ + razão social (para footer)
- [ ] Redes sociais (Instagram, Facebook, TripAdvisor)

---

## Status: solicitações futuras (não-prioritárias)

### 🔵 REF-005 — Estilo de animações preferidas

**Quando perguntar:** Fase 3, ao definir microinteractions específicas

### 🔵 REF-006 — Direção de tom para emails transacionais

**Quando perguntar:** Fase 4, ao desenhar emails

### 🔵 REF-007 — Estilo das fotos de hóspedes (depoimentos)

**Quando perguntar:** Fase 3, ao desenhar seção de testimonials

---

## Como responder

Você pode responder de várias formas:

**Por mensagem aqui:** "REF-001: aqui estão 3 sites que rodam ads…"

**Criando arquivo:** salvar em `docs/design/references/inputs/REF-001-sites-ads.md` com links e descrições

**Enviando imagens:** salvar em `docs/design/references/screenshots/` com nome descritivo

**Por URL no chat:** simplesmente coloar URLs aqui, o sistema processa

Quando uma solicitação é resolvida, ela:

1. Sai desta lista
2. Vira entrada em `REFERENCES.md`
3. Componentes relacionados são atualizados
4. ADR é criado se a decisão for arquitetural

---

## Notas

- Você não precisa responder tudo de uma vez
- Pode responder no ritmo que faz sentido
- Sistema continua progredindo nas fases que não dependem das solicitações pendentes
- Em pontos onde a falta de input bloqueia, o sistema vai te avisar explicitamente
