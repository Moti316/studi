'use client';

/**
 * <QuestionTagger> — keyboard-first scope-tagging queue for the creator.
 *
 * StudiBuilder is creator-gated: only Moti reviews the ~540 imported questions
 * and confirms/corrects the committee-scope tags that the import pipeline's
 * Gemini stage (`scope-tagger.ts`) proposed. This screen is that review queue —
 * it must be *fast*: one question at a time, the 57 canonical scope IDs as a
 * toggle-grid, the existing Gemini suggestion shown for one-key approval, and
 * keyboard shortcuts so the reviewer never has to reach for the mouse.
 *
 * Design mirrors <MatchingPairs>:
 *   - state-machine via useReducer (no scattered useState),
 *   - dir="rtl" + logical props (ps-/pe-/text-start),
 *   - full a11y (role / aria-* / data-testid / keyboard),
 *   - respectReducedMotion() around every variant,
 *   - StudiesGo animation variants from `@/lib/animations`.
 *
 * Data contract = schema-as-is (`drizzle/schema.ts` `questions`):
 *   scope_refs jsonb `{id,confidence}[]` · in_scope boolean · status enum.
 * Persistence is the server action `updateQuestionTags(id, patch)` — passed in
 * as a prop so the unit test can mock it and the screen stays server-agnostic.
 */

import React, { useCallback, useMemo, useReducer, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  cardTap,
  submitButtonVariants,
  submitButtonTap,
  answerListContainer,
  answerListItem,
  checkmarkPopVariants,
  spinnerEnterVariants,
  spinnerRotateAnimation,
  respectReducedMotion,
} from '@/lib/animations';
import {
  SCOPE_REFS,
  SCOPE_CATEGORIES,
  SCOPE_REF_BY_ID,
  type ScopeCategory,
} from '@/lib/db/constants/scope-refs';
import type { Question } from '../../../../drizzle/schema';
import type { ScopeStatus } from '@/lib/import/scope-tagger';
import type {
  ScopeRefEntry,
  UpdateQuestionTagsPatch,
} from '@/app/admin/questions/actions';

// ─── Types ──────────────────────────────────────────────────────────────────

/** Shape of the server action — injected so tests can mock it. */
export type UpdateQuestionTags = (
  id: string,
  patch: UpdateQuestionTagsPatch,
) => Promise<{ ok: true }>;

export type QuestionTaggerProps = {
  /** The tagging queue, server-loaded (untagged-first ordering). */
  questions: Question[];
  /** Persistence (the `updateQuestionTags` server action). */
  onSave: UpdateQuestionTags;
};

/** The three `content_status` values, in reviewer-button order. */
export const STATUS_OPTIONS: readonly ScopeStatus[] = ['מאומת', 'מוסקנא', 'לא ידוע'];

/** Confidence stamped on a scope-ref the reviewer adds by hand (max trust). */
const REVIEWER_CONFIDENCE = 1;

type SavePhase = 'idle' | 'saving' | 'saved' | 'error';

type DraftState = {
  /** index into `questions` of the row under review */
  current: number;
  /** working set of selected scope IDs for the current question */
  selectedIds: Set<string>;
  /** working in_scope flag */
  inScope: boolean;
  /** working verification status */
  status: ScopeStatus;
  /** save lifecycle for the current question */
  savePhase: SavePhase;
  /** error message when savePhase === 'error' */
  errorMessage: string | null;
};

type Action =
  | { type: 'TOGGLE_ID'; id: string }
  | { type: 'SET_IN_SCOPE'; value: boolean }
  | { type: 'SET_STATUS'; status: ScopeStatus }
  | { type: 'APPROVE_SUGGESTION'; ids: string[]; inScope: boolean; status: ScopeStatus }
  | { type: 'SAVING' }
  | { type: 'SAVED' }
  | { type: 'SAVE_ERROR'; message: string }
  | { type: 'GOTO'; index: number; draft: Omit<DraftState, 'current' | 'savePhase' | 'errorMessage'> };

// ─── Derive an editable draft from a question row ─────────────────────────────

/** scope_refs jsonb → a Set of known scope IDs (unknown IDs are ignored). */
function idsFromQuestion(q: Question): Set<string> {
  const refs = Array.isArray(q.scopeRefs) ? (q.scopeRefs as ScopeRefEntry[]) : [];
  const ids = new Set<string>();
  for (const r of refs) {
    if (r && typeof r.id === 'string' && SCOPE_REF_BY_ID.has(r.id)) ids.add(r.id);
  }
  return ids;
}

function draftFromQuestion(q: Question) {
  return {
    selectedIds: idsFromQuestion(q),
    inScope: q.inScope === true,
    status: q.status as ScopeStatus,
  };
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

function reducer(state: DraftState, action: Action): DraftState {
  switch (action.type) {
    case 'TOGGLE_ID': {
      const next = new Set(state.selectedIds);
      if (next.has(action.id)) next.delete(action.id);
      else next.add(action.id);
      // Any manual edit clears a prior saved/error flash.
      return { ...state, selectedIds: next, savePhase: 'idle', errorMessage: null };
    }
    case 'SET_IN_SCOPE':
      return { ...state, inScope: action.value, savePhase: 'idle', errorMessage: null };
    case 'SET_STATUS':
      return { ...state, status: action.status, savePhase: 'idle', errorMessage: null };
    case 'APPROVE_SUGGESTION':
      return {
        ...state,
        selectedIds: new Set(action.ids),
        inScope: action.inScope,
        status: action.status,
        savePhase: 'idle',
        errorMessage: null,
      };
    case 'SAVING':
      return { ...state, savePhase: 'saving', errorMessage: null };
    case 'SAVED':
      return { ...state, savePhase: 'saved', errorMessage: null };
    case 'SAVE_ERROR':
      return { ...state, savePhase: 'error', errorMessage: action.message };
    case 'GOTO':
      return {
        current: action.index,
        selectedIds: action.draft.selectedIds,
        inScope: action.draft.inScope,
        status: action.draft.status,
        savePhase: 'idle',
        errorMessage: null,
      };
    default:
      return state;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function QuestionTagger({ questions, onSave }: QuestionTaggerProps) {
  const total = questions.length;

  const [state, dispatch] = useReducer(reducer, undefined, (): DraftState => {
    const first = questions[0];
    return {
      current: 0,
      selectedIds: first ? idsFromQuestion(first) : new Set<string>(),
      inScope: first ? first.inScope === true : false,
      status: (first?.status as ScopeStatus) ?? 'לא ידוע',
      savePhase: 'idle',
      errorMessage: null,
    };
  });

  // Track which questions the reviewer has saved this session (for the progress
  // counter + "done" empty-state without a server round-trip on every render).
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set<string>());

  const question = questions[state.current];

  // ── Empty state: nothing to tag (DB empty until the import runs) ──
  if (total === 0) {
    return (
      <div
        dir="rtl"
        data-testid="tagger-empty"
        role="status"
        className="flex flex-col items-center gap-3 rounded-md border border-border bg-card px-6 py-12 text-center font-sans"
      >
        <span className="text-4xl" aria-hidden="true">
          📭
        </span>
        <h2 className="text-lg font-bold">אין שאלות לתיוג עדיין</h2>
        <p className="text-foreground/70 mx-auto max-w-sm text-sm">
          תור-התיוג ריק. ברגע שייבוא-התוכן ירוץ, השאלות יופיעו כאן לאישור-היקף.
        </p>
      </div>
    );
  }

  // ── Done state: all questions in the queue handled this session ──
  if (!question) {
    return (
      <div
        dir="rtl"
        data-testid="tagger-done"
        role="status"
        className="flex flex-col items-center gap-3 rounded-md border border-border bg-card px-6 py-12 text-center font-sans"
      >
        <motion.span
          className="text-4xl"
          aria-hidden="true"
          variants={respectReducedMotion(checkmarkPopVariants)}
          initial="hidden"
          animate="visible"
        >
          ✓
        </motion.span>
        <h2 className="text-lg font-bold">סיימת את התור</h2>
        <p className="text-foreground/70 mx-auto max-w-sm text-sm">
          תייגת את כל {total} השאלות בתור. רענן כדי לטעון את הקבוצה הבאה.
        </p>
      </div>
    );
  }

  return (
    <QuestionTaggerInner
      key={question.id}
      question={question}
      index={state.current}
      total={total}
      savedCount={savedIds.size}
      state={state}
      dispatch={dispatch}
      onSave={onSave}
      onSaved={(id) => {
        setSavedIds((prev) => {
          const next = new Set(prev);
          next.add(id);
          return next;
        });
      }}
      onAdvance={() => {
        const nextIndex = state.current + 1;
        const nextQ = questions[nextIndex];
        dispatch({
          type: 'GOTO',
          index: nextIndex,
          draft: nextQ
            ? draftFromQuestion(nextQ)
            : { selectedIds: new Set<string>(), inScope: false, status: 'לא ידוע' },
        });
      }}
    />
  );
}

// ─── Inner (one question) — keeps the reducer draft tied to a single row ──────

type InnerProps = {
  question: Question;
  index: number;
  total: number;
  savedCount: number;
  state: DraftState;
  dispatch: React.Dispatch<Action>;
  onSave: UpdateQuestionTags;
  onSaved: (id: string) => void;
  onAdvance: () => void;
};

function QuestionTaggerInner({
  question,
  index,
  total,
  savedCount,
  state,
  dispatch,
  onSave,
  onSaved,
  onAdvance,
}: InnerProps) {
  const isSaving = state.savePhase === 'saving';

  // The Gemini suggestion = what the import pipeline already wrote on the row.
  const suggestion = useMemo(() => {
    const refs = Array.isArray(question.scopeRefs)
      ? (question.scopeRefs as ScopeRefEntry[]).filter(
          (r) => r && typeof r.id === 'string' && SCOPE_REF_BY_ID.has(r.id),
        )
      : [];
    return {
      ids: refs.map((r) => r.id),
      refs,
      inScope: question.inScope === true,
      status: question.status as ScopeStatus,
      hasSuggestion: refs.length > 0,
    };
  }, [question]);

  // ── Persist the current draft, then advance to the next question ──
  const handleSaveAndNext = useCallback(async () => {
    if (isSaving) return;
    dispatch({ type: 'SAVING' });
    const scope_refs: ScopeRefEntry[] = Array.from(state.selectedIds).map((id) => ({
      id,
      confidence: REVIEWER_CONFIDENCE,
    }));
    const patch: UpdateQuestionTagsPatch = {
      scope_refs,
      in_scope: state.inScope,
      status: state.status,
    };
    try {
      await onSave(question.id, patch);
      dispatch({ type: 'SAVED' });
      onSaved(question.id);
      onAdvance();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'השמירה נכשלה. נסה שוב.';
      dispatch({ type: 'SAVE_ERROR', message });
    }
  }, [isSaving, state.selectedIds, state.inScope, state.status, onSave, question.id, onSaved, onAdvance, dispatch]);

  const handleApprove = useCallback(() => {
    dispatch({
      type: 'APPROVE_SUGGESTION',
      ids: suggestion.ids,
      inScope: suggestion.inScope,
      status: suggestion.status,
    });
  }, [dispatch, suggestion.ids, suggestion.inScope, suggestion.status]);

  // ── Keyboard shortcuts (keyboard-first review of ~540 rows) ──
  //   Enter / S → save + next · A → approve suggestion · 1/2/3 → status
  const handleRootKeyDown = (e: React.KeyboardEvent) => {
    // Ignore when typing inside an input/textarea (none today, future-proof).
    const target = e.target as HTMLElement;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

    if (e.key === 'Enter' || e.key === 's' || e.key === 'S') {
      e.preventDefault();
      void handleSaveAndNext();
      return;
    }
    if ((e.key === 'a' || e.key === 'A') && suggestion.hasSuggestion) {
      e.preventDefault();
      handleApprove();
      return;
    }
    if (e.key === '1') {
      e.preventDefault();
      dispatch({ type: 'SET_STATUS', status: STATUS_OPTIONS[0]! });
      return;
    }
    if (e.key === '2') {
      e.preventDefault();
      dispatch({ type: 'SET_STATUS', status: STATUS_OPTIONS[1]! });
      return;
    }
    if (e.key === '3') {
      e.preventDefault();
      dispatch({ type: 'SET_STATUS', status: STATUS_OPTIONS[2]! });
    }
  };

  // ── Reduced-motion-safe variants ──
  const safeSubmit = respectReducedMotion(submitButtonVariants);
  const safeListContainer = respectReducedMotion(answerListContainer);
  const safeListItem = respectReducedMotion(answerListItem);
  const safeSpinner = respectReducedMotion(spinnerEnterVariants);

  // Group the 57 scope IDs by category for a scannable grid.
  const byCategory = useMemo(() => groupScopeByCategory(), []);

  const progressLabel = `שאלה ${index + 1} מתוך ${total} · ${savedCount} נשמרו`;

  return (
    <div
      dir="rtl"
      role="form"
      aria-label="תיוג-היקף לשאלה"
      data-testid="question-tagger"
      tabIndex={-1}
      onKeyDown={handleRootKeyDown}
      className="flex flex-col gap-5 font-sans focus:outline-none"
    >
      {/* ── Progress header ── */}
      <header className="flex items-center justify-between gap-3">
        <p data-testid="tagger-progress" className="text-foreground/70 text-sm font-medium">
          {progressLabel}
        </p>
        <span className="text-foreground/50 hidden text-xs sm:inline" aria-hidden="true">
          קיצורים: Enter שמירה · A אישור · 1/2/3 סטטוס
        </span>
      </header>

      {/* ── Question prompt ── */}
      <section
        aria-labelledby="tagger-question-heading"
        className="rounded-md border border-border bg-card p-4"
      >
        <h2 id="tagger-question-heading" className="sr-only">
          נוסח השאלה
        </h2>
        <p className="text-foreground/50 mb-1 text-xs">סוג: {question.type}</p>
        <p data-testid="tagger-prompt" className="text-base font-medium leading-relaxed">
          {question.prompt}
        </p>
      </section>

      {/* ── Gemini suggestion (existing scope_refs / status) ── */}
      <section
        aria-labelledby="tagger-suggestion-heading"
        data-testid="tagger-suggestion"
        className="rounded-md border border-primary-500/40 bg-primary-50/60 p-4"
      >
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 id="tagger-suggestion-heading" className="text-sm font-bold">
            הצעת-Gemini
          </h3>
          <span className="text-foreground/60 text-xs">
            סטטוס: {suggestion.status} · {suggestion.inScope ? 'בהיקף' : 'מחוץ-להיקף'}
          </span>
        </div>

        {suggestion.hasSuggestion ? (
          <motion.ul
            variants={safeListContainer}
            initial="hidden"
            animate="visible"
            role="list"
            aria-label="מזהי-היקף שהוצעו"
            className="flex flex-wrap gap-2"
          >
            {suggestion.refs.map((r) => {
              const ref = SCOPE_REF_BY_ID.get(r.id);
              return (
                <motion.li
                  key={r.id}
                  variants={safeListItem}
                  data-testid={`suggestion-ref-${r.id}`}
                  className="text-primary-700 inline-flex items-center gap-1 rounded-pill bg-card px-2.5 py-1 text-xs font-medium"
                >
                  <span className="font-mono">{r.id}</span>
                  <span className="text-foreground/70">{ref?.label ?? ''}</span>
                  <span className="text-foreground/50">
                    ({Math.round((r.confidence ?? 0) * 100)}%)
                  </span>
                </motion.li>
              );
            })}
          </motion.ul>
        ) : (
          <p data-testid="tagger-no-suggestion" className="text-foreground/60 text-sm">
            אין הצעה אוטומטית — תייג ידנית מהבורר למטה.
          </p>
        )}

        {suggestion.hasSuggestion && (
          <motion.button
            type="button"
            data-testid="approve-suggestion-button"
            onClick={handleApprove}
            aria-label="אשר את הצעת-Gemini (A)"
            disabled={isSaving}
            className="border-primary-500 text-primary-700 mt-3 inline-flex items-center gap-1.5 rounded-md border bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-primary-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:pointer-events-none disabled:opacity-50"
            {...cardTap}
          >
            אשר הצעה
          </motion.button>
        )}
      </section>

      {/* ── In-scope + status controls ── */}
      <section aria-label="החלטת-היקף" className="flex flex-wrap items-center gap-4">
        {/* in_scope toggle (radio-pair) */}
        <div
          role="radiogroup"
          aria-label="בהיקף-הוועדה"
          data-testid="in-scope-group"
          className="inline-flex overflow-hidden rounded-md border border-border"
        >
          <button
            type="button"
            role="radio"
            aria-checked={state.inScope === true}
            data-testid="in-scope-yes"
            onClick={() => dispatch({ type: 'SET_IN_SCOPE', value: true })}
            disabled={isSaving}
            className={cn(
              'px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
              state.inScope
                ? 'bg-primary-500 text-white'
                : 'bg-card text-foreground hover:bg-background',
            )}
          >
            בהיקף
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={state.inScope === false}
            data-testid="in-scope-no"
            onClick={() => dispatch({ type: 'SET_IN_SCOPE', value: false })}
            disabled={isSaving}
            className={cn(
              'border-border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
              'border-s',
              !state.inScope
                ? 'bg-error text-white'
                : 'bg-card text-foreground hover:bg-background',
            )}
          >
            מחוץ-להיקף
          </button>
        </div>

        {/* status (3 values; keys 1/2/3) */}
        <div
          role="radiogroup"
          aria-label="סטטוס-אימות"
          data-testid="status-group"
          className="inline-flex flex-wrap gap-2"
        >
          {STATUS_OPTIONS.map((s, i) => {
            const active = state.status === s;
            return (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={active}
                data-testid={`status-${s}`}
                onClick={() => dispatch({ type: 'SET_STATUS', status: s })}
                disabled={isSaving}
                className={cn(
                  'rounded-md border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
                  active
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-border bg-card text-foreground hover:border-primary-500/50',
                )}
              >
                <span className="text-foreground/40 me-1 font-mono text-xs">{i + 1}</span>
                {s}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── 57-ID scope selector, grouped by category ── */}
      <section aria-labelledby="tagger-picker-heading" className="space-y-4">
        <h3 id="tagger-picker-heading" className="text-sm font-bold">
          בורר מזהי-היקף ({SCOPE_REFS.length})
        </h3>
        <div role="group" aria-label="בחירת מזהי-היקף" className="space-y-4">
          {SCOPE_CATEGORIES.map((category) => (
            <fieldset key={category} className="space-y-2">
              <legend className="text-foreground/60 mb-1 text-xs font-semibold">{category}</legend>
              <div className="flex flex-wrap gap-2">
                {byCategory[category].map((ref) => {
                  const selected = state.selectedIds.has(ref.id);
                  return (
                    <motion.button
                      key={ref.id}
                      type="button"
                      role="checkbox"
                      aria-checked={selected}
                      aria-label={`${ref.id} — ${ref.label}`}
                      data-testid={`scope-toggle-${ref.id}`}
                      onClick={() => dispatch({ type: 'TOGGLE_ID', id: ref.id })}
                      disabled={isSaving}
                      className={cn(
                        'inline-flex max-w-full items-center gap-1.5 rounded-pill border px-3 py-1.5 text-start text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:opacity-50',
                        selected
                          ? 'border-primary-500 bg-primary-500 text-white'
                          : 'border-border bg-card text-foreground hover:border-primary-500/50',
                      )}
                      {...cardTap}
                    >
                      <span className="font-mono opacity-80">{ref.id}</span>
                      <span className="truncate">{ref.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
        <p data-testid="selected-count" className="text-foreground/60 text-xs">
          נבחרו {state.selectedIds.size} מזהים
        </p>
      </section>

      {/* ── Save error ── */}
      <AnimatePresence>
        {state.savePhase === 'error' && (
          <motion.p
            key="save-error"
            role="alert"
            data-testid="save-error"
            className="bg-error/10 text-error rounded-md px-3 py-2 text-sm"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {state.errorMessage}
          </motion.p>
        )}
      </AnimatePresence>

      {/* ── Save + next ── */}
      <motion.button
        type="button"
        data-testid="save-next-button"
        aria-label="שמור והמשך (Enter)"
        aria-busy={isSaving}
        onClick={() => void handleSaveAndNext()}
        disabled={isSaving}
        className="rounded-pill bg-primary-500 py-3.5 font-sans text-lg font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:pointer-events-none"
        variants={safeSubmit}
        initial="enabled"
        animate="enabled"
        {...submitButtonTap}
      >
        {isSaving ? (
          <span className="inline-flex items-center justify-center gap-2">
            <motion.span
              aria-hidden="true"
              className="inline-block h-4 w-4 rounded-full border-2 border-white/40 border-t-white"
              variants={safeSpinner}
              initial="hidden"
              animate={spinnerRotateAnimation}
            />
            שומר…
          </span>
        ) : (
          'שמור והמשך'
        )}
      </motion.button>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type ScopeRefItem = (typeof SCOPE_REFS)[number];

/** Pre-bucket the 57 scope refs by their category (stable, computed once). */
function groupScopeByCategory(): Record<ScopeCategory, ScopeRefItem[]> {
  const out = {} as Record<ScopeCategory, ScopeRefItem[]>;
  for (const c of SCOPE_CATEGORIES) out[c] = [];
  for (const ref of SCOPE_REFS) out[ref.category].push(ref);
  return out;
}
