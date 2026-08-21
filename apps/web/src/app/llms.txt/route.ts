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

### Confort (a partir de R$ 130/noite)
Acomodação acessível com ventilador de teto. Opções: individual (1 cama solteiro), duplo (2 camas solteiro) ou casal. Inclui Wi-Fi, TV LED 32", frigobar e café da manhã.

### Standard (a partir de R$ 180/noite)
Quarto com ar-condicionado para viajantes corporativos. Opções: individual, casal ou triplo (até 3 adultos). Inclui Wi-Fi rápido, TV LED 32", frigobar, mesa de trabalho e café da manhã.

### Luxo (a partir de R$ 280/noite)
25m² com acabamentos premium. Ventilador de teto silencioso, TV LED 50", frigobar, roupão, chinelos, ducha dupla e amenities premium. Ideal para casais ou estadias longas.

### Suíte Master (a partir de R$ 420/noite)
35m² — a melhor acomodação do hotel. Ar-condicionado, sala de estar separada, TV LED 55", room service, vista privilegiada. Opção de hidromassagem por R$ 120-150/noite adicional.

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
- Cancelamento gratuito até 48h antes do check-in

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
