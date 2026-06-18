import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sobre — Hotel e Restaurante Paraíso',
  description:
    'Conheça o Hotel e Restaurante Paraíso em Ponte Nova, MG. Tradição, conforto e gastronomia mineira para viajantes corporativos e famílias.',
};

export default function SobrePage() {
  return (
    <main className="pt-24 pb-16">
      {/* Hero */}
      <section className="relative h-[40vh] min-h-[300px] overflow-hidden">
        <Image
          src="/images/common/recepcao.jpg"
          alt="Recepção do Hotel Paraíso"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-brand-black/50" />
        <div className="relative z-10 flex h-full items-center justify-center">
          <h1 className="font-display text-4xl font-bold text-brand-white sm:text-5xl">
            Sobre o Hotel
          </h1>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-4xl px-4 py-16">
        <div className="prose prose-lg mx-auto">
          <h2 className="font-display text-2xl font-bold text-brand-black">
            Tradição e conforto em Ponte Nova
          </h2>
          <p className="mt-4 text-beige-800 leading-relaxed">
            O Hotel e Restaurante Paraíso é referência em hospedagem e gastronomia na região da Zona
            da Mata Mineira. Localizado em Ponte Nova, MG, recebemos tanto viajantes corporativos
            quanto famílias que buscam conforto, praticidade e uma experiência autêntica mineira.
          </p>

          <p className="mt-4 text-beige-800 leading-relaxed">
            Com acomodações que vão do funcional ao sofisticado — do nosso quarto Standard à Suíte
            Master com hidromassagem — oferecemos opções para todos os perfis. Nosso restaurante
            serve o melhor da culinária mineira e internacional, com café da manhã incluso em todas
            as estadias.
          </p>

          <h2 className="mt-12 font-display text-2xl font-bold text-brand-black">
            Infraestrutura completa
          </h2>
          <p className="mt-4 text-beige-800 leading-relaxed">
            O hotel conta com estacionamento gratuito, Wi-Fi de alta velocidade em todos os
            ambientes, pista de eventos para encontros corporativos, e até estação de carregamento
            para veículos elétricos. Também somos pet friendly — porque sabemos que seu companheiro
            faz parte da família.
          </p>

          <h2 className="mt-12 font-display text-2xl font-bold text-brand-black">
            Localização estratégica
          </h2>
          <p className="mt-4 text-beige-800 leading-relaxed">
            A apenas 150km de Belo Horizonte, com acesso fácil pelas rodovias BR-120 e BR-262, Ponte
            Nova é um polo regional que atrai profissionais de diversas áreas. Nosso hotel é a
            escolha natural para quem precisa de uma base confortável e bem localizada na região.
          </p>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-4">
          {[
            { value: '3', label: 'Categorias de quartos' },
            { value: '24h', label: 'Recepção' },
            { value: '150km', label: 'de Belo Horizonte' },
            { value: '★', label: 'Gastronomia mineira' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-3xl font-bold text-brand-gold">{stat.value}</div>
              <div className="mt-1 text-sm text-beige-700">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Link
            href="/reservar"
            className="inline-block rounded-sm bg-brand-gold px-10 py-4 text-sm font-semibold uppercase tracking-widest text-brand-black transition-colors hover:bg-gold-400"
          >
            Reserve sua estadia
          </Link>
        </div>
      </section>
    </main>
  );
}
