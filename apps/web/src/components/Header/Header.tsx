'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/LanguageSwitcher/LanguageSwitcher';

export function Header({ locale }: { locale: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const t = useTranslations('nav');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: t('about'), href: '/sobre' },
    { label: t('rooms'), href: '/#quartos' },
    { label: t('restaurantNav'), href: '/#restaurante' },
    { label: t('gallery'), href: '/galeria' },
    { label: t('contact'), href: '/#contato' },
  ];

  return (
    <>
      <header
        className={`fixed top-0 z-50 w-full transition-all duration-400 ${
          scrolled ? 'bg-brand-black/55 backdrop-blur-xl' : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Image src="/brand/favicon.png" alt="HRP" width={36} height={36} className="invert" />
            <span className="hidden font-display text-lg font-semibold text-brand-white sm:block">
              Hotel Paraíso
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm tracking-wide text-beige-300 transition-colors hover:text-brand-gold"
              >
                {item.label}
              </Link>
            ))}
            <LanguageSwitcher locale={locale} />
            <Link
              href="/reservar"
              className="rounded-sm bg-brand-gold px-5 py-2 text-sm font-semibold uppercase tracking-wider text-brand-black transition-colors hover:bg-gold-400"
            >
              {t('book')}
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="text-brand-white md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile fullscreen overlay (O13) */}
      <div
        className={`fixed inset-0 z-[60] bg-brand-black/92 backdrop-blur-2xl transition-opacity duration-300 md:hidden ${
          menuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        {/* Close button */}
        <button
          type="button"
          className="absolute right-4 top-4 p-2 text-brand-white"
          onClick={() => setMenuOpen(false)}
          aria-label="Fechar menu"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Centered nav links */}
        <nav className="flex h-full flex-col items-center justify-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="font-display text-2xl font-semibold text-beige-300 transition-colors hover:text-brand-gold"
            >
              {item.label}
            </Link>
          ))}

          <div className="mt-4">
            <LanguageSwitcher locale={locale} />
          </div>

          <Link
            href="/reservar"
            onClick={() => setMenuOpen(false)}
            className="mt-2 rounded-sm bg-brand-gold px-8 py-3 text-sm font-semibold uppercase tracking-wider text-brand-black transition-colors hover:bg-gold-400"
          >
            {t('book')}
          </Link>
        </nav>
      </div>
    </>
  );
}
