import { getTranslations } from 'next-intl/server';
import { Star } from 'lucide-react';

const reviews = [
  {
    name: 'Carlos M.',
    date: '2026-07',
    rating: 5,
    text: 'Excelente hotel! Quarto limpo, café da manhã maravilhoso e atendimento nota 10. Com certeza voltarei.',
  },
  {
    name: 'Fernanda S.',
    date: '2026-06',
    rating: 5,
    text: 'Melhor custo-benefício de Ponte Nova. Fiquei na suíte master e superou as expectativas. Estacionamento amplo e seguro.',
  },
  {
    name: 'Roberto A.',
    date: '2026-08',
    rating: 4,
    text: 'Ótima localização, perto de tudo. Equipe muito atenciosa. O restaurante do hotel serve uma comida mineira deliciosa.',
  },
  {
    name: 'Ana Paula L.',
    date: '2026-05',
    rating: 5,
    text: 'Hotel pet friendly de verdade! Meu cachorro foi muito bem recebido. Quarto confortável e silencioso.',
  },
  {
    name: 'Marcos V.',
    date: '2026-08',
    rating: 5,
    text: 'Viajo a trabalho para Ponte Nova frequentemente e sempre fico aqui. Wi-Fi excelente, check-in rápido e café completo.',
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          className={i < rating ? 'fill-brand-gold text-brand-gold' : 'text-beige-400'}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

function formatDate(dateStr: string, locale: string): string {
  const [year, month] = dateStr.split('-');
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString(locale === 'pt' ? 'pt-BR' : 'en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export async function Reviews() {
  const t = await getTranslations('reviews');

  return (
    <section className="bg-brand-black py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="mb-10 text-center">
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">{t('title')}</h2>
          <div className="mt-4 flex items-center justify-center gap-3">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={20}
                  className={
                    i < 4
                      ? 'fill-brand-gold text-brand-gold'
                      : 'fill-brand-gold/40 text-brand-gold/40'
                  }
                  strokeWidth={1.5}
                />
              ))}
            </div>
            <span className="font-display text-2xl font-bold text-white">4.2</span>
            <span className="text-sm text-beige-400">{t('count')}</span>
          </div>
          <p className="mt-2 text-sm text-beige-500">{t('source')}</p>
        </div>

        {/* Reviews grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.slice(0, 3).map((review) => (
            <div
              key={review.name}
              className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
            >
              <StarRating rating={review.rating} />
              <p className="mt-4 text-sm leading-relaxed text-beige-300">
                &ldquo;{review.text}&rdquo;
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">{review.name}</span>
                <span className="text-xs text-beige-500">{formatDate(review.date, 'pt')}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Extra reviews on mobile (show 2 more) */}
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:hidden">
          {reviews.slice(3, 5).map((review) => (
            <div
              key={review.name}
              className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
            >
              <StarRating rating={review.rating} />
              <p className="mt-4 text-sm leading-relaxed text-beige-300">
                &ldquo;{review.text}&rdquo;
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">{review.name}</span>
                <span className="text-xs text-beige-500">{formatDate(review.date, 'pt')}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: show remaining 2 */}
        <div className="mt-5 hidden gap-5 lg:grid lg:grid-cols-2 lg:mx-auto lg:max-w-[calc(66.666%+0.625rem)]">
          {reviews.slice(3, 5).map((review) => (
            <div
              key={review.name}
              className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
            >
              <StarRating rating={review.rating} />
              <p className="mt-4 text-sm leading-relaxed text-beige-300">
                &ldquo;{review.text}&rdquo;
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">{review.name}</span>
                <span className="text-xs text-beige-500">{formatDate(review.date, 'pt')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
