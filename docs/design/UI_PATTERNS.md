# Padrões de UI por Contexto

> Padrões consolidados para situações recorrentes. Quando em dúvida, consulte aqui antes de inventar.

## Estados de carregamento

### Skeleton (preferido)

- Match exato das dimensões do conteúdo
- Shimmer animation 1.5s loop
- Cor: surface-secondary
- Border radius: igual ao componente final

```tsx
<div className="space-y-3">
  <Skeleton className="h-48 w-full rounded-lg" />
  <Skeleton className="h-6 w-3/4" />
  <Skeleton className="h-4 w-1/2" />
</div>
```

### Spinner (apenas casos específicos)

- Submit de form
- Operações curtas (<3s)
- Em botões durante ação

```tsx
<Button disabled={isLoading}>{isLoading ? <Spinner /> : 'Reservar'}</Button>
```

### Progress bar

- Operações longas (upload, sync)
- Quando dá pra estimar progresso

### Indeterminate progress

- Reconciliação Artax, jobs admin
- Apenas no admin

## Estados de erro

### Inline (form fields)

```
Email
[joão@                    ]
⚠️ Email inválido
```

### Toast (operações)

```
✗ Não foi possível concluir a reserva
   Tente novamente em alguns instantes.
   [Tentar novamente]
```

### Página de erro

```
        ¯\_(ツ)_/¯

        Algo deu errado.

        Estamos investigando. Tente novamente
        em alguns instantes, ou entre em contato
        pelo WhatsApp.

        [Voltar pra home]  [Abrir WhatsApp]
```

### 404

```
        404
        Página não encontrada.

        Talvez você queira:
        - Ver nossos quartos
        - Voltar para a home
        - Falar com a gente
```

## Estados vazios

```
        📅

        Nenhuma reserva ainda

        Quando reservas chegarem pelo site
        ou Artax, elas aparecerão aqui.

        [+ Nova reserva]
```

Sempre com:

- Ícone ou ilustração
- Headline empática
- Explicação curta
- CTA pra próxima ação (quando aplicável)

## Confirmações destrutivas

```
┌────────────────────────────────────────┐
│                                         │
│  Tem certeza que deseja cancelar       │
│  esta reserva?                          │
│                                         │
│  #12345 — João Silva                   │
│  15-18 Mar · R$ 1.365                  │
│                                         │
│  Esta ação não pode ser desfeita.       │
│                                         │
│  [Voltar]            [Sim, cancelar]    │
│                                                  │
└────────────────────────────────────────┘
```

Padrão:

- Pergunta clara
- Contexto do que vai acontecer
- Botão destrutivo do lado direito (oposto da leitura natural)
- Confirmação requer ação consciente

## Feedback de sucesso

### Toast (operações regulares)

```
✓ Reserva criada com sucesso
   #12345 — João Silva
   [Ver detalhes]
```

### Inline (forms simples)

```
✓ Configurações salvas
```

### Página/seção (operações importantes)

```
        ✓
        Reserva confirmada!

        [resumo completo]

        [próximos passos]
```

## Notifications (banner persistente)

Para informações importantes não-bloqueantes:

```
┌──────────────────────────────────────────────────┐
│ ℹ️ Manutenção programada em 16/03 das 02h às 04h │
│    [Saiba mais]                              [X] │
└──────────────────────────────────────────────────┘
```

- Posição: topo da página
- Dispensável (botão X)
- Tipo: info, warning, success, error
- Persistente entre páginas (localStorage)

## Tooltips

**Apenas para info opcional não-crítica.**

```tsx
<Tooltip content="Você pode cancelar até 48h antes">
  <InfoIcon />
</Tooltip>
```

- Aparece após 500ms de hover
- Desaparece imediatamente
- Touch device: tap ativa, segundo tap fecha
- Texto curto (max 1 frase)

## Search e filtros

### Search principal

- Barra única no topo, persistente
- Auto-suggest após 2 caracteres
- Highlight do match no resultado
- Limpa com botão X visível quando preenchido

### Filtros (listagem)

- **Desktop**: sidebar à esquerda, sticky
- **Mobile**: button "Filtros" abre bottom sheet
- Mostrar contagem ativa: "Filtros (3)"
- Botão "Limpar" sempre visível quando há filtros aplicados
- Aplicação: instantânea (sem botão "Aplicar")

### Tags de filtro aplicado

```
Filtros aplicados:
[Preço: até R$500 ×] [Vista mar ×] [Limpar todos]
```

## Forms

### Layout

- Single column quando possível
- Labels acima dos campos
- Helper text abaixo do label, em texto pequeno
- Erro abaixo do campo
- Campos obrigatórios marcados com `*` (e legenda no topo)

### Validação

- **On blur**: valida ao sair do campo
- **On submit**: valida tudo, foca no primeiro erro
- **On change**: NÃO valida (irrita), exceto campos com pattern (CPF, CEP)
- Erro permanece até campo ser editado de novo (não desaparece sozinho)

### Auto-format

- CPF: `123.456.789-00`
- CNPJ: `12.345.678/0001-90`
- Telefone: `(11) 91234-5678`
- CEP: `12345-678`
- Cartão: `1234 5678 9012 3456`
- Data: aceita várias entradas, normaliza para padrão

### Multi-step

- Stepper visual no topo
- Botão "Voltar" sempre disponível
- Estado preservado se voltar
- Confirmação se sair com dados não salvos

## Navigation

### Header (público)

```
[Logo]   Quartos · Sobre · Gastronomia · Experiências   [Buscar] [PT/EN]
```

- Sticky no topo após scroll
- Background transparente sobre hero, sólido após
- Mobile: hamburger menu (slide right)

### Footer

```
┌──────────────────────────────────────────────────────┐
│ Logo            Quick Links      Contato             │
│ Tagline curta   - Quartos        Endereço             │
│                 - Sobre          Telefone             │
│                 - Contato        Email                │
│                                                       │
│ ──────────────────────────────────────────           │
│                                                       │
│ © 2026 Hotel Paraíso · CNPJ XX.XXX/...               │
│ [Termos] [Privacidade] [Cookies]    [@] [f] [in]    │
└──────────────────────────────────────────────────────┘
```

### Breadcrumb

- Apenas em páginas profundas (quartos > detalhe)
- Não usar na home/lista
- Mobile: pode esconder ou colapsar

## Conteúdo institucional

### Hero

- Headline + subtítulo + CTA
- Foto/vídeo de fundo
- Altura: 70vh desktop, 60vh mobile

### Seção típica

```
        [Eyebrow text]

        Headline grande

        Subtítulo explicativo de 1-2 linhas
        sobre o que essa seção apresenta.

        [conteúdo da seção]
```

### Cards de feature

- 3-4 colunas desktop, stack mobile
- Ícone + título + descrição
- Não exagerar (max 6-8 features)

### Testimonials

- 1-3 por viewport
- Foto + nome + cidade + texto
- Carrossel se mais de 3

## Estados especiais

### Logged in vs logged out

- MVP não tem login público (Fase futura)
- Admin sempre requer login

### Onboarding

- Admin tem onboarding curto (3 passos) na primeira sessão
- Não pular se primeira vez
- Botão "Pular" disponível mas discreto

### Maintenance mode

- Página única em todos os caminhos
- Logo + mensagem + horário previsto + email contato
- Mantém SEO (status 503 com Retry-After header)
