export const metadata = {
  title: 'Hotel Paraíso',
  description: 'Sua experiência começa aqui.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
