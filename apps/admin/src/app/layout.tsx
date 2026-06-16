export const metadata = {
  title: 'Hotel Paraíso — Admin',
  description: 'Painel administrativo.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
