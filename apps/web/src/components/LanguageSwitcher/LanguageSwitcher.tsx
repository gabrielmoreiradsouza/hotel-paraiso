'use client';

import { useRouter } from 'next/navigation';

export function LanguageSwitcher({ locale }: { locale: string }) {
  const router = useRouter();

  async function switchLocale(newLocale: string) {
    await fetch('/api/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: newLocale }),
    });
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={() => switchLocale(locale === 'pt' ? 'en' : 'pt')}
      className="text-xs font-medium text-beige-400 transition-colors hover:text-brand-gold"
      aria-label="Switch language"
    >
      {locale === 'pt' ? 'EN' : 'PT'}
    </button>
  );
}
