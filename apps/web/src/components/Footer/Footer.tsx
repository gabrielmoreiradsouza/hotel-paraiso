import Image from 'next/image';

export function Footer() {
  return (
    <footer className="bg-brand-black py-12 text-beige-300">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Image
              src="/brand/logo-192.png"
              alt="Hotel Paraíso"
              width={80}
              height={80}
              className="mb-4 invert"
            />
            <p className="text-sm text-beige-500">
              Hotel e Restaurante Paraíso.
              <br />
              Ponte Nova, MG.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-brand-gold">
              O Hotel
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#quartos" className="transition-colors hover:text-brand-gold">
                  Quartos
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-brand-gold">
                  Restaurante
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-brand-gold">
                  Eventos
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-brand-gold">
                  Galeria
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-brand-gold">
              Contato
            </h4>
            <ul className="space-y-2 text-sm">
              <li>(31) 3881-8049</li>
              <li>R. Pe. José Alvarenga, 50</li>
              <li>Paraíso — Ponte Nova, MG</li>
              <li>
                <a
                  href="mailto:hotelrparaiso@gmail.com"
                  className="transition-colors hover:text-brand-gold"
                >
                  hotelrparaiso@gmail.com
                </a>
              </li>
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-brand-gold">
              Informações
            </h4>
            <ul className="space-y-2 text-sm">
              <li>Check-in: 14h</li>
              <li>Check-out: 12h</li>
              <li>
                <a href="#" className="transition-colors hover:text-brand-gold">
                  Política de cancelamento
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-brand-gold">
                  Privacidade
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-beige-900 pt-8 text-center text-xs text-beige-600">
          &copy; {new Date().getFullYear()} Hotel e Restaurante Paraíso. Todos os direitos
          reservados.
        </div>
      </div>
    </footer>
  );
}
