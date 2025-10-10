import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Village Tech Admin',
  description: 'HOA Officers Portal',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
