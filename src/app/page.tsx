export default function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 p-8">
      <div className="space-y-4 text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-accent-500">
          Phase 0 · Foundation
        </p>
        <h1 className="text-5xl font-bold tracking-tight">
          Studi<span className="text-primary-500">Builder</span>
        </h1>
        <p className="text-foreground/70 max-w-md text-balance text-lg">
          הפלטפורמה שהופכת מסמכים לקורסי-לימוד אינטראקטיביים בעברית.
        </p>
      </div>

      <div className="card w-full max-w-md space-y-4">
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
              <code className="rounded bg-primary-50 px-1 text-primary-700">
                dir=&quot;rtl&quot;
              </code>{' '}
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

      <footer className="text-foreground/50 text-center text-xs">
        <p>הצעד הבא: Phase 1 - Auth & Profile (Supabase + Google OAuth + Magic Link).</p>
        <p className="mt-1">
          ראה <code className="rounded bg-card px-1">docs/build-roadmap.md</code> לפרטים.
        </p>
      </footer>
    </main>
  );
}
