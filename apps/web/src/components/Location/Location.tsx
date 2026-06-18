export function Location() {
  return (
    <section className="bg-brand-white py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold text-brand-black sm:text-4xl">
            Localização
          </h2>
          <p className="mt-4 text-beige-700">Ponte Nova, Minas Gerais</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Map */}
          <div className="aspect-video overflow-hidden rounded-sm bg-beige-100">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3750!2d-42.9!3d-20.41!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjDCsDI0JzM2LjAiUyA0MsKwNTQnMDAuMCJX!5e0!3m2!1spt-BR!2sbr!4v1"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Localização do Hotel Paraíso"
            />
          </div>

          {/* Info */}
          <div className="flex flex-col justify-center">
            <h3 className="font-display text-2xl font-bold text-brand-black">Como chegar</h3>
            <p className="mt-4 text-beige-700">
              Localizado no coração de Ponte Nova, com fácil acesso pela BR-120 e BR-262. A 150km de
              Belo Horizonte, ideal para demanda corporativa e turismo na Zona da Mata mineira.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-brand-gold">📍</span>
                <span className="text-sm text-beige-800">
                  Ponte Nova, MG — Zona da Mata Mineira
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-brand-gold">🚗</span>
                <span className="text-sm text-beige-800">~2h de Belo Horizonte via BR-262</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-brand-gold">📞</span>
                <span className="text-sm text-beige-800">Recepção 24 horas</span>
              </div>
            </div>

            <a
              href="https://www.google.com/maps/dir//Ponte+Nova+MG"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex w-fit items-center gap-2 rounded-sm bg-brand-gold px-6 py-3 text-sm font-semibold uppercase tracking-widest text-brand-black transition-colors hover:bg-gold-400"
            >
              Traçar rota
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
