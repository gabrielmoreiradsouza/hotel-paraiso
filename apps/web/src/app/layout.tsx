export const metadata = {
  title: 'Hotel Paraíso',
  description: 'Sua experiência começa aqui.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {/* GTM will be injected here when NEXT_PUBLIC_GTM_CONTAINER_ID is set */}
        {children}
      </body>
    </html>
  );
}
