# Acessibilidade

> WCAG 2.1 AA é o **mínimo**. Acessibilidade afeta diretamente conversão (executivos > 40 anos importam).

## Por que acessibilidade importa pra conversão

- 15-20% da população tem alguma deficiência (visual, motora, cognitiva)
- Executivos 45+ frequentemente têm visão reduzida
- Bom contraste = mais legível em sol forte (mobile)
- Estrutura semântica ajuda SEO
- Acessibilidade força UI mais clara para TODOS

## Requisitos obrigatórios (auditados em CI)

### Contraste

| Combinação                    | Mínimo WCAG AA | Nosso alvo |
| ----------------------------- | -------------- | ---------- |
| Texto normal vs fundo         | 4.5:1          | 7:1        |
| Texto grande (18pt+) vs fundo | 3:1            | 4.5:1      |
| UI components vs fundo        | 3:1            | 4.5:1      |
| Texto em imagens              | 4.5:1          | 7:1        |

Validado por axe-core em CI.

### Foco visível

Todo elemento interativo tem outline visível ao receber foco por teclado:

```css
:focus-visible {
  outline: 2px solid hsl(160 84% 39%); /* accent */
  outline-offset: 2px;
}
```

**Nunca** usar `outline: none` sem alternativa.

### Navegação por teclado

- Tab move pra próximo elemento
- Shift+Tab move pra anterior
- Enter ativa botões/links
- Espaço ativa botões/checkboxes
- ESC fecha modais
- Setas navegam em listas/calendários
- Foco trapped dentro de modais

### Skip links

No topo de cada página:

```html
<a href="#main-content" className="sr-only focus:not-sr-only"> Pular para o conteúdo principal </a>
```

### Semantic HTML

- `<button>` para ações, `<a>` para navegação
- `<nav>`, `<main>`, `<aside>`, `<footer>`, `<header>` para landmarks
- `<h1>` único por página, hierarquia sem pulos
- Listas em `<ul>`/`<ol>`, não divs
- Formulários com `<label>` associado a inputs

### ARIA

Use apenas quando HTML semântico não basta:

- `aria-label` em ícones-only buttons
- `aria-describedby` para hints/erros
- `aria-live="polite"` para feedback de toast
- `aria-expanded` em accordions/dropdowns
- `aria-current="page"` em nav atual

**Regra de ouro**: HTML semântico > ARIA. Use ARIA pra complementar, não substituir.

### Alt text em imagens

```tsx
{
  /* Decorativa: alt vazio */
}
<img src="..." alt="" />;

{
  /* Funcional: descreve a função */
}
<img src="..." alt="Quarto Master Suite com vista para o mar e cama king" />;

{
  /* Logo: descreve a marca */
}
<img src="logo.svg" alt="Hotel Paraíso" />;
```

### Formulários acessíveis

```tsx
<div>
  <label htmlFor="email">Email</label>
  <input
    id="email"
    type="email"
    aria-describedby="email-hint email-error"
    aria-invalid={hasError}
  />
  <span id="email-hint">Usaremos para confirmar sua reserva</span>
  {hasError && (
    <span id="email-error" role="alert">
      Email inválido
    </span>
  )}
</div>
```

### Mensagens de erro

- Descritivas: "Email inválido" > "Erro"
- Próximas do campo
- Cor + ícone + texto (nunca só cor)
- Anunciadas para screen readers via `role="alert"`

### Motion

Já documentado em `MOTION.md`. Resumo:

- `prefers-reduced-motion` SEMPRE respeitado
- Sem animação automática longer than 5s sem controle de pause
- Sem flashes >3x/segundo (epilepsia)

## Ferramentas de auditoria

| Ferramenta                 | Quando                              |
| -------------------------- | ----------------------------------- |
| axe-core via Playwright    | CI a cada PR                        |
| Lighthouse                 | CI a cada PR (score >95)            |
| Manual com VoiceOver (Mac) | Antes de release de feature crítica |
| Manual com keyboard-only   | Antes de release de feature crítica |
| Lighthouse mobile          | Performance + accessibility         |

## Checklist por componente

Toda nova feature passa por:

- [ ] Tab navigation funciona end-to-end?
- [ ] Foco visível em todos elementos interativos?
- [ ] Contraste OK (validado por DevTools)?
- [ ] Screen reader anuncia mudanças relevantes?
- [ ] Funciona com 200% zoom?
- [ ] Funciona com texto aumentado em 150%?
- [ ] `prefers-reduced-motion` testado?
- [ ] Touch targets ≥44px em mobile?
- [ ] Erros são descritivos e próximos ao campo?
- [ ] Sem informação **apenas** por cor?

## Cuidados especiais para o motor de reservas

- **Calendar**: navegação por setas + arrow keys
- **Date selection**: anunciado por screen reader ("Selecionado 15 de março")
- **Stepper (guests)**: aria-label "Aumentar número de adultos", current value anunciado
- **Cards de quarto**: estrutura como `<article>` com `<h3>` semântico
- **Preço**: usar `<data>` element ou aria-label para screen reader entender (R$ 450 → "quatrocentos e cinquenta reais")
- **Checkout**: progresso anunciado a cada etapa
