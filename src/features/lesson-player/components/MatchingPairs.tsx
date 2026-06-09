'use client';

/**
 * <MatchingPairs> — שאלת-התאמה: מונח ↔ הגדרה (StudiesGo-style).
 *
 * UX: הלומד **מזווג בחופשיות** — בוחר מונח ואז את הגדרתו (או להפך) → הם מתחברים
 * (מספר-קישור משותף), בלי בדיקת-נכונות מיידית. הבדיקה רק ב"בדוק תשובה": כל זיווג
 * נצבע ✓ ירוק / ✗ אדום, והזיווגים-הנכונים מוצגים. ניתן לשנות זיווג עד הבדיקה.
 *
 * חוזה-נתונים: `pairs[i] = {left: מונח, right: הגדרה}` — ההתאמה-הנכונה היא left[i]↔right[i].
 * RTL-first · design-tokens · a11y (כותרות-עמודה · aria-pressed · מקלדת).
 */
import { useMemo, useReducer } from 'react';

export type MatchingPair = { left: string; right: string };

export type MatchingPairsProps = {
  pairs: MatchingPair[];
  onComplete: (correct: boolean) => void;
  onDeepExplanation?: () => void;
};

type Selected = { side: 'term' | 'def'; index: number } | null;

type State = {
  selected: Selected;
  /** termIndex → defIndex (זיווגי-הלומד). */
  pairing: Record<number, number>;
  phase: 'idle' | 'checked';
};

type Action =
  | { type: 'PICK_TERM'; index: number }
  | { type: 'PICK_DEF'; index: number }
  | { type: 'CHECK' };

/** משייך מונח↔הגדרה, ומסיר זיווגים-מתנגשים (re-pair). */
function assign(
  pairing: Record<number, number>,
  term: number,
  def: number,
): Record<number, number> {
  const next: Record<number, number> = {};
  for (const [t, d] of Object.entries(pairing)) {
    if (Number(t) === term || d === def) continue; // הסר זיווג-קודם של אחד הצדדים
    next[Number(t)] = d;
  }
  next[term] = def;
  return next;
}

function reducer(state: State, action: Action): State {
  if (state.phase === 'checked') return state;
  switch (action.type) {
    case 'PICK_TERM': {
      const sel = state.selected;
      if (sel?.side === 'term' && sel.index === action.index) return { ...state, selected: null };
      if (sel?.side === 'def') {
        return {
          ...state,
          selected: null,
          pairing: assign(state.pairing, action.index, sel.index),
        };
      }
      return { ...state, selected: { side: 'term', index: action.index } };
    }
    case 'PICK_DEF': {
      const sel = state.selected;
      if (sel?.side === 'def' && sel.index === action.index) return { ...state, selected: null };
      if (sel?.side === 'term') {
        return {
          ...state,
          selected: null,
          pairing: assign(state.pairing, sel.index, action.index),
        };
      }
      return { ...state, selected: { side: 'def', index: action.index } };
    }
    case 'CHECK':
      return { ...state, selected: null, phase: 'checked' };
    default:
      return state;
  }
}

/** ערבוב-יציב (לפי-תוכן) לעמודת-ההגדרות — שהמונח לא יעמוד מול הגדרתו. */
function shuffledOrder(n: number): number[] {
  const idx = Array.from({ length: n }, (_, i) => i);
  const out: number[] = [];
  const mid = Math.ceil(n / 2);
  for (let i = 0; i < mid; i++) {
    out.push(idx[i]!);
    if (idx[i + mid] !== undefined) out.push(idx[i + mid]!);
  }
  return out;
}

export function MatchingPairs({ pairs, onComplete, onDeepExplanation }: MatchingPairsProps) {
  const total = pairs.length;
  const [state, dispatch] = useReducer(reducer, {
    selected: null,
    pairing: {},
    phase: 'idle',
  });

  const defOrder = useMemo(() => shuffledOrder(total), [total]);
  /** defIndex → termIndex (היפוך, להצגת מספר-הקישור על ההגדרה). */
  const defToTerm = useMemo(() => {
    const m: Record<number, number> = {};
    for (const [t, d] of Object.entries(state.pairing)) m[d] = Number(t);
    return m;
  }, [state.pairing]);

  const pairedCount = Object.keys(state.pairing).length;
  const allPaired = pairedCount === total;
  const checked = state.phase === 'checked';
  const allCorrect = useMemo(
    () => Object.entries(state.pairing).every(([t, d]) => Number(t) === d),
    [state.pairing],
  );

  function handleCheck() {
    if (!allPaired || checked) return;
    dispatch({ type: 'CHECK' });
    onComplete(allCorrect);
  }

  /** סגנון-כרטיס לפי מצב (בחור/מזווג/נבדק-נכון/נבדק-שגוי). */
  function cardClass(opts: { selected: boolean; paired: boolean; correct?: boolean }): string {
    const base =
      'flex min-h-[52px] w-full items-center gap-2 rounded-card border px-3 py-3 text-start text-sm font-medium leading-snug text-quiz-text-primary transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active';
    if (opts.correct === true) return `${base} border-quiz-success-border bg-quiz-success-bg`;
    if (opts.correct === false) return `${base} border-error/50 bg-error/10`;
    if (opts.selected)
      return `${base} border-quiz-primary-active bg-quiz-bg ring-2 ring-quiz-primary-active`;
    if (opts.paired) return `${base} border-accent-400 bg-accent-50`;
    return `${base} border-quiz-border bg-white hover:border-quiz-primary-active hover:bg-quiz-bg`;
  }

  /** תג-מספר-קישור (1..n) על כרטיס מזווג. */
  function LinkBadge({ n }: { n: number }) {
    return (
      <span
        aria-hidden="true"
        className="grid size-5 shrink-0 place-items-center rounded-full bg-accent-500 text-[11px] font-bold text-white"
      >
        {n}
      </span>
    );
  }

  return (
    <div dir="rtl" className="flex flex-col gap-3 font-hebrew" data-testid="matching-pairs">
      {/* ── הסבר ── */}
      <p className="rounded-card bg-quiz-explanation px-3 py-2 text-start text-sm text-quiz-text-secondary">
        התאם כל <b className="text-quiz-text-primary">מונח</b> להגדרתו: בחר מונח ואז את ההגדרה
        המתאימה (או להפך). אפשר לשנות עד הלחיצה על «בדוק תשובה».
      </p>

      {/* ── כותרות-עמודה ── */}
      <div className="grid grid-cols-2 gap-3">
        <h3 className="text-center text-xs font-extrabold text-accent-600">מונחים</h3>
        <h3 className="text-center text-xs font-extrabold text-accent-600">הגדרות</h3>
      </div>

      {/* ── כרטיסים ── */}
      <div className="grid grid-cols-2 gap-3">
        {/* מונחים (סדר-מקורי) */}
        <div className="flex flex-col gap-3" role="group" aria-label="מונחים">
          {pairs.map((pair, i) => {
            const paired = state.pairing[i] !== undefined;
            const selected = state.selected?.side === 'term' && state.selected.index === i;
            const correct = checked && paired ? state.pairing[i] === i : undefined;
            return (
              <button
                key={`term-${i}`}
                type="button"
                data-testid={`term-card-${i}`}
                aria-pressed={selected}
                disabled={checked}
                onClick={() => dispatch({ type: 'PICK_TERM', index: i })}
                className={cardClass({ selected, paired, correct })}
              >
                {paired && <LinkBadge n={i + 1} />}
                <span className="flex-1">{pair.left}</span>
              </button>
            );
          })}
        </div>

        {/* הגדרות (סדר-מעורבב) */}
        <div className="flex flex-col gap-3" role="group" aria-label="הגדרות">
          {defOrder.map((d) => {
            const pair = pairs[d];
            if (!pair) return null;
            const termForDef = defToTerm[d];
            const paired = termForDef !== undefined;
            const selected = state.selected?.side === 'def' && state.selected.index === d;
            const correct = checked && paired ? termForDef === d : undefined;
            return (
              <button
                key={`def-${d}`}
                type="button"
                data-testid={`def-card-${d}`}
                aria-pressed={selected}
                disabled={checked}
                onClick={() => dispatch({ type: 'PICK_DEF', index: d })}
                className={cardClass({ selected, paired, correct })}
              >
                {paired && <LinkBadge n={(termForDef ?? 0) + 1} />}
                <span className="flex-1">{pair.right}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── בדוק / תוצאה ── */}
      {!checked ? (
        <button
          type="button"
          data-testid="submit-button"
          aria-label="בדוק תשובה"
          disabled={!allPaired}
          onClick={handleCheck}
          className="w-full select-none rounded-pill bg-quiz-primary-active py-4 text-lg font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active disabled:opacity-40"
        >
          בדוק תשובה
        </button>
      ) : (
        <div
          className="flex flex-col gap-3"
          data-testid="matching-result"
          role="status"
          aria-live="polite"
        >
          <p className="text-center text-base font-extrabold">
            {allCorrect ? '✅ כל ההתאמות נכונות!' : '➖ חלק מההתאמות שגויות — הנה הנכונות:'}
          </p>
          {!allCorrect && (
            <ul className="flex flex-col gap-2" role="list" aria-label="התאמות נכונות">
              {pairs.map((pair, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 rounded-lg border border-quiz-success-border bg-quiz-success-bg px-3 py-2 text-sm"
                >
                  <span className="text-success" aria-hidden="true">
                    ✓
                  </span>
                  <span className="font-bold">{pair.left}</span>
                  <span className="text-quiz-text-secondary">←</span>
                  <span className="flex-1">{pair.right}</span>
                </li>
              ))}
            </ul>
          )}
          {onDeepExplanation && !allCorrect && (
            <button
              type="button"
              data-testid="deep-explanation-button"
              onClick={onDeepExplanation}
              className="text-start text-sm font-medium text-quiz-primary-active underline-offset-2 hover:underline"
            >
              הסבר לעומק
            </button>
          )}
          <button
            type="button"
            data-testid="continue-button"
            onClick={() => onComplete(allCorrect)}
            className="w-full rounded-pill bg-quiz-primary-active py-4 text-lg font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active"
          >
            המשך
          </button>
        </div>
      )}
    </div>
  );
}
