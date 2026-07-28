export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center pt-24">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-beige-300 border-t-brand-gold" />
        <p className="mt-4 text-beige-600">Carregando...</p>
      </div>
    </main>
  );
}
