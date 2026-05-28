export default function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 p-8">
      <div className="text-center space-y-4">
        <p className="text-sm font-medium text-accent-500 tracking-wider uppercase">
          Phase 0 · Foundation
        </p>
        <h1 className="text-5xl font-bold tracking-tight">
          Studi<span className="text-primary-500">Builder</span>
        </h1>
        <p className="text-lg text-foreground/70 max-w-md text-balance">
          הפלטפורמה שהופכת מסמכים לקורסי-לימוד אינטראקטיביים בעברית.
        </p>
      </div>

      <div className="card max-w-md w-full space-y-4">
        <h2 className="text-xl font-bold">בדיקת RTL ועברית 🎯</h2>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <span className="text-success">✓</span>
            <span>Next.js 15 + App Router</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-success">✓</span>
            <span>פונט Heebo עברית-נטיב</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-success">✓</span>
            <span>
              <code className="bg-primary-50 text-primary-700 px-1 rounded">dir=&quot;rtl&quot;</code>{' '}
              מוגדר
            </span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-success">✓</span>
            <span>tailwindcss-rtl plugin פעיל</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-success">✓</span>
            <span>Design tokens חולצו מ-StudiesGo</span>
          </li>
        </ul>
      </div>

      <footer className="text-xs text-foreground/50 text-center">
        <p>
          הצעד הבא: Phase 1 - Auth & Profile (Supabase + Google OAuth + Magic Link).
        </p>
        <p className="mt-1">
          ראה{' '}
          <code className="bg-card px-1 rounded">docs/build-roadmap.md</code>{' '}
          לפרטים.
        </p>
      </footer>
    </main>
  );
}
