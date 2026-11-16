import { NextResponse } from 'next/server';

const LLMS_TXT = `# Hotel e Restaurante Paraíso

> Hotel em Ponte Nova, Minas Gerais. Conforto, gastronomia mineira e localização estratégica para viajantes corporativos, famílias e turistas.

## Informações Gerais

- **Nome:** Hotel e Restaurante Paraíso
- **Endereço:** Rua Padre José Alvarenga, 50 — Paraíso, Ponte Nova/MG, CEP 35430-303
- **Telefone:** (31) 3881-8049
- **WhatsApp:** (31) 3881-8049
- **Email:** hotelrparaiso@gmail.com
- **Site:** https://hotelparaiso.moreirads.cloud
- **Check-in:** 14h | **Check-out:** 12h
- **Estacionamento:** Gratuito
- **Pet friendly:** Sim
- **Wi-Fi:** Gratuito em todo o hotel
- **Carregador veicular elétrico:** Disponível

## Categorias de Quartos

### Confort (a partir de R$ 145/noite)
Ventilador, sem frigobar. Opções: Individual Confort (1 cama de solteiro, quarto compacto e silencioso, voltado para o fundo do hotel), Duplo Solteiro Confort (2 camas de solteiro) e Casal Confort (1 cama de casal). Inclui Wi-Fi, TV e café da manhã.

### Standard (a partir de R$ 209/noite)
Ar-condicionado, sem frigobar. Opções: Casal Standard (1 cama de casal) e Triplo Família Standard (até 3 adultos). Inclui Wi-Fi, TV e café da manhã.

### Luxo (a partir de R$ 164/noite)
Ventilador e frigobar. Opções: Casal Luxo (1 cama de casal) e Duplo Solteiro Luxo (2 camas de solteiro). Inclui Wi-Fi, TV e café da manhã.

### Suíte Master (a partir de R$ 232/noite)
Ar-condicionado e frigobar. Opções: Casal Master (1 cama de casal) e Triplo Família Master (cama de casal + cama de solteiro). Opção de hidromassagem por R$ 120-150/noite adicional, sujeita a disponibilidade.

### Crianças e pagamento
Aceitamos 1 criança de até 12 anos sem custo em qualquer acomodação, exceto o Individual Confort. Reservas pelo site não são cobradas antecipadamente: o pagamento é feito no hotel, no check-in. Cancelamento grátis até 1 dia antes da chegada.

## Restaurante

Gastronomia mineira autêntica. Café da manhã completo incluso em todas as diárias (buffet com pão de queijo, frutas, frios, bolos, broa com goiabada). Almoço e jantar à la carte com pratos da culinária mineira.

## Localização

Ponte Nova fica a 150km de Belo Horizonte (MG), na Zona da Mata mineira. O hotel está no bairro Paraíso, com fácil acesso ao centro da cidade. Região conhecida pela produção de café, cachaça e doces artesanais.

## Diferenciais

- Recepção 24 horas
- Restaurante próprio com gastronomia mineira
- Estacionamento gratuito
- Wi-Fi de alta velocidade
- Pet friendly
- Carregador veicular elétrico
- Pista de eventos para festas e confraternizações
- Cancelamento gratuito até 1 dia antes da chegada; sem cobrança antecipada nas reservas pelo site

## Reservas

Reserve pelo site https://hotelparaiso.moreirads.cloud/reservar ou pelo WhatsApp (31) 3881-8049.
`;

export function GET() {
  return new NextResponse(LLMS_TXT, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
