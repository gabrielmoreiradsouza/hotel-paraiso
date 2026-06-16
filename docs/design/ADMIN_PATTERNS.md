# Padrões UX — Painel Admin

> Interface operacional para gestão do sistema, reservas, jornada do hóspede e saúde da plataforma.

## Filosofia

**Data-dense, eficiente, sem distração.** Admin é ferramenta de trabalho, não vitrine. Padrão de SaaS operacional (Linear, Stripe Dashboard, Vercel Dashboard) como referência.

## Princípios

1. **Densidade controlada** — mais informação por viewport, mas não confusão
2. **Keyboard-first** — toda ação principal acessível por atalho
3. **Performance crítica** — admin pode ter 1000s de linhas, virtualizar listas
4. **Modo escuro suportado** — desenvolvedores trabalham horas, dark mode importa
5. **Filtragem e busca em tudo** — nada é apenas listável, sempre buscável

## Layout global

```
┌─────────────────────────────────────────────────────────┐
│ Logo · [Buscar (⌘K)]               Notificações · Avatar│
├──────────┬──────────────────────────────────────────────┤
│ Sidebar  │  Conteúdo principal                          │
│          │                                              │
│ 📊 Dash  │  ┌──────────────────────────────────────┐   │
│ 📅 Reservas│  │  [Header com título + filtros]      │   │
│ 👥 Hóspedes│  └──────────────────────────────────────┘   │
│ 🏨 Quartos │  ┌──────────────────────────────────────┐   │
│ 📈 Jornada │  │                                       │   │
│ 🔔 Eventos │  │  [Tabela / dashboard / form]          │   │
│ 🚨 Sistema │  │                                       │   │
│ 📚 Aprend. │  │                                       │   │
│ ⚙️ Config  │  └──────────────────────────────────────┘   │
└──────────┴──────────────────────────────────────────────┘
```

### Sidebar

- Largura fixa: 240px expandida, 64px colapsada
- Tema escuro por padrão (modo claro opcional)
- Atalho `[` para toggle
- Items com ícone + label
- Active state: background accent + bar lateral

### Top bar

- Logo à esquerda (clica vai para dashboard)
- **Command palette** central (⌘K / Ctrl+K) — busca global
- Notificações à direita (badge se houver)
- Avatar usuário (dropdown: perfil, configurações, logout)

### Command palette (⌘K)

**Crítico para eficiência.** Permite navegar e executar ações sem mouse.

Categorias:

- **Páginas**: "Reservas", "Hóspedes", "Configurações"
- **Ações**: "Criar nova reserva", "Sincronizar com Artax", "Exportar reservas"
- **Buscar entidades**: reservas por número/nome, hóspedes por email/CPF

## Páginas principais

### Dashboard (home do admin)

Cards de KPI no topo (4 colunas desktop, 2 mobile):

- **Reservas hoje** — número + variação vs ontem
- **Receita do mês** — R$ + variação vs mês anterior
- **Taxa de ocupação** — % + visual de mini-gráfico
- **Conversão semana** — % + tendência

Linha 2 — gráficos médios:

- Reservas por dia (últimos 30 dias)
- Conversão por canal (Direto, Google Ads, Meta Ads, Orgânico)

Linha 3 — listas tácticas:

- Reservas recentes (últimas 10)
- Alertas do sistema (se houver)

### Reservas

**Visão lista (default)**

```
┌──────────────────────────────────────────────────────────┐
│ [Filtros: Status ▾] [Data ▾] [Origem ▾] [Buscar...]      │
│                                            [+ Nova]      │
├──────────────────────────────────────────────────────────┤
│ #12345  João Silva   Master  15-18 Mar  R$1.365  ✓ Conf │
│ #12344  Maria Santos Suite   12-14 Mar  R$890    ✓ Conf │
│ #12343  Pedro Souza  Std     10-12 Mar  R$540    ⏱ Pré  │
│ ...                                                       │
└──────────────────────────────────────────────────────────┘
```

- Virtualização para listas >100
- Click na linha abre modal lateral (não nova página) com detalhe
- Bulk actions: selecionar múltiplas → "Exportar", "Marcar como…"
- Sort por qualquer coluna

**Visão calendário (toggle)**

- Mapa de ocupação por quarto/data
- Hover na célula mostra resumo da reserva
- Click abre detalhe

**Visão funil (toggle)**

- Funil de conversão visualizado
- Drill-down para sessões que abandonaram em cada etapa

**Detalhe de reserva (modal lateral)**

- Header: número + status + ações (cancelar, modificar)
- Dados do hóspede
- Detalhes da estadia
- Histórico de eventos (event_log dessa reserva)
- Jornada do usuário que reservou (se houver session vinculada)
- Comunicações (emails, WhatsApp enviados)

### Hóspedes

Lista de hóspedes únicos (deduplicados por documento/email):

- Avatar (iniciais) + nome
- Email + telefone
- Total de estadias
- Última estadia
- LTV (R$ total gasto)

Detalhe do hóspede:

- Histórico completo de reservas
- Preferências detectadas (datas, quartos preferidos)
- Notas internas (a equipe pode adicionar)
- Comunicações trocadas

### Jornada (UX Analytics)

Esta é a tela mais inovadora do admin. Mostra a **jornada completa** de cada sessão.

**Lista de sessões**

- Filtros: convertidas / abandonadas / por canal
- Cada linha: ID anônimo, origem (UTM), device, primeira visita, duração, eventos, conversão sim/não

**Detalhe de sessão (timeline)**

```
🟢 10:32:15  Chegou via Google Ads
             Campaign: brand · Term: "hotel paraíso"
🔵 10:32:22  Viu home
🔵 10:32:45  Selecionou datas (15-18 Mar)
🔵 10:33:01  Buscou disponibilidade
🔵 10:33:08  Viu 3 quartos
🔵 10:33:42  Selecionou Suíte Master
🔵 10:34:05  Iniciou checkout
🟡 10:34:30  Erro de validação no CPF
🔵 10:34:48  Corrigiu CPF
🟢 10:35:12  RESERVA CRIADA #12345
             Valor: R$ 1.365
```

Visualização poderosa para identificar fricções. Vincula evento → entidade quando aplicável.

### Eventos (auditoria)

Tabela de `event_log` filtrável:

- Por entidade
- Por tipo
- Por usuário/sistema/webhook
- Por intervalo de tempo

Útil para debug: "quando essa reserva mudou de status?"

### Sistema (saúde)

Painel de observabilidade interno:

- Status geral: 🟢 saudável | 🟡 degradado | 🔴 incidente
- API Artax: latência, taxa de erro, última sync
- Banco: conexões ativas, queries lentas
- Filas BullMQ: jobs ativos, falhos, atrasados
- Webhooks: últimos recebidos, falhas
- Sentry: erros recentes, agrupados

Botões de ação:

- Forçar sincronização com Artax
- Limpar cache
- Reprocessar webhooks falhos

### Aprendizado (Learning)

Painel do sistema de aprendizado:

- **Incidentes ativos** — lista com status
- **Regras defensivas** — quantas ativas, quais mais violadas
- **Score de blindagem** — % de incidentes que geraram regra
- **Tendências** — incidentes por mês, MTTR

Click em incidente abre detalhes do `docs/incidents/INC-XXX.md`.

### Configurações

Subseções:

- **Geral** — nome do hotel, contatos, horários
- **Integração Artax** — credenciais (mascaradas), status
- **Tracking** — IDs GA4, GTM, Meta Pixel
- **Notificações** — quem recebe alertas (Slack, WhatsApp)
- **Usuários** — gestão de admin users + roles
- **Conteúdo** — link para Payload CMS (abre nova aba)

## Componentes específicos do admin

### Data Table

- Coluna sticky (1ª e às vezes última)
- Ordenação clicando no header
- Filtros inline (por coluna)
- Pagination ou infinite scroll (preferir infinite para listas)
- Density toggle: compact / normal / comfortable
- Export para CSV/XLSX

### Empty states

Toda tela tem empty state desenhado:

```
       📅
       Nenhuma reserva ainda

       Quando reservas chegarem pelo site ou Artax,
       elas aparecerão aqui.

       [Importar do Artax] [Criar reserva manual]
```

### Charts (Tremor + Recharts)

| Uso                             | Componente                 |
| ------------------------------- | -------------------------- |
| KPI cards                       | `<Card><Metric>` do Tremor |
| Bar chart simples               | Tremor `<BarChart>`        |
| Line chart com múltiplas séries | Recharts `<LineChart>`     |
| Funil                           | Recharts `<FunnelChart>`   |
| Mapa de calor                   | Recharts ou nivo           |

Cores dos gráficos puxam dos design tokens.

### Forms no admin

- Single column quando possível
- Sections com headers para forms longos
- Auto-save em alguns casos (configurações)
- Botões: "Salvar" (primary) + "Cancelar" (ghost)
- Confirmação obrigatória para ações destrutivas

## Atalhos de teclado

| Atalho      | Ação                             |
| ----------- | -------------------------------- |
| ⌘K / Ctrl+K | Command palette                  |
| ⌘/          | Atalhos de teclado (modal)       |
| g d         | Go to Dashboard                  |
| g r         | Go to Reservas                   |
| g h         | Go to Hóspedes                   |
| g j         | Go to Jornada                    |
| g s         | Go to Sistema                    |
| n r         | Nova reserva                     |
| /           | Focus na busca da página atual   |
| Esc         | Fechar modal / cancelar          |
| j / k       | Navegar lista (próximo/anterior) |
| Enter       | Abrir item selecionado           |

## Responsividade

Admin é principalmente desktop. Mobile suporta:

- Visualização de dashboard (read-only)
- Lista de reservas (sem bulk actions)
- Detalhe de reserva
- Notificações

Operações complexas (criar reserva manual, configurações) mostram aviso "Melhor experiência no desktop" e oferecem botão "Continuar mesmo assim" ou "Notificar quando estiver no desktop".

## Performance no admin

- Lista virtualizada com `@tanstack/react-virtual`
- Cache agressivo de dados (TanStack Query staleTime: 60s)
- Optimistic updates em mudanças simples
- Skeleton de tabela durante load
- Debounce em buscas (300ms)

## Segurança no admin

- Auth obrigatório (NextAuth 5)
- Roles: `owner`, `manager`, `staff`, `readonly`
- Auditoria em event_log de toda ação destrutiva (com quem fez)
- Session timeout: 12h
- 2FA obrigatório (Fase 5)
