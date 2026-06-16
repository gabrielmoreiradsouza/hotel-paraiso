# Imagens e Mídia

> Hotel é negócio visual. Qualidade de imagem é diferencial competitivo direto.

## Princípios

1. **Fotos profissionais > stock** sempre que possível
2. **Performance é parte da qualidade** — uma foto linda mas pesada que demora 3s pra carregar prejudica conversão
3. **Mobile-first também em imagens** — servir versão otimizada por viewport
4. **Acessibilidade obrigatória** — alt text descritivo em fotos funcionais

## Stack técnica

### next/image (obrigatório para todas)

```tsx
import Image from 'next/image';

<Image
  src={room.hero}
  alt={`${room.name} — vista panorâmica`}
  width={1600}
  height={900}
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  priority={isAboveFold}
  placeholder="blur"
  blurDataURL={room.heroBlurData}
  className="object-cover rounded-lg"
/>;
```

### CDN: Cloudflare Images

- Serve AVIF > WebP > JPG baseado em browser
- Resize automático por viewport
- Cache global edge
- Watermark dinâmico opcional (proteção)

Pipeline: foto original → upload Payload CMS → Cloudflare Images → next/image consome.

## Especificações por contexto

### Hero (página principal e quartos)

| Atributo            | Valor                       |
| ------------------- | --------------------------- |
| Aspect ratio        | 16:9 desktop, 4:3 mobile    |
| Resolução master    | 2400x1350 px                |
| Formato fonte       | JPEG quality 90             |
| Tamanho ideal final | <200KB (otimizado)          |
| Loading             | `priority` (above the fold) |
| Placeholder         | Blur (BlurHash ou PlaceID)  |

### Cards de quarto na listagem

| Atributo         | Valor                            |
| ---------------- | -------------------------------- |
| Aspect ratio     | 16:9                             |
| Resolução master | 1200x675 px                      |
| Sizes            | `(max-width: 768px) 100vw, 50vw` |
| Loading          | lazy (abaixo do fold)            |
| Object-fit       | cover                            |

### Galeria de quarto

| Atributo           | Valor                                        |
| ------------------ | -------------------------------------------- |
| Resolução master   | 2400x1600 px (4:3 vertical-friendly)         |
| Múltiplos formatos | 16:9, 4:3, 1:1 (mix recomendado)             |
| Loading            | lazy + intersection observer                 |
| Modal abre         | Resolução high (eager load próxima/anterior) |

### Thumbnails

| Atributo  | Valor      |
| --------- | ---------- |
| Resolução | 300x200 px |
| Quality   | 70         |
| Loading   | lazy       |

### Avatares (admin, hóspedes)

| Atributo  | Valor                         |
| --------- | ----------------------------- |
| Resolução | 200x200 px                    |
| Formato   | Initials fallback se sem foto |
| Cache     | Permanente                    |

### Logos de marca (ícones rede social, parceiros)

| Atributo | Valor                   |
| -------- | ----------------------- |
| Formato  | SVG sempre que possível |
| Fallback | PNG com transparência   |

## Tipos de foto recomendados (por categoria)

### Quartos

1. **Hero**: visão geral da cama + ambiente
2. **Detalhe da cama**: aconchego, qualidade
3. **Banheiro**: brilho, modernidade
4. **Vista da janela**: o cenário externo
5. **Detalhe diferenciador**: o que torna esse quarto único (jacuzzi, varanda, etc.)
6. **Vista de outro ângulo**: dimensionar o espaço

Mínimo 5 fotos por quarto, ideal 8-10.

### Áreas comuns

- Lobby/recepção (acolhedor)
- Restaurante (durante o dia, com mesas postas)
- Piscina (com céu azul se possível)
- Áreas externas (jardins, vista)
- Spa/wellness (se aplicável)

### Gastronomia

- Café da manhã armado (não pessoas comendo)
- Pratos signature do restaurante
- Bebidas/coquetelaria (se for diferencial)
- Detalhes de mesa posta

### Experiências

- Cada experiência oferecida com 1-2 fotos
- Pessoas reais (autorizadas) > modelos

### Lifestyle e branding

- Detalhes que comunicam marca (textura de toalha, flor na mesa, café servido)
- Mãos em ação (servindo, atendendo) sem mostrar rostos = mais universal

## Direitos de uso

Cada foto deve ter:

- [ ] Direito de uso comercial confirmado
- [ ] Liberação de imagem se houver pessoas reconhecíveis
- [ ] Crédito ao fotógrafo no admin (se contrato exigir)
- [ ] Armazenada no CMS com metadata

## Otimização técnica

### Processo automático

Upload no Payload CMS dispara:

1. Validação de formato + tamanho original
2. Geração de versões: 320, 640, 960, 1280, 1920, 2400 px
3. Compressão por nível (JPEG q85, WebP q80, AVIF q70)
4. Geração de BlurHash para placeholder
5. Geração de alt sugerido (via IA, sempre revisar)

### Lazy loading

Default: lazy
Exception: imagens above the fold com `priority`

### Layout shift prevention

Sempre passar `width` e `height` (ou `fill` com container dimensionado). CLS de imagem = 0.

## Acessibilidade

```tsx
// Decorativa (sem informação)
<Image src="/pattern.png" alt="" role="presentation" />

// Informativa (necessária)
<Image
  src={room.photo}
  alt={`Suíte Master Vista Mar: cama king-size de frente para janela panorâmica, banheira de hidromassagem ao fundo`}
/>

// Não usar texto em imagem (acessibilidade + SEO)
// Use overlay HTML
<div className="relative">
  <Image src="/hero.jpg" alt="Vista do hotel ao pôr do sol" />
  <div className="absolute inset-0 flex items-center justify-center">
    <h1 className="text-white">Bem-vindo ao Paraíso</h1>
  </div>
</div>
```

## Vídeo (Fase 3 enhancement)

**MVP: sem vídeo.** Vídeo é Fase 3 enhancement opcional.

Quando adicionar:

- Hero video: **silencioso, loop, MP4 + WebM, <2MB**, autoplay com fallback de foto
- Sempre `poster` definido (foto de placeholder)
- `preload="metadata"` para não baixar até precisar
- Controles disponíveis (não force autoplay sem mute)
- Vídeo é decorativo: nunca informação crítica em vídeo sem alternativa

## Proteção contra hotlink

Servir imagens via Cloudflare Worker que valida:

- Referer header dentro do domínio
- Não-bots conhecidos
- Rate limit por IP

Imagens diretas no `<img>` em outros sites não carregam.

## Watermark

Fotos profissionais podem receber watermark sutil dinâmico:

- Posição: canto inferior direito
- Opacity: 5-10%
- Tamanho: pequeno (10% da largura)
- Conteúdo: logo + URL

Aplicado em Cloudflare Worker, sem afetar foto master.
