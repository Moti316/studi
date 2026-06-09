'use client';

/**
 * <LegislationLibrary> — ספריית-החקיקה של קורס ממונה-הבטיחות (StudiesGo-style).
 *
 * 42 נוסחי-החקיקה מסודרים כ-4 **מדפים-מתקפלים** (משפחות-חוק · חוק > תקנותיו): כל מדף
 * = כרטיס עם אייקון-תחום, כותרת ומונה, נפתח בלחיצה (accordion) במקום רשימה-שטוחה-ארוכה.
 * חיפוש-מהיר client-side פותח אוטומטית את המדפים-התואמים. כל נוסח: נבו (טקסט-מלא ציבורי)
 * + PDF-מחייב (Drive · creator-gated). הנתונים נגזרים מ-`catalog.ts`.
 *
 * RTL-first · design-tokens · a11y (חיפוש-מתויג · aria-expanded למדף · קישורים-חיצוניים
 * עם rel="noopener"). ההיררכיה מודגשת ע"י הזחה לפי-עומק-ה-scope (x.y.z עמוק מ-x.y).
 */
import { useMemo, useState } from 'react';
import {
  Search,
  ExternalLink,
  FileText,
  ChevronDown,
  ClipboardList,
  ShieldCheck,
  FlaskConical,
  Scale,
  type LucideIcon,
} from 'lucide-react';
import type { LegislationChapter, LegislationItem } from '@/lib/legislation/catalog';
import { DEPTH_LABELS } from '@/lib/legislation/catalog';

export interface LegislationLibraryProps {
  chapters: readonly LegislationChapter[];
  total: number;
}

/** אייקון-תחום פר-מדף (משפחת-חוק). */
const CHAPTER_ICONS: Record<string, LucideIcon> = {
  '1-irgun-hapikuach': ClipboardList,
  '2-pkudat-habetihut': ShieldCheck,
  '3-gehut': FlaskConical,
  '4-hukei-ezer': Scale,
};

/** סגנון-תג לפי עומק-בתכנית (טוקני-מותג בלבד). */
const DEPTH_BADGE: Record<keyof typeof DEPTH_LABELS, string> = {
  core: 'bg-primary-100 text-primary-700',
  framework: 'bg-accent-100 text-accent-700',
  topic: 'text-foreground/70 bg-border',
};

/** רמת-הזחה לפי מספר-מקטעי-ה-scope (x.y=0 · x.y.z=1 · …). */
function indentLevel(displayId: string): number {
  return Math.max(0, displayId.split('.').length - 2);
}

function normalize(s: string): string {
  return s
    .replace(/[״”“"׳’‘'-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function itemMatches(item: LegislationItem, q: string): boolean {
  if (!q) return true;
  const nq = normalize(q);
  return (
    normalize(item.title).includes(nq) ||
    item.displayId.toLowerCase().includes(nq) ||
    String(item.year).includes(nq)
  );
}

export function LegislationLibrary({ chapters, total }: LegislationLibraryProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const searching = query.trim().length > 0;

  const filtered = useMemo(
    () =>
      chapters
        .map((c) => ({ ...c, items: c.items.filter((it) => itemMatches(it, query)) }))
        .filter((c) => c.items.length > 0),
    [chapters, query],
  );

  const shownCount = filtered.reduce((sum, c) => sum + c.items.length, 0);
  // בחיפוש — כל המדפים-התואמים פתוחים; אחרת לפי-מצב-המשתמש.
  const isOpen = (dir: string): boolean => searching || open[dir] === true;
  const toggle = (dir: string): void => setOpen((o) => ({ ...o, [dir]: !o[dir] }));

  return (
    <div dir="rtl" className="flex flex-col gap-4 font-hebrew">
      {/* ── חיפוש ── */}
      <div className="relative">
        <Search
          aria-hidden="true"
          className="text-foreground/40 pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2"
        />
        <input
          type="search"
          inputMode="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="חיפוש חוק או תקנה"
          placeholder="חיפוש לפי שם-החוק או מספר-סעיף (למשל: עבודה בגובה · 2.1)…"
          className="w-full rounded-card border border-border bg-card py-3 pe-10 ps-4 text-start text-sm leading-relaxed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
        />
      </div>

      <p className="text-foreground/60 text-xs" aria-live="polite">
        {searching
          ? `${shownCount} תוצאות מתוך ${total} נוסחים`
          : `${total} נוסחים · ${chapters.length} מדפים (חוק › תקנותיו) — לחץ מדף לפתיחה`}
      </p>

      {/* ── מדפים ── */}
      {filtered.length === 0 ? (
        <div className="text-foreground/60 rounded-card border border-dashed border-border p-8 text-center text-sm">
          לא נמצאו נוסחים התואמים ל-״{query}״. נסה מילת-מפתח אחרת או מספר-scope.
        </div>
      ) : (
        <ul className="flex flex-col gap-3" role="list">
          {filtered.map((chapter) => {
            const Icon = CHAPTER_ICONS[chapter.dir] ?? ClipboardList;
            const expanded = isOpen(chapter.dir);
            return (
              <li key={chapter.dir}>
                <section
                  aria-label={chapter.title}
                  className="overflow-hidden rounded-card border border-border bg-card"
                >
                  <button
                    type="button"
                    onClick={() => toggle(chapter.dir)}
                    aria-expanded={expanded}
                    data-testid={`chapter-${chapter.num}`}
                    className="flex w-full items-center gap-3 p-3 text-start transition-colors hover:bg-primary-50/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
                  >
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary-100 text-primary-700">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-xs font-bold text-accent-600">מדף {chapter.num}</span>
                      <span className="text-sm font-extrabold leading-snug">{chapter.title}</span>
                    </span>
                    <span className="text-foreground/55 shrink-0 rounded-full bg-border px-2 py-0.5 text-xs font-bold">
                      {chapter.items.length}
                    </span>
                    <ChevronDown
                      aria-hidden="true"
                      className={`text-foreground/40 size-5 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {expanded && (
                    <ul className="flex flex-col border-t border-border px-3" role="list">
                      {chapter.items.map((item) => (
                        <LegislationRow key={item.displayId} item={item} />
                      ))}
                    </ul>
                  )}
                </section>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** שורת-נוסח בודד. */
function LegislationRow({ item }: { item: LegislationItem }) {
  const level = indentLevel(item.displayId);
  return (
    <li
      data-testid={`legislation-item-${item.displayId}`}
      className="flex flex-col gap-1.5 border-b border-border/60 py-3 last:border-b-0"
      style={{ paddingInlineStart: `${level * 1.25}rem` }}
    >
      <div className="flex items-start gap-2">
        <span className="text-foreground/70 mt-0.5 shrink-0 rounded-md border border-border bg-card px-1.5 py-0.5 font-mono text-xs">
          {item.displayId}
        </span>
        <span className="flex-1 text-sm font-bold leading-snug">{item.title}</span>
        <span
          className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${DEPTH_BADGE[item.depth]}`}
        >
          {DEPTH_LABELS[item.depth]}
        </span>
      </div>
      <div className="text-foreground/60 flex items-center gap-3 ps-1 text-xs">
        <a
          href={item.nevoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-primary-600 hover:text-primary-700"
        >
          <ExternalLink aria-hidden="true" className="size-3.5" />
          נוסח מלא (נבו)
        </a>
        <a
          href={item.pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground inline-flex items-center gap-1"
        >
          <FileText aria-hidden="true" className="size-3.5" />
          PDF מחייב
        </a>
      </div>
    </li>
  );
}
