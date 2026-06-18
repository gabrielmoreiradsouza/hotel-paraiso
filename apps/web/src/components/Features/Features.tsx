const features = [
  {
    icon: '📶',
    title: 'Wi-Fi de alta velocidade',
    description: 'Internet rápida em todos os ambientes',
  },
  {
    icon: '🅿️',
    title: 'Estacionamento',
    description: 'Estacionamento gratuito e seguro',
  },
  {
    icon: '🍽️',
    title: 'Restaurante',
    description: 'Gastronomia mineira e internacional',
  },
  {
    icon: '🏟️',
    title: 'Pista de eventos',
    description: 'Espaço para eventos corporativos',
  },
  {
    icon: '⚡',
    title: 'Carregador veicular',
    description: 'Estação de carregamento elétrico',
  },
  {
    icon: '🐾',
    title: 'Pet friendly',
    description: 'Quartos preparados para seu pet',
  },
];

export function Features() {
  return (
    <section className="bg-beige-50 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold text-brand-black sm:text-4xl">
            Por que escolher o Paraíso
          </h2>
          <p className="mt-4 text-beige-700">Tudo que você precisa para uma estadia perfeita</p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex items-start gap-4 rounded-sm bg-brand-white p-6 shadow-sm"
            >
              <span className="text-3xl" role="img" aria-label={feature.title}>
                {feature.icon}
              </span>
              <div>
                <h3 className="font-display text-lg font-semibold text-brand-black">
                  {feature.title}
                </h3>
                <p className="mt-1 text-sm text-beige-700">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
