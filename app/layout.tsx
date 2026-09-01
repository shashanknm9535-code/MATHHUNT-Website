import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MATHHUNT Admin Control Center | MATHLITE CLUB MVJCE',
  description: 'Authoritative Admin Dashboard for MATHHUNT Android Game - Mathematics Department, MVJ College of Engineering',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-cyber-dark text-gray-100">{children}</body>
    </html>
  );
}
