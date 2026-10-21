# ADR-0012: Código de rastreio do WhatsApp até a reserva na Artax

**Data:** 2026-10-21  
**Status:** aceito  
**Autor:** Claude (sessão hotel-paraiso-03), a pedido de Gabriel via design-mds-1e  
**Decisores:** Gabriel Moreira

## Contexto

O botão flutuante do WhatsApp mandava sempre a mesma mensagem ("Gostaria de saber mais sobre
o Hotel Paraíso"). A conversa e a reserva acontecem fora do site — a recepção digita a reserva
na Artax — então nenhum contato vindo do site ou de anúncio recebia crédito. Em outubro foram 5
cliques no WhatsApp vindos do Google Ads e zero atribuições, com campanha pagando por eles.

O wa.me não devolve nada ao site (nem telefone, nem confirmação de envio). O único elo possível
é um texto que o hóspede envia — e que pode ser lido no histórico da instância HRP da Evolution.

## Decisão

Cada clique gera no browser um código curto `S-XXXX` (4 caracteres do alfabeto
`ABCDEFGHJKMNPQRSTUVWXYZ23456789`, sem 0/O/1/I/L — regex `[A-HJ-NP-Z2-9]` combinada com o
time de mídia) que vai **no fim** da mensagem pré-preenchida. A origem nunca entra no texto.

- Sem quarto/datas: `Olá! Vim pelo site do Hotel Paraíso e quero fazer uma reserva. Código: S-XXXX`
- Com quarto/datas (estado do /reservar): `Olá! Vim pelo site do Hotel Paraíso e quero reservar o
quarto {Quarto}, de {dd/mm} a {dd/mm}, para {n} hóspedes. Código: S-XXXX`

O mesmo clique grava no servidor (`whatsapp_clicked` em `/api/events`) código + página +
quarto/datas + `ab_variant` + origem (`hp_origem`: utm, gclid).

O funil é calculado **sob demanda** em `GET /api/admin/whatsapp-report?days=7`, lendo três
fontes, sem persistir conversa nem telefone:

1. Cliques (Redis): `wa:click:{CODE}` (TTL 400 dias, `SET NX`) + índice `wa:clicks`.
2. Histórico da instância HRP na Evolution (`/chat/findMessages`, só leitura). Mensagem recebida
   com `Código: S-XXXX` liga a conversa ao clique. Número novo sem código até 30 min após um
   clique órfão = "provável site". Resposta do hotel com R$/tarifa/diária/disponibilidade/link =
   oferta. Tempo até a primeira resposta e conversas sem resposta.
3. Reservas da Artax criadas até 14 dias após o contato, casadas pelo telefone (últimos 8
   dígitos) ou pelo código na observação. Canceladas não contam.

O relatório mostra só os 4 últimos dígitos do telefone; cache de 30 min (`wa:report:v2:{dias}`).

## Opções consideradas

### Opção A: Histórico da Evolution sob demanda (escolhida)

**Prós:** nada muda na instância HRP (compartilhada com o atendimento); nenhum segredo novo em
produção; telefone e conversa não são persistidos do nosso lado (LGPD); recalculável.  
**Contras:** custo de leitura cresce com o período (~3,6 mil mensagens/semana, ~5 s); o filtro
por data da API é ignorado na v2.3.7, então pagina do mais novo para o mais antigo.

### Opção B: Webhook `MESSAGES_UPSERT` na instância HRP

**Prós:** tempo real, base para o painel de atendimento (ACOMPANHAMENTO #6).  
**Contras:** altera a configuração de uma instância em uso, exige endpoint público com
segredo e persistência de mensagens. Fica para o #6.

### Opção C: Recepção copia o código na observação da Artax

Mantida só como caminho secundário de cruzamento (o código na observação também casa). Não é
mais o mecanismo principal: depende de processo manual.

## Consequências

### Positivas

- Cliques do WhatsApp passam a ter origem rastreável até a reserva, sem trabalho da recepção.
- Funil por origem (hrp_regional / hrp_local / google_organico / direto / outros) e por variante A/B.

### Negativas

- "Oferta enviada" é heurística de texto; mensagem só com imagem/PDF de tarifa não conta.
- "Provável site" é estimativa; reportado separado das conversas com código.

### Neutras

- O evento genérico continua indo para `funnel:events` (contagem do painel) e GA4.
