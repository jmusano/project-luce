import { describe, expect, it } from 'vitest';
import {
  containsTreeNutFood,
  filterPictureChoices,
  filterSpeechText,
  getAllergyTeachLine,
  TREE_NUT_FOOD_TERMS,
} from './allergyFilter';

describe('containsTreeNutFood', () => {
  it('flags every listed tree-nut food term', () => {
    for (const term of TREE_NUT_FOOD_TERMS) {
      expect(containsTreeNutFood(`Would you like some ${term}?`)).toBe(true);
    }
  });

  it('allows safe foods and non-food nut words in other contexts we rewrite elsewhere', () => {
    expect(containsTreeNutFood('apple')).toBe(false);
    expect(containsTreeNutFood('banana snack')).toBe(false);
    expect(containsTreeNutFood('triceratops')).toBe(false);
    expect(containsTreeNutFood('doughnut')).toBe(false);
  });
});

describe('filterPictureChoices', () => {
  it('rewrites nut labels to apple', () => {
    const out = filterPictureChoices([
      { id: 'a', emoji: '🥜', label: 'peanuts' },
      { id: 'b', emoji: '🦕', label: 'dinosaur' },
    ]);
    expect(out[0]).toEqual({ id: 'a', emoji: '🍎', label: 'apple' });
    expect(out[1]).toEqual({ id: 'b', emoji: '🦕', label: 'dinosaur' });
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

  it('can append the teach line', () => {
    const out = filterSpeechText('Time for a snack.', { includeTeachLine: true });
    expect(out).toContain(getAllergyTeachLine());
  });
});
