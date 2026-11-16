import Image from 'next/image';
import { BedDouble, Fan, Refrigerator, Snowflake, Info } from 'lucide-react';
import { climateLabel, type Accommodation } from '@/lib/accommodations';

type Tone = 'dark' | 'light';

/** Foto da acomodação ou espaço neutro — nunca a foto de outra categoria (ADR-0014). */
export function AccommodationPhoto({
  accommodation,
  sizes,
  className = '',
  tone = 'dark',
}: {
  accommodation: Pick<Accommodation, 'name' | 'images'>;
  sizes: string;
  className?: string;
  tone?: Tone;
}) {
  const src = accommodation.images[0];
  const placeholder =
    tone === 'dark' ? 'bg-white/[0.06] text-white/40' : 'bg-beige-100 text-beige-600';
  return (
    <div className={`relative overflow-hidden ${placeholder} ${className}`}>
      {src ? (
        <Image src={src} alt={accommodation.name} fill className="object-cover" sizes={sizes} />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1">
          <BedDouble className="h-6 w-6" aria-hidden="true" />
          <span className="text-[10px] uppercase tracking-wider">Fotos em breve</span>
        </div>
      )}
    </div>
  );
}

/** Cama, climatização e frigobar — o que define a acomodação para o hóspede. */
export function AccommodationFacts({
  accommodation,
  tone = 'dark',
}: {
  accommodation: Pick<Accommodation, 'bed' | 'climate' | 'minibar'>;
  tone?: Tone;
}) {
  const chip =
    tone === 'dark'
      ? 'border-white/[0.12] bg-white/[0.04] text-white/75'
      : 'border-beige-300 bg-white text-beige-800';
  const ClimateIcon = accommodation.climate === 'ar' ? Snowflake : Fan;
  return (
    <ul className="flex flex-wrap gap-1.5 text-xs" aria-label="Características">
      <li className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${chip}`}>
        <BedDouble className="h-3.5 w-3.5" aria-hidden="true" />
        {accommodation.bed}
      </li>
      <li className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${chip}`}>
        <ClimateIcon className="h-3.5 w-3.5" aria-hidden="true" />
        {climateLabel(accommodation.climate)}
      </li>
      <li className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${chip}`}>
        <Refrigerator className="h-3.5 w-3.5" aria-hidden="true" />
        {accommodation.minibar ? 'Frigobar' : 'Sem frigobar'}
      </li>
    </ul>
  );
}

export function AccommodationWarning({
  warning,
  tone = 'dark',
}: {
  warning: string | null;
  tone?: Tone;
}) {
  if (!warning) return null;
  const box =
    tone === 'dark'
      ? 'border-amber-400/40 bg-amber-400/10 text-amber-100'
      : 'border-amber-300 bg-amber-50 text-amber-900';
  return (
    <p className={`flex gap-2 rounded-md border px-3 py-2 text-xs leading-relaxed ${box}`}>
      <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{warning}</span>
    </p>
  );
}
