import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NorCal Gold Map',
  description: 'Interactive map of Northern California with multiple layer options',
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
