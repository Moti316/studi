import { describe, it, expect } from 'vitest';
import {
  describeAnswer,
  buildVerificationGroups,
  parseExcludeRefs,
  filterExcluded,
  type BuiltMatch,
} from '@/lib/import/question-verification-io';
import type { StatuteSource } from '@/lib/import/generated-mcq';
import type { NewQuestion } from '../../../drizzle/schema';

const ST_10: StatuteSource = {
  scopeId: '1.0',
  title: 'חוק ארגון הפיקוח',
  depth: 'core',
  body: 'גוף 1.0',
  path: 'leg/1.0.md',
};
const ST_23: StatuteSource = {
  scopeId: '2.3',
  title: 'תקנות ציוד מגן אישי',
  depth: 'framework',
  body: 'גוף 2.3',
  path: 'leg/2.3.md',
};
function match(row: NewQuestion, statute: StatuteSource): BuiltMatch {
  return { row, statute };
}

function mcqRow(over: Partial<NewQuestion> = {}): NewQuestion {
  return {
    type: 'mcq_short',
    prompt: 'מהי הסמכות?',
    options: ['לחקור', 'לאסור', 'לקנוס', 'לפטר'],
    correctAnswer: { index: 0 },
    explanation: 'נימוק\n\nמקור: חוק ארגון הפיקוח · סעיף 3(4)',
    scopeRefs: [{ id: '1.0', confidence: 1 }],
    inScope: true,
    status: 'מוסקנא',
    difficulty: 1,
    sourceRef: 'nbq:1.0:mcq:aaa',
    ...over,
  } as NewQuestion;
}

describe('describeAnswer', () => {
  it('mcq → טקסט-המסיח-הנכון לפי index', () => {
    expect(describeAnswer(mcqRow())).toBe('לחקור');
  });
  it('mcq עם index פסול → סימון-שגיאה', () => {
    expect(describeAnswer(mcqRow({ correctAnswer: { index: 9 } }))).toBe('(index פסול)');
  });
  it('matching → זוגות term ⇄ definition', () => {
    const row = mcqRow({
      type: 'matching',
      options: [
        { left: 'מונח א', right: 'הגדרה א' },
        { left: 'מונח ב', right: 'הגדרה ב' },
      ] as unknown as NewQuestion['options'],
      correctAnswer: null,
    });
    expect(describeAnswer(row)).toBe('מונח א ⇄ הגדרה א · מונח ב ⇄ הגדרה ב');
  });
  it('open(explanation) → טקסט-התשובה', () => {
    const row = mcqRow({
      type: 'explanation',
      options: null,
      correctAnswer: { text: 'תשובת-מודל' },
    });
    expect(describeAnswer(row)).toBe('תשובת-מודל');
  });
});

describe('buildVerificationGroups', () => {
  it('מקבץ פר-נוסח-מותאם עם נתיב-המקור, ממוין מספרית', () => {
    const matches = [
      match(mcqRow({ sourceRef: 'nbq:2.3:mcq:x' }), ST_23),
      match(mcqRow({ sourceRef: 'nbq:1.0:mcq:y' }), ST_10),
      match(mcqRow({ sourceRef: 'nbq:1.0:mcq:z' }), ST_10),
    ];
    const groups = buildVerificationGroups(matches);
    expect(groups.map((g) => g.scopeId)).toEqual(['1.0', '2.3']); // sorted numeric
    expect(groups[0]!.statutePath).toBe('leg/1.0.md');
    expect(groups[0]!.questions).toHaveLength(2);
    expect(groups[0]!.questions[0]!.answer).toBe('לחקור');
    expect(groups[0]!.questions[0]!.options).toHaveLength(4);
  });
  it('scopeId כפול (שני נוסחים) → שתי קבוצות נפרדות לפי נתיב', () => {
    const dupA: StatuteSource = {
      scopeId: '4.3',
      title: 'רישוי-עסקים',
      body: 'a',
      path: 'leg/4.3a.md',
    };
    const dupB: StatuteSource = {
      scopeId: '4.3',
      title: 'הוראות-כלליות',
      body: 'b',
      path: 'leg/4.3b.md',
    };
    const groups = buildVerificationGroups([
      match(mcqRow({ sourceRef: 'nbq:4.3:mcq:1' }), dupA),
      match(mcqRow({ sourceRef: 'nbq:4.3:mcq:2' }), dupB),
    ]);
    expect(groups).toHaveLength(2);
    expect(groups.map((g) => g.statutePath).sort()).toEqual(['leg/4.3a.md', 'leg/4.3b.md']);
  });
  it('matching → ללא options-array (לא mcq)', () => {
    const m = match(
      mcqRow({
        type: 'matching',
        options: [{ left: 'a', right: 'b' }] as unknown as NewQuestion['options'],
        correctAnswer: null,
      }),
      ST_10,
    );
    expect(buildVerificationGroups([m])[0]!.questions[0]!.options).toBeUndefined();
  });
});

describe('parseExcludeRefs', () => {
  it('array של מחרוזות', () => {
    expect([...parseExcludeRefs('["a","b"," c "]')]).toEqual(['a', 'b', 'c']);
  });
  it('array של {sourceRef}', () => {
    expect([...parseExcludeRefs('[{"sourceRef":"x"},{"sourceRef":"y"}]')]).toEqual(['x', 'y']);
  });
  it('{held:[{sourceRef},string]}', () => {
    expect([...parseExcludeRefs('{"held":[{"sourceRef":"p"},"q"]}')]).toEqual(['p', 'q']);
  });
  it('JSON פסול → ריק (fail-safe)', () => {
    expect(parseExcludeRefs('not json').size).toBe(0);
  });
});

describe('filterExcluded', () => {
  it('Set ריק → כל השורות (passthrough)', () => {
    const rows = [mcqRow()];
    const { kept, excluded } = filterExcluded(rows, new Set());
    expect(kept).toHaveLength(1);
    expect(excluded).toHaveLength(0);
  });
  it('משמיט לפי sourceRef', () => {
    const rows = [mcqRow({ sourceRef: 'keep' }), mcqRow({ sourceRef: 'drop' })];
    const { kept, excluded } = filterExcluded(rows, new Set(['drop']));
    expect(kept.map((r) => r.sourceRef)).toEqual(['keep']);
    expect(excluded.map((r) => r.sourceRef)).toEqual(['drop']);
  });
});
