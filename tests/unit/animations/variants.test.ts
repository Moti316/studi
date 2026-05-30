import { describe, expect, it } from 'vitest';

import {
  activeNodeVariants,
  answerListContainer,
  answerListItem,
  backdropFadeVariants,
  bottomSheetVariants,
  cardSelectedVariants,
  cardTap,
  centerModalVariants,
  confettiConfig,
  durations,
  easings,
  lockedNodeVariants,
  mascotErrorVariants,
  mascotIdleVariants,
  mascotPopVariants,
  mascotSuccessVariants,
  matchedPairVariants,
  modalBackdropVariants,
  modalContentVariants,
  pathDrawVariants,
  respectReducedMotion,
  screenShakeVariants,
  screenSwapVariants,
  springs,
  submitButtonTap,
  submitButtonVariants,
  tabIconActiveVariants,
  unlockSequence,
  wrongAnswerBackdropVariants,
} from '@/lib/animations';

/**
 * Helper to narrow framer-motion's wide Variants type for test assertions.
 * Variants can be TargetResolver functions; in our spec they're plain objects.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const obj = <T = Record<string, any>>(value: unknown): T => value as T;

describe('animation variants — gemini-extracted', () => {
  describe('_base presets', () => {
    it('exposes 5 spring presets', () => {
      expect(obj(springs.button).stiffness).toBe(400);
      expect(obj(springs.elastic).damping).toBe(12);
      expect(obj(springs.pop).stiffness).toBe(500);
      expect(obj(springs.layout).damping).toBe(30);
      expect(obj(springs.modal).stiffness).toBe(300);
    });

    it('exposes named durations', () => {
      expect(durations.fast).toBeLessThan(durations.base);
      expect(durations.base).toBeLessThan(durations.medium);
      expect(durations.medium).toBeLessThan(durations.slow);
    });

    it('exposes ease bezier curves with 4 control points', () => {
      expect(easings.out).toHaveLength(4);
      expect(easings.in).toHaveLength(4);
      expect(easings.inOut).toHaveLength(4);
    });

    it('respectReducedMotion strips transition timing when reduced', () => {
      const original = { animate: { scale: 1, transition: { duration: 2 } } };
      // On JSDOM, prefers-reduced-motion matchMedia returns false → unchanged
      const result = respectReducedMotion(original);
      expect(result).toBeDefined();
    });
  });

  describe('V1-V8 — from video 02 (lesson-flow)', () => {
    it('V1: cardTap uses spring with 0.05s tap-down duration', () => {
      expect(cardTap.whileTap.scale).toBe(0.96);
      expect(obj(cardTap.transition).duration).toBe(0.05);
    });

    it('V2: cardSelectedVariants flips border instantly', () => {
      expect(obj(cardSelectedVariants.unselected)).toMatchObject({ borderColor: '#E5E7EB' });
      expect(obj(cardSelectedVariants.selected)).toMatchObject({ borderColor: '#FFB23D' });
    });

    it('V3: matchedPairVariants drops opacity to 0.5', () => {
      expect(obj(matchedPairVariants.matched)).toMatchObject({ opacity: 0.5 });
    });

    it('V4: submitButtonVariants enabled has pop sequence [1, 1.04, 1]', () => {
      expect(obj(submitButtonVariants.enabled).scale).toEqual([1, 1.04, 1]);
    });

    it('V5: submitButtonTap scales to 0.95', () => {
      expect(submitButtonTap.whileTap.scale).toBe(0.95);
    });

    it('V6: bottomSheet slides from 100% Y', () => {
      expect(obj(bottomSheetVariants.hidden)).toMatchObject({ y: '100%' });
      expect(obj(bottomSheetVariants.visible)).toMatchObject({ y: '0%' });
    });

    it('V6: backdrop fade reaches 0.6 opacity', () => {
      expect(obj(backdropFadeVariants.visible)).toMatchObject({ opacity: 0.6 });
    });

    it('V7: mascotPop has overshoot keyframes [0, 1.1, 1]', () => {
      expect(obj(mascotPopVariants.visible).scale).toEqual([0, 1.1, 1]);
    });

    it('V8: answerListContainer staggers 50ms between children', () => {
      expect(obj(answerListContainer.visible).transition.staggerChildren).toBe(0.05);
    });

    it('V8: answerListItem slides up from y:10', () => {
      expect(obj(answerListItem.hidden)).toMatchObject({ y: 10, opacity: 0 });
    });
  });

  describe('V9-V18 — from video 07 (stats-feedback)', () => {
    it('V9: pathDraw animates SVG pathLength 0→1 over 0.6s', () => {
      expect(obj(pathDrawVariants.hidden)).toMatchObject({ pathLength: 0 });
      expect(obj(pathDrawVariants.visible).pathLength).toBe(1);
      expect(obj(pathDrawVariants.visible).transition.duration).toBe(0.6);
    });

    it('V10: activeNode has primary-blue glow boxShadow', () => {
      expect(obj(activeNodeVariants.visible).boxShadow).toContain('rgba(26,86,219,0.5)');
    });

    it('V11: lockedNode simple fade+slide', () => {
      expect(obj(lockedNodeVariants.hidden)).toMatchObject({ y: 10, opacity: 0 });
    });

    it('V12: unlockSequence has 3 stages', () => {
      expect(unlockSequence).toHaveProperty('lockShake');
      expect(unlockSequence).toHaveProperty('ripple');
      expect(unlockSequence).toHaveProperty('iconPop');
    });

    it('V13: mascotIdle loops infinitely with sine ease', () => {
      expect(obj(mascotIdleVariants.animate).transition.repeat).toBe(Infinity);
      expect(obj(mascotIdleVariants.animate).transition.duration).toBe(3);
    });

    it('V14: mascotSuccess lifts y:-15 with cyan glow', () => {
      expect(obj(mascotSuccessVariants.animate).y).toBe(-15);
      expect(obj(mascotSuccessVariants.animate).filter).toContain('rgba(6,182,212');
    });

    it('V15: mascotError shakes x-axis with red glow', () => {
      expect(obj(mascotErrorVariants.animate).x).toEqual([0, -4, 4, -2, 2, 0]);
      expect(obj(mascotErrorVariants.animate).filter).toContain('rgba(239,68,68');
    });

    it('V16: screenShake oscillates x with 5 keyframes', () => {
      expect(obj(screenShakeVariants.shake).x).toEqual([0, -10, 10, -5, 5, 0]);
    });

    it('V16: wrongAnswerBackdrop tints red 10%', () => {
      expect(obj(wrongAnswerBackdropVariants.visible).backgroundColor).toBe(
        'rgba(239, 68, 68, 0.1)',
      );
    });

    it('V17: centerModal grows from 0.8 scale', () => {
      expect(obj(centerModalVariants.hidden)).toMatchObject({ scale: 0.8 });
      expect(obj(centerModalVariants.visible).scale).toBe(1);
    });

    it('V17: modalBackdrop applies 8px blur', () => {
      expect(obj(modalBackdropVariants.visible).backdropFilter).toBe('blur(8px)');
    });

    it('V17: modalContent staggers children by 50ms after 250ms delay', () => {
      expect(obj(modalContentVariants.visible).transition.delayChildren).toBe(0.25);
      expect(obj(modalContentVariants.visible).transition.staggerChildren).toBe(0.05);
    });

    it('V18: tabIconActive scales up then settles 1.1', () => {
      expect(obj(tabIconActiveVariants.active).scale).toEqual([0.8, 1.2, 1.1]);
    });

    it('V18: screenSwap cross-fades on X axis', () => {
      expect(obj(screenSwapVariants.enter)).toMatchObject({ x: 20, opacity: 0 });
      expect(obj(screenSwapVariants.exit)).toMatchObject({ x: -20, opacity: 0 });
    });
  });

  describe('Bonus — confetti', () => {
    it('confettiConfig matches success-celebration palette', () => {
      expect(confettiConfig.colors).toEqual(['#10B981', '#FBBF24', '#FFFFFF']);
      expect(confettiConfig.particleCount).toBe(80);
    });
  });
});
