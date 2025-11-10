import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Platforma Grădinițe',
  description: 'Sistem de management pentru grădinițe',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ro">
      <body className="bg-gradient-to-br from-blue-50 to-pink-50">
        {children}
      </body>
    </html>
  );
}
