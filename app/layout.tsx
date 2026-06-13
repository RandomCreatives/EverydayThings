import type { Metadata } from 'next';
import './globals.css';
import { Navigation } from '@/components/Navigation';
import { PrintDrawerProvider } from '@/components/PrintDrawerProvider';
import { getServerEnv } from '@/lib/env';

const env = getServerEnv();

export const metadata: Metadata = {
  title: 'Everyday Things',
  description: 'A monochrome photography portfolio, archive, and fine art print shop.',
  metadataBase: new URL(env.siteUrl)
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <PrintDrawerProvider>
          <Navigation />
          {children}
        </PrintDrawerProvider>
      </body>
    </html>
  );
}
