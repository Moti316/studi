/**
 * tests/unit/import/legislation-manifest.test.ts
 *
 * Guards the 39-item legislation manifest: every canonical scopeId is valid,
 * slugs/urls/filenames are unique, chapter dirs match the scope chapter, and the
 * special cases (2.10's two texts, the `covers` back-references) hold. This is
 * the 0-drift gate against scope-refs.ts and the A2 plan.
 */

import { describe, expect, it } from 'vitest';
import {
  LEGISLATION_SOURCES,
  validateManifest,
  fileNameFor,
  relPathFor,
  type ChapterDir,
} from '../../../scripts/legislation-manifest';
import { isValidScopeId } from '@/lib/db/constants/scope-refs';

const CHAPTER_DIRS: readonly ChapterDir[] = [
  '1-irgun-hapikuach',
  '2-pkudat-habetihut',
  '3-gehut',
  '4-hukei-ezer',
];

describe('legislation manifest — shape', () => {
  it('has exactly 39 sources (37 catalog + 1.5.1 + 2.5)', () => {
    expect(LEGISLATION_SOURCES.length).toBe(39);
  });

  it('passes the built-in validator (valid scopes, unique slug/url/filename)', () => {
    expect(validateManifest()).toEqual([]);
  });

  it('every canonical scopeId is a known committee scope', () => {
    for (const s of LEGISLATION_SOURCES) {
      expect(isValidScopeId(s.scopeId), `scopeId ${s.scopeId}`).toBe(true);
    }
  });
});

describe('legislation manifest — chapters & naming', () => {
  it('every chapterDir is one of the four known directories', () => {
    for (const s of LEGISLATION_SOURCES) {
      expect(CHAPTER_DIRS).toContain(s.chapterDir);
    }
  });

  it('chapterDir matches the scope chapter (1.x→1-, 2.x→2-, 3.x→3-, 4.x→4-)', () => {
    for (const s of LEGISLATION_SOURCES) {
      const chapter = s.scopeId.split('.')[0];
      expect(s.chapterDir.startsWith(`${chapter}-`), `${s.scopeId} → ${s.chapterDir}`).toBe(true);
    }
  });

  it('slugs end with a Gregorian year and are kebab-case', () => {
    for (const s of LEGISLATION_SOURCES) {
      expect(s.slug, s.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*-\d{4}$/);
    }
  });

  it('filename is `<subId|scopeId>-<slug>.md` and lands under the chapter dir', () => {
    const s = LEGISLATION_SOURCES.find((x) => x.subId === '2.10b')!;
    expect(fileNameFor(s)).toBe('2.10b-bdikat-mitkanei-lachatz-1967.md');
    expect(relPathFor(s)).toBe(
      'courses/safety-officer/sources/legislation/2-pkudat-habetihut/2.10b-bdikat-mitkanei-lachatz-1967.md',
    );
  });
});

describe('legislation manifest — special cases', () => {
  it('canonical scope 2.10 has two texts (2.10 + 2.10b) without filename collision', () => {
    const tens = LEGISLATION_SOURCES.filter((s) => s.scopeId === '2.10');
    expect(tens.length).toBe(2);
    const files = new Set(tens.map(fileNameFor));
    expect(files.size).toBe(2);
  });

  it('the ordinance 2.0 records covers:[2.11] (no standalone elevator text)', () => {
    const ordinance = LEGISLATION_SOURCES.find((s) => s.scopeId === '2.0')!;
    expect(ordinance.covers).toContain('2.11');
  });

  it('2.6 records covers:[2.6.1] (tower-crane has no standalone text)', () => {
    const cranes = LEGISLATION_SOURCES.find((s) => s.scopeId === '2.6')!;
    expect(cranes.covers).toContain('2.6.1');
  });

  it('does NOT include the skipped narrow elevator-door regulation (74832)', () => {
    expect(LEGISLATION_SOURCES.some((s) => s.url.includes('74832'))).toBe(false);
  });

  it('re-fetches 1.5.1 and 2.5 as .md (uniform corpus)', () => {
    expect(LEGISLATION_SOURCES.some((s) => s.scopeId === '1.5.1')).toBe(true);
    expect(LEGISLATION_SOURCES.some((s) => s.scopeId === '2.5')).toBe(true);
  });

  it('flags exactly the 4 image-appendix gaps found by the QA workflow', () => {
    const gapped = LEGISLATION_SOURCES.filter((s) => s.knownGap).map((s) => s.subId ?? s.scopeId);
    expect(new Set(gapped)).toEqual(new Set(['2.3', '2.6', '2.8', '3.5.2']));
  });

  it("1.5.1 official title carries Nevo's full form (במקומות עבודה)", () => {
    const s = LEGISLATION_SOURCES.find((x) => x.scopeId === '1.5.1')!;
    expect(s.officialTitle).toContain('במקומות עבודה');
  });
});
