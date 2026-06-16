# Animações e Microinterações

> Sistema de motion estritamente controlado. Performance > criatividade. Sempre.

## Princípios

1. **Animação tem função, não decoração.** Cada animação responde uma das 3 perguntas: confirmar ação, guiar atenção, ou comunicar estado.
2. **Imperceptível > visível.** Boas animações são percebidas como suavidade, não como animação.
3. **Performance first.** Apenas `transform` e `opacity` (GPU-acelerados). Nunca animar `width`, `height`, `top`, `left`, `margin`, `padding`.
4. **`prefers-reduced-motion` é obrigatório.** Sistema respeita preferência do usuário sempre.
5. **Mobile é mais conservador.** Em dispositivos móveis, durações ~30% menores.

## Sistema de durações

```typescript
export const motion = {
  duration: {
    instant: 0, // 0ms - mudança imediata, sem animação
    fast: 150, // 150ms - microinterações (button, hover)
    base: 200, // 200ms - padrão (modais, transições)
    slow: 300, // 300ms - animações mais ricas (page transitions)
    slower: 500, // 500ms - apenas hero entrances e showcase
  },
  easing: {
    // Padrão para entradas (deceleração)
    out: 'cubic-bezier(0.16, 1, 0.3, 1)',
    // Padrão para saídas (aceleração)
    in: 'cubic-bezier(0.7, 0, 0.84, 0)',
    // Bidirecional suave
    inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
    // Bounce sutil (para acertos, sucesso)
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
};
```

### Regra de ouro de duração

- **Microinteração** (hover, click): 100-200ms
- **Mudança de estado** (modal, sheet): 200-300ms
- **Transição de página**: 300-400ms
- **Hero / showcase**: 500-800ms (apenas onde justificado)

## Framer Motion: padrões de uso

### Componente: botão com hover

```typescript
import { motion } from 'framer-motion'

export function PrimaryButton({ children, ...props }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="..."
      {...props}
    >
      {children}
    </motion.button>
  )
}
```

### Componente: card revealing on scroll

```typescript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: '-100px' }}
  transition={{ duration: 0.5, ease: 'easeOut' }}
>
  {children}
</motion.div>
```

### Stagger children (cards em grid aparecendo)

```typescript
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

<motion.div variants={container} initial="hidden" whileInView="show">
  {items.map(i => (
    <motion.div key={i.id} variants={item}>...</motion.div>
  ))}
</motion.div>
```

### Modal/Dialog enter/exit

```typescript
<AnimatePresence>
  {isOpen && (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />
      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      />
    </>
  )}
</AnimatePresence>
```

### Hero parallax sutil (apenas se justificado)

```typescript
const { scrollY } = useScroll()
const y = useTransform(scrollY, [0, 500], [0, -100])

<motion.img style={{ y }} />
```

Use parcimoniosamente — parallax pesa CPU em mobile.

## Reduced Motion: implementação obrigatória

```typescript
// hook customizado
import { useReducedMotion } from 'framer-motion';

const prefersReducedMotion = useReducedMotion();

const variants = prefersReducedMotion
  ? { hidden: { opacity: 0 }, show: { opacity: 1 } } // só fade
  : { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
```

### CSS fallback

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

## Page transitions

**MVP: sem transitions de página customizadas.** Next.js já faz o necessário. Adicionar custom apenas se medirmos impacto positivo na percepção de qualidade.

**Quando adicionar (Fase 3 enhancement):**

- Fade simples entre páginas (200ms)
- Nunca slide ou transformações pesadas
- Garantir que loading state não compete com animação

## Microinterações por contexto

### Motor de reservas

- **Date picker hover** — destaque sutil na célula (background, 100ms)
- **Date range selection** — preenchimento de range animado (150ms da esquerda pra direita)
- **Guest stepper** — número troca com fade quick + scale 0.9 → 1
- **Quarto selecionado** — border + checkmark fadeIn no canto
- **Loading availability** — skeleton shimmer (não spinner)
- **Confirmação criada** — checkmark grande com spring (única animação "celebratória" do flow)

### Site institucional

- **Hero entrance** — texto fade-in stagger (h1 → subtítulo → CTA), uma vez
- **Cards on scroll** — fade + slight y movement, uma vez por viewport
- **Gallery image change** — crossfade entre fotos (200ms)
- **FAQ accordion** — height auto com animação smooth (Framer Motion AnimateChangeInHeight)
- **Sticky header** — encolhe ao scrollar (h: 80px → 60px, transparent → solid)

### Admin

- **Dashboard cards** — sem animações de entrada
- **Tabela sort** — sem animação (instantâneo)
- **Modal de detalhe** — slide-in lateral suave (250ms)
- **Toast notifications** — slide-in bottom-right (200ms)

## Animações proibidas

- ❌ Bouncing exagerado em CTAs (parece amador)
- ❌ Spinning loaders coloridos (skeleton sempre)
- ❌ Confetes ou particles (a menos que A/B teste prove conversão)
- ❌ Animações de logo na entrada (atrasa percepção de loading)
- ❌ Carousel auto-rotate sem controle (mata acessibilidade)
- ❌ Parallax extremo (background movendo dramaticamente)
- ❌ Cursor effects (custom cursors, trails) — distração, sem ROI
- ❌ Scroll-jacking (sequestrar scroll do usuário)

## Performance budget de animação

| Métrica                    | Budget                                              |
| -------------------------- | --------------------------------------------------- |
| JS bundle Framer Motion    | <40KB gzipped                                       |
| FPS durante animação       | 60fps obrigatório (medido via DevTools Performance) |
| INP impactado por animação | 0 (animações em GPU não bloqueiam main thread)      |
| CLS de animação            | 0 (animações nunca causam layout shift)             |

Validar no Lighthouse CI a cada PR que adiciona ou modifica motion.

## Como decidir se uma animação vale a pena

Checklist antes de adicionar qualquer animação:

- [ ] Responde uma das 3 perguntas: confirmar ação? guiar atenção? comunicar estado?
- [ ] Pode ser feita só com `transform` e `opacity`?
- [ ] Funciona perfeitamente com `prefers-reduced-motion`?
- [ ] Duração ≤ 300ms (a menos que seja hero)?
- [ ] Não compete com outras animações na mesma tela?
- [ ] Em mobile, ainda parece suave?

Se qualquer "não" → remover ou repensar.

## Testes de regressão visual

Toda animação relevante tem teste no Playwright que valida:

- Estado inicial
- Estado intermediário (em ~50% da duração)
- Estado final

Usar `page.waitForFunction` com `getComputedStyle` ao invés de `waitForTimeout`.
