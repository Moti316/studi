import type { Metadata } from 'next';
import { Heebo, Rubik } from 'next/font/google';
import './globals.css';

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  variable: '--font-heebo',
  display: 'swap',
  weight: ['400', '500', '700', '800'],
});

// B1 (Premium-Clean) — Rubik is the primary brand font; Heebo kept as fallback.
const rubik = Rubik({
  subsets: ['hebrew', 'latin'],
  variable: '--font-rubik',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
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
    <html lang="he" dir="rtl" className={`${rubik.variable} ${heebo.variable}`}>
      <body className="text-foreground min-h-dvh bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
