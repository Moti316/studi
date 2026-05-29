'use client';

import { Play, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VoiceId } from '@/lib/mock/user';

interface VoiceInfo {
  id: VoiceId;
  name: string;
  gender: 'גברי' | 'נשי';
  tone: string;
}

const VOICES: VoiceInfo[] = [
  { id: 'yoav', name: 'יואב', gender: 'גברי', tone: 'חם' },
  { id: 'tali', name: 'טלי', gender: 'נשי', tone: 'בהיר' },
  { id: 'michal', name: 'מיכל', gender: 'נשי', tone: 'חם' },
  { id: 'ori', name: 'אורי', gender: 'גברי', tone: 'צעיר' },
];

interface Props {
  value: VoiceId;
  onChange: (next: VoiceId) => void;
  /** Phase 7 יחבר ל-ElevenLabs. בינתיים — לא-פעיל. */
  onPreview?: (id: VoiceId) => void;
}

/**
 * רשת 2x2 של 4 קולות-הקראה. בחירה + כפתור-דוגמה.
 * Preview ממומש כ-Phase 7 (TTS); כאן רק קולסטרקציה.
 */
export function VoiceGrid({ value, onChange, onPreview }: Props) {
  return (
    <div role="radiogroup" aria-label="קול-הקראה" className="grid grid-cols-2 gap-2">
      {VOICES.map((v) => {
        const active = v.id === value;
        return (
          <div
            key={v.id}
            className={cn(
              'flex flex-col gap-2 rounded-md border p-3 transition-colors',
              active ? 'border-primary-500 bg-primary-50' : 'border-border bg-card',
            )}
          >
            <button
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(v.id)}
              className={cn(
                'flex flex-1 flex-col items-start gap-0.5 text-start',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
              )}
            >
              <span className="flex w-full items-center justify-between font-bold">
                {v.name}
                {active && <Check className="size-4 text-primary-600" aria-label="נבחר" />}
              </span>
              <span className="text-foreground/60 text-xs">
                {v.gender} · {v.tone}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onPreview?.(v.id)}
              disabled={!onPreview}
              className={cn(
                'flex items-center justify-center gap-1 rounded-sm border border-border px-2 py-1 text-xs transition-colors',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
                onPreview ? 'hover:bg-background' : 'cursor-not-allowed opacity-60',
              )}
              aria-label={`האזן לדוגמה של ${v.name}`}
            >
              <Play className="size-3" aria-hidden="true" />
              <span>דוגמה</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
