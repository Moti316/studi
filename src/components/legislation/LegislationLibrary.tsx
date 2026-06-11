'use client';

/**
 * <LegislationLibrary> — ספריית-החקיקה של קורס ממונה-הבטיחות (B1 bold).
 *
 * **שתי תצוגות** (הכרעת-מוטי 2026-06-11 · ברירת-מחדל: מפת-נושאים):
 *   📚 לפי נושא — 42 הנוסחים מקובצים לפי 8 יחידות-הלימוד (חקיקה↔למידה); כל מדף
 *      כולל כפתור "תרגל יחידה זו ←" אל `/lesson/<topic-id>`.
 *   ⚖️ לפי חוק — התצוגה-המשפטית (4 משפחות-חוק · חוק › תקנותיו) נשמרת כתצוגה-שנייה.
 *
 * חיפוש-מהיר client-side פועל על שתי-התצוגות ופותח אוטומטית את המדפים-התואמים.
 * כל נוסח: נבו (טקסט-מלא ציבורי) + PDF-מחייב (Drive · creator-gated). נתונים מ-`catalog.ts`.
 *
 * RTL-first · design-tokens · a11y (חיפוש-מתויג · aria-expanded · aria-pressed ל-toggle).
 */
import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  ExternalLink,
  FileText,
  ChevronDown,
  ChevronLeft,
  ClipboardList,
  ClipboardCheck,
  Siren,
  ShieldCheck,
  HardHat,
  Zap,
  Cog,
  FlaskConical,
  Scale,
  BookMarked,
  type LucideIcon,
} from 'lucide-react';
import type {
  LegislationChapter,
  LegislationItem,
  LegislationTopicShelf,
} from '@/lib/legislation/catalog';
import { DEPTH_LABELS } from '@/lib/legislation/catalog';

export interface LegislationLibraryProps {
  chapters: readonly LegislationChapter[];
  /** מדפי-הנושאים (LEGISLATION_BY_TOPIC) — תצוגת-ברירת-המחדל. */
  topicShelves: readonly LegislationTopicShelf[];
  total: number;
}

/** אייקונים — משפחות-חוק (לפי dir) + יחידות-קורס (לפי icon-name מ-topics.ts). */
const ICONS: Record<string, LucideIcon> = {
  // משפחות-חוק
  '1-irgun-hapikuach': ClipboardList,
  '2-pkudat-habetihut': ShieldCheck,
  '3-gehut': FlaskConical,
  '4-hukei-ezer': Scale,
  // יחידות-קורס (icon-names)
  ClipboardCheck,
  Siren,
  ShieldCheck,
  HardHat,
  Zap,
  Cog,
  FlaskConical,
  Scale,
  BookMarked,
};

/** סגנון-תג לפי עומק-בתכנית (טוקני-מותג בלבד). */
const DEPTH_BADGE: Record<keyof typeof DEPTH_LABELS, string> = {
  core: 'bg-primary-100 text-primary-700',
  framework: 'bg-accent-100 text-accent-700',
  topic: 'text-foreground/70 bg-border',
};

type ViewMode = 'topic' | 'legal';

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

/** מדף-גנרי (משמש את שתי-התצוגות). */
interface Shelf {
  key: string;
  /** תג-עליון קטן ("יחידה 3" / "מדף 2"). */
  kicker: string;
  title: string;
  blurb?: string;
  icon: LucideIcon;
  practiceHref?: string;
  testId: string;
  items: readonly LegislationItem[];
}

export function LegislationLibrary({ chapters, topicShelves, total }: LegislationLibraryProps) {
  const [view, setView] = useState<ViewMode>('topic');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const searching = query.trim().length > 0;

  // בניית-המדפים לפי-התצוגה (לפני-סינון).
  const shelves: Shelf[] = useMemo(() => {
    if (view === 'topic') {
      return topicShelves.map((s, i) => ({
        key: `t-${s.id}`,
        kicker: s.id === 'extra' ? 'נספח' : `יחידה ${i + 1}`,
        title: s.title,
        blurb: s.blurb,
        icon: ICONS[s.icon] ?? BookMarked,
        practiceHref: s.practiceHref,
        testId: `topic-shelf-${s.id}`,
        items: s.items,
      }));
    }
    return chapters.map((c) => ({
      key: `c-${c.dir}`,
      kicker: `מדף ${c.num}`,
      title: c.title,
      icon: ICONS[c.dir] ?? ClipboardList,
      testId: `chapter-${c.num}`,
      items: c.items,
    }));
  }, [view, topicShelves, chapters]);

  const filtered = useMemo(
    () =>
      shelves
        .map((s) => ({ ...s, items: s.items.filter((it) => itemMatches(it, query)) }))
        .filter((s) => s.items.length > 0),
    [shelves, query],
  );

  const shownCount = filtered.reduce((sum, s) => sum + s.items.length, 0);
  // בחיפוש — כל המדפים-התואמים פתוחים; אחרת לפי-מצב-המשתמש.
  const isOpen = (key: string): boolean => searching || open[key] === true;
  const toggle = (key: string): void => setOpen((o) => ({ ...o, [key]: !o[key] }));

  return (
    <div dir="rtl" className="flex flex-col gap-4 font-hebrew">
      {/* ── בורר-תצוגה (segmented) ── */}
      <div
        role="group"
        aria-label="אופן-הצגת החקיקה"
        data-testid="legislation-view-toggle"
        className="flex w-fit items-center gap-1 rounded-pill border border-border bg-card p-1 shadow-card"
      >
        {(
          [
            { mode: 'topic' as const, label: '📚 לפי נושא-לימוד' },
            { mode: 'legal' as const, label: '⚖️ לפי חוק' },
          ] as const
        ).map(({ mode, label }) => {
          const active = view === mode;
          return (
            <button
              key={mode}
              type="button"
              aria-pressed={active}
              data-testid={`view-${mode}`}
              onClick={() => setView(mode)}
              className={`select-none rounded-pill px-4 py-1.5 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 ${
                active
                  ? 'bg-gradient-to-bl from-primary-500 to-primary-600 text-white shadow-button'
                  : 'text-quiz-text-secondary hover:text-quiz-text-primary'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

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
          : view === 'topic'
            ? `${total} נוסחים מאורגנים לפי ${filtered.length} יחידות-לימוד — לחץ יחידה לפתיחה`
            : `${total} נוסחים · ${filtered.length} מדפים (חוק › תקנותיו) — לחץ מדף לפתיחה`}
      </p>

      {/* ── מדפים ── */}
      {filtered.length === 0 ? (
        <div className="text-foreground/60 rounded-card border border-dashed border-border p-8 text-center text-sm">
          לא נמצאו נוסחים התואמים ל-״{query}״. נסה מילת-מפתח אחרת או מספר-scope.
        </div>
      ) : (
        <ul className="flex flex-col gap-3" role="list">
          {filtered.map((shelf) => {
            const Icon = shelf.icon;
            const expanded = isOpen(shelf.key);
            return (
              <li key={shelf.key}>
                <section
                  aria-label={shelf.title}
                  className="overflow-hidden rounded-card border border-border bg-card shadow-card transition-shadow hover:shadow-card-hover"
                >
                  <button
                    type="button"
                    onClick={() => toggle(shelf.key)}
                    aria-expanded={expanded}
                    data-testid={shelf.testId}
                    className="flex w-full items-center gap-3 p-3 text-start transition-colors hover:bg-primary-50/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
                  >
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-bl from-primary-500 to-primary-600 text-white shadow-button">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-xs font-bold text-accent-600">{shelf.kicker}</span>
                      <span className="text-sm font-extrabold leading-snug text-quiz-text-primary">
                        {shelf.title}
                      </span>
                      {shelf.blurb && (
                        <span className="truncate text-xs text-quiz-text-secondary">
                          {shelf.blurb}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 rounded-pill bg-primary-50 px-2.5 py-0.5 text-xs font-bold text-primary-700 ring-1 ring-inset ring-primary-100">
                      {shelf.items.length}
                    </span>
                    <ChevronDown
                      aria-hidden="true"
                      className={`text-foreground/40 size-5 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {expanded && (
                    <div className="border-t border-border">
                      {/* תרגל-יחידה (תצוגת-נושא בלבד) */}
                      {shelf.practiceHref && (
                        <Link
                          href={shelf.practiceHref}
                          data-testid={`practice-${shelf.key}`}
                          className="group mx-3 mt-3 flex items-center justify-between gap-2 rounded-card bg-gradient-to-bl from-primary-500 to-primary-600 px-4 py-2.5 text-sm font-bold text-white shadow-button transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
                        >
                          <span>תרגל יחידה זו</span>
                          <ChevronLeft
                            aria-hidden="true"
                            className="size-4 transition-transform group-hover:-translate-x-0.5"
                          />
                        </Link>
                      )}
                      <ul className="flex flex-col px-3" role="list">
                        {shelf.items.map((item) => (
                          <LegislationRow key={`${shelf.key}-${item.displayId}`} item={item} />
                        ))}
                      </ul>
                    </div>
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
        {item.pdfUrl ? (
          <a
            href={item.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground inline-flex items-center gap-1"
          >
            <FileText aria-hidden="true" className="size-3.5" />
            PDF מחייב
          </a>
        ) : (
          <span className="inline-flex items-center gap-1 opacity-60">
            <FileText aria-hidden="true" className="size-3.5" />
            PDF בהעלאה
          </span>
        )}
      </div>
    </li>
  );
}
