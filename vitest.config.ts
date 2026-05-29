import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/unit/setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/',
        '.next/',
        'tests/',
        '**/*.config.{ts,js,mjs}',
        '**/types.ts',
        '**/*.d.ts',
        // wrappers דקים סביב @supabase/ssr ו-Next runtime — אין לוגיקה ביחידה;
        // נכוסים דרך integration/e2e ב-phase הבא.
        'src/lib/supabase/client.ts',
        'src/lib/supabase/server.ts',
        'src/lib/supabase/admin.ts',
        'src/lib/supabase/middleware.ts',
        'src/app/**/route.ts',
        'src/app/**/page.tsx',
        'src/app/**/layout.tsx',
        'src/middleware.ts',
        // קומפוננטות-תצוגה ללא לוגיקה (passthroughs).
        'src/components/auth/SignOutButton.tsx',
        'src/components/auth/AuthModal.tsx',
        'src/components/auth/AuthLayout.tsx',
        'src/components/ui/**',
      ],
      thresholds: {
        // raised gradually phase-by-phase
        lines: 60,
        functions: 60,
        statements: 60,
        branches: 50,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
