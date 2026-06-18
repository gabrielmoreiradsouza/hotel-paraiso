'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const navItems = [
  { label: 'Quartos', href: '/#quartos' },
  { label: 'Restaurante', href: '/#restaurante' },
  { label: 'Eventos', href: '/#eventos' },
  { label: 'Galeria', href: '/galeria' },
  { label: 'Contato', href: '/#contato' },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 z-50 w-full bg-brand-black/90 backdrop-blur-sm">
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
          <Link
            href="/reservar"
            className="rounded-sm bg-brand-gold px-5 py-2 text-sm font-semibold uppercase tracking-wider text-brand-black transition-colors hover:bg-gold-400"
          >
            Reservar
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
            {menuOpen ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M3 12h18M3 6h18M3 18h18" />}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="border-t border-beige-900 bg-brand-black px-4 py-4 md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="block py-3 text-beige-300 transition-colors hover:text-brand-gold"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/#quartos"
            onClick={() => setMenuOpen(false)}
            className="mt-2 block rounded-sm bg-brand-gold py-3 text-center text-sm font-semibold uppercase tracking-wider text-brand-black"
          >
            Reservar
          </Link>
        </nav>
      )}
    </header>
  );
}
