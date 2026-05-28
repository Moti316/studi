import type { Metadata } from 'next';
import { Heebo } from 'next/font/google';
import './globals.css';

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  variable: '--font-heebo',
  display: 'swap',
  weight: ['400', '500', '700', '800'],
});

export const metadata: Metadata = {
  title: {
    default: 'StudiBuilder - הפוך מסמכים לקורסים',
    template: '%s | StudiBuilder',
  },
  description:
    'פלטפורמת AI בעברית שהופכת PDF/Word/PowerPoint לקורסי-לימוד אינטראקטיביים בסגנון Duolingo.',
  applicationName: 'StudiBuilder',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'StudiBuilder',
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className="font-sans bg-background text-foreground antialiased min-h-dvh">
        {children}
      </body>
    </html>
  );
}
