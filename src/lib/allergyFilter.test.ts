import { describe, expect, it } from 'vitest';
import {
  buildAllergyInterruptTurn,
  containsTreeNutFood,
  filterPictureChoices,
  filterSpeechText,
  getAllergyTeachLine,
  shouldHardAllergyInterrupt,
  TREE_NUT_FOOD_TERMS,
} from './allergyFilter';

describe('containsTreeNutFood', () => {
  it('flags every listed tree-nut food term', () => {
    for (const term of TREE_NUT_FOOD_TERMS) {
      expect(containsTreeNutFood(`Would you like some ${term}?`)).toBe(true);
    }
  });

  it('flags bare nut / nuts and nut-food emoji', () => {
    expect(containsTreeNutFood('I want nuts')).toBe(true);
    expect(containsTreeNutFood('a nut please')).toBe(true);
    expect(containsTreeNutFood('Nutella snack')).toBe(true);
    expect(containsTreeNutFood('peanut butter sandwich')).toBe(true);
    expect(containsTreeNutFood('snack 🥜')).toBe(true);
  });

  it('allows safe foods and non-food lookalikes', () => {
    expect(containsTreeNutFood('apple')).toBe(false);
    expect(containsTreeNutFood('banana snack')).toBe(false);
    expect(containsTreeNutFood('triceratops')).toBe(false);
    expect(containsTreeNutFood('doughnut')).toBe(false);
    expect(containsTreeNutFood('donut')).toBe(false);
    expect(containsTreeNutFood('coconut')).toBe(false);
    expect(containsTreeNutFood('moon')).toBe(false);
  });
});

describe('filterPictureChoices', () => {
  it('rewrites nut labels to safe fruit', () => {
    const out = filterPictureChoices([
      { id: 'a', emoji: '🥜', label: 'peanuts' },
      { id: 'b', emoji: '🦕', label: 'dinosaur' },
    ]);
    expect(out[0].emoji).toBe('🍎');
    expect(out[0].label).toBe('apple');
    expect(out[1]).toEqual({ id: 'b', emoji: '🦕', label: 'dinosaur' });
  });

  it('rewrites nut emoji even when label looks safe', () => {
    const out = filterPictureChoices([
      { id: 'x', emoji: '🥜', label: 'snack' },
      { id: 'y', emoji: '🌙', label: 'moon' },
    ]);
    expect(out[0].emoji).not.toBe('🥜');
    expect(containsTreeNutFood(out[0].label)).toBe(false);
    expect(out[1].label).toBe('moon');
  });

  it('never leaves two nut choices on screen', () => {
    const out = filterPictureChoices([
      { id: 'a', emoji: '🥜', label: 'almonds' },
      { id: 'b', emoji: '🥜', label: 'cashews' },
    ]);
    expect(out).toHaveLength(2);
    for (const c of out) {
      expect(c.emoji).not.toBe('🥜');
      expect(containsTreeNutFood(c.label)).toBe(false);
    }
    expect(new Set(out.map((c) => c.label)).size).toBe(2);
  });

  it('leaves safe choices alone', () => {
    const safe = [
      { id: '1', emoji: '🌙', label: 'moon' },
      { id: '2', emoji: '🌲', label: 'forest' },
    ];
    expect(filterPictureChoices(safe)).toEqual(safe);
  });
});

describe('filterSpeechText', () => {
  it('scrubs nut words from speech', () => {
    const out = filterSpeechText('We shared almonds and cashews at the picnic.');
    expect(out.toLowerCase()).not.toContain('almond');
    expect(out.toLowerCase()).not.toContain('cashew');
    expect(out).toContain('yummy fruit');
  });

  it('hard-appends teach line whenever source mentioned nut food', () => {
    const out = filterSpeechText('Want some walnuts?');
    expect(out.toLowerCase()).not.toContain('walnut');
    expect(out).toContain(getAllergyTeachLine());
  });

  it('can append the teach line on request even without a hit', () => {
    const out = filterSpeechText('Time for a snack.', { includeTeachLine: true });
    expect(out).toContain(getAllergyTeachLine());
  });

  it('does not teach on safe speech without includeTeachLine', () => {
    const out = filterSpeechText('Dinosaurs love leaves.');
    expect(out).not.toContain(getAllergyTeachLine());
  });
});

describe('hard allergy interrupt', () => {
  it('triggers on kid nut-food talk and not on safe talk', () => {
    expect(shouldHardAllergyInterrupt('I want peanuts')).toBe(true);
    expect(shouldHardAllergyInterrupt('mixed nuts please')).toBe(true);
    expect(shouldHardAllergyInterrupt('dinosaurs')).toBe(false);
    expect(shouldHardAllergyInterrupt('')).toBe(false);
    expect(shouldHardAllergyInterrupt(undefined)).toBe(false);
  });

  it('buildAllergyInterruptTurn never shows nuts and always teaches', () => {
    const turn = buildAllergyInterruptTurn('peanut butter');
    expect(turn.speech).toContain(getAllergyTeachLine());
    expect(turn.speech.toLowerCase()).not.toMatch(
      /\b(peanut|almond|cashew|walnut|eat them with)\b/,
    );
    // "don't eat them" is the teach — allowed; food offering is not
    expect(turn.speech.toLowerCase()).toMatch(/sick|don't eat/);
    // Product locks: parent gate + safe fruit redirect
    expect(turn.speech.toLowerCase()).toMatch(/mommy or daddy/);
    expect(turn.speech.toLowerCase()).toMatch(/apple/);
    expect(turn.speech.toLowerCase()).toMatch(/banana/);
    expect(turn.speech.toLowerCase()).toMatch(/never eat/);
    expect(turn.twoPictureChoices).toHaveLength(2);
    for (const c of turn.twoPictureChoices) {
      expect(containsTreeNutFood(c.label)).toBe(false);
      expect(c.emoji).not.toBe('🥜');
    }
    expect(turn.captions.naomi).toBe('peanut butter');
    expect(turn.captions.luce).toBe(turn.speech);
  });

  it('allergy interrupt speech stays warm preschool-teacher (not cold stop)', () => {
    const turn = buildAllergyInterruptTurn('I want nuts');
    const lower = turn.speech.toLowerCase();
    // Warm co-play markers — not a sharp "whoa / stop" bark
    expect(lower).toMatch(/oh |sweetheart|careful|with me|soft |let's/);
    expect(lower).not.toMatch(/\bwhoa\b|\bstop\.?\b|\bhalt\b|\bno!\b/);
    // Locks still held
    expect(turn.speech).toContain(getAllergyTeachLine());
    expect(lower).toMatch(/mommy or daddy/);
    expect(turn.twoPictureChoices.map((c) => c.label)).toEqual(['apple', 'banana']);
  });
});

describe('choice label scrub before show', () => {
  it('scrubs nut words inside longer choice labels', () => {
    const out = filterPictureChoices([
      { id: 'snack-a', emoji: '🍪', label: 'peanut cookie' },
      { id: 'snack-b', emoji: '🥛', label: 'milk' },
    ]);
    expect(out).toHaveLength(2);
    expect(containsTreeNutFood(out[0].label)).toBe(false);
    expect(out[0].emoji).not.toBe('🥜');
    expect(out[1].label).toBe('milk');
  });
});
