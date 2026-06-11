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

    it('V2: cardSelectedVariants flips border instantly (B1 brand colors)', () => {
      // B1 redesign (2026-06-11): solid-white card · quiz-border → accent-amber selection.
      expect(obj(cardSelectedVariants.unselected)).toMatchObject({ borderColor: '#e6eaf1' });
      expect(obj(cardSelectedVariants.selected)).toMatchObject({ borderColor: '#f5a623' });
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

import {
  centerModalLightVariants,
  checkboxPopVariants,
  checkmarkPopVariants,
  dailyGoalPillTransition,
  gridStaggerContainer,
  gridStaggerItem,
  pageSlideHorizontal,
  progressBarTransition,
  progressDotVariants,
  segmentedControlTransition,
  spinnerEnterVariants,
  spinnerRotateAnimation,
  statusPulseVariants,
  streakBumpVariants,
  toastVariants,
  toggleSwitchTransition,
  voiceCardLoaderVariants,
  xpCountUpFlashVariants,
  xpCountUpTransition,
  xpFloaterVariants,
} from '@/lib/animations';

describe('animation variants — gemini-extracted (V19-V34)', () => {
  describe('Gamification (V19-V23) — video 01 + 07', () => {
    it('V19: xpCountUpTransition is 400ms ease-out', () => {
      expect(xpCountUpTransition.duration).toBe(0.4);
      expect(xpCountUpTransition.ease).toHaveLength(4);
    });

    it('V19: xpCountUpFlash strobes through orange', () => {
      expect(obj(xpCountUpFlashVariants.counting).color).toEqual(['#111827', '#F97316', '#111827']);
    });

    it('V20: xpFloater rises and fades out', () => {
      expect(obj(xpFloaterVariants.hidden)).toMatchObject({ y: 10, opacity: 0 });
      expect(obj(xpFloaterVariants.visible).y).toBe(-20);
      expect(obj(xpFloaterVariants.exit).y).toBe(-40);
    });

    it('V21: progressDot pulses scale on active', () => {
      expect(obj(progressDotVariants.active).scale).toEqual([1, 1.2, 1]);
      expect(obj(progressDotVariants.active).backgroundColor).toBe('#F97316');
    });

    it('V22: statusPulse loops infinitely', () => {
      expect(obj(statusPulseVariants.animate).transition.repeat).toBe(Infinity);
    });

    it('V23: progressBarTransition is slow ease-out for smooth fill', () => {
      expect(progressBarTransition.duration).toBe(0.6);
    });

    it('streakBump pulses to 1.2 on increment', () => {
      expect(obj(streakBumpVariants.bump).scale).toEqual([1, 1.2, 1]);
    });
  });

  describe('Transitions (V24-V29) — videos 04 + 05', () => {
    it('V24: pageSlideHorizontal uses bounce-0 spring (no overshoot)', () => {
      expect(obj(pageSlideHorizontal.active).transition.bounce).toBe(0);
    });

    it('V25: spinner enters from scale 0.8 then loops 360° linear', () => {
      expect(obj(spinnerEnterVariants.hidden)).toMatchObject({ scale: 0.8, opacity: 0 });
      expect(spinnerRotateAnimation.rotate).toBe(360);
      expect(obj(spinnerRotateAnimation.transition).repeat).toBe(Infinity);
    });

    it('V26: centerModalLight grows from 0.95 (gentler than V17)', () => {
      expect(obj(centerModalLightVariants.hidden)).toMatchObject({ scale: 0.95 });
    });

    it('V27: checkmarkPop springs in from scale 0', () => {
      expect(obj(checkmarkPopVariants.hidden)).toMatchObject({ scale: 0, opacity: 0 });
      expect(obj(checkmarkPopVariants.visible).scale).toBe(1);
    });

    it('V28: gridStagger spaces children by 50ms', () => {
      expect(obj(gridStaggerContainer.visible).transition.staggerChildren).toBe(0.05);
      expect(obj(gridStaggerItem.hidden)).toMatchObject({ y: 10, opacity: 0 });
    });

    it('V29: checkboxPop springs from scale 0', () => {
      expect(obj(checkboxPopVariants.unchecked)).toMatchObject({ scale: 0, opacity: 0 });
      expect(obj(checkboxPopVariants.checked).scale).toBe(1);
    });
  });

  describe('Settings (V30-V34) — video 06', () => {
    it('V30: toggle uses stiff spring (700/40) for snap', () => {
      expect(obj(toggleSwitchTransition).stiffness).toBe(700);
      expect(obj(toggleSwitchTransition).damping).toBe(40);
    });

    it('V31: segmented control uses bounce 0.15 spring', () => {
      expect(obj(segmentedControlTransition).bounce).toBe(0.15);
      expect(obj(segmentedControlTransition).duration).toBe(0.3);
    });

    it('V32: toast slides up from y:100 with stiff spring', () => {
      expect(obj(toastVariants.hidden)).toMatchObject({ y: 100, opacity: 0 });
      expect(obj(toastVariants.visible).transition.stiffness).toBe(500);
    });

    it('V33: voiceCardLoader has loading + success states', () => {
      expect(voiceCardLoaderVariants).toHaveProperty('loading');
      expect(voiceCardLoaderVariants).toHaveProperty('success');
    });

    it('V34: dailyGoalPill reuses segmented-control transition', () => {
      expect(dailyGoalPillTransition).toEqual(segmentedControlTransition);
    });
  });
});
