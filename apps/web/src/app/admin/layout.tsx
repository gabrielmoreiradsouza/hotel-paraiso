'use client';

import { useState, useEffect } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_auth');
    if (saved === 'true') setAuthenticated(true);
    setLoading(false);
  }, []);

  async function handleLogin() {
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      sessionStorage.setItem('admin_auth', 'true');
      setAuthenticated(true);
    } else {
      setError('Senha incorreta');
    }
  }

  if (loading) return null;

  if (!authenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-beige-50 pt-20">
        <div className="w-full max-w-sm rounded-sm border border-beige-200 bg-white p-8 shadow-lg">
          <h1 className="mb-6 font-display text-2xl font-bold text-brand-black">Admin</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="Senha"
            className="w-full rounded-sm border border-beige-300 px-4 py-3 text-sm outline-none focus:border-brand-gold"
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <button
            onClick={handleLogin}
            className="mt-4 w-full rounded-sm bg-brand-gold py-3 text-sm font-semibold uppercase tracking-widest text-brand-black"
          >
            Entrar
          </button>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
