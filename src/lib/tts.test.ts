import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SOFT_VOICE_HINTS,
  SOFT_PRESCHOOL_PITCH,
  SOFT_PRESCHOOL_RATE,
  pickVoice,
  scoreSoftPreschoolVoice,
  withSoftStoryPauses,
} from './tts';

describe('soft preschool TTS defaults', () => {
  it('keeps rate softer/slower and pitch gently lifted', () => {
    expect(SOFT_PRESCHOOL_RATE).toBeGreaterThanOrEqual(0.85);
    expect(SOFT_PRESCHOOL_RATE).toBeLessThanOrEqual(0.88);
    expect(SOFT_PRESCHOOL_PITCH).toBeCloseTo(1.08, 2);
  });

  it('includes expanded iPad / iOS warm female voice hints', () => {
    for (const name of [
      'Samantha',
      'Karen',
      'Moira',
      'Fiona',
      'Tessa',
      'Victoria',
      'Nora',
      'Martha',
      'Nicky',
      'Melina',
    ]) {
      expect(DEFAULT_SOFT_VOICE_HINTS).toContain(name);
    }
  });

  it('adds soft ellipsis pauses after sentence ends', () => {
    const out = withSoftStoryPauses('Hello. Ready? Go!');
    expect(out).toContain('…');
    expect(out.startsWith('Hello')).toBe(true);
  });
});

describe('pickVoice', () => {
  it('returns null for an empty list', () => {
    expect(pickVoice([])).toBeNull();
  });

  it('prefers Samantha over generic English on iPad-like lists', () => {
    const voices = [
      { name: 'Alex', lang: 'en-US', localService: true },
      { name: 'Samantha', lang: 'en-US', localService: true },
      { name: 'Daniel', lang: 'en-GB', localService: true },
    ];
    expect(pickVoice(voices)?.name).toBe('Samantha');
  });

  it('prefers Karen (AU) over masculine English when Samantha is missing', () => {
    const voices = [
      { name: 'Daniel', lang: 'en-GB', localService: true },
      { name: 'Karen', lang: 'en-AU', localService: true },
      { name: 'Fred', lang: 'en-US', localService: true },
    ];
    expect(pickVoice(voices)?.name).toBe('Karen');
  });

  it('falls back to an English voice when no soft hints match', () => {
    const voices = [
      { name: 'Kyoko', lang: 'ja-JP' },
      { name: 'Google Deutsch', lang: 'de-DE' },
      { name: 'English United States', lang: 'en-US', localService: true },
    ];
    expect(pickVoice(voices)?.lang).toMatch(/^en/i);
  });

  it('respects custom voiceNameIncludes order', () => {
    const voices = [
      { name: 'Samantha', lang: 'en-US' },
      { name: 'Moira', lang: 'en-IE' },
    ];
    expect(pickVoice(voices, ['Moira', 'Samantha'])?.name).toBe('Moira');
  });
});

describe('scoreSoftPreschoolVoice', () => {
  it('scores non-English voices very low', () => {
    expect(scoreSoftPreschoolVoice({ name: 'Kyoko', lang: 'ja-JP' })).toBeLessThan(-100);
  });

  it('scores Samantha higher than Alex', () => {
    const sam = scoreSoftPreschoolVoice({ name: 'Samantha', lang: 'en-US', localService: true });
    const alex = scoreSoftPreschoolVoice({ name: 'Alex', lang: 'en-US', localService: true });
    expect(sam).toBeGreaterThan(alex);
  });
});
