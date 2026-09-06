import { describe, expect, it } from 'vitest';
import {
  isHangupPhrase,
  isWakeContinuePhrase,
  normalizeHangupText,
} from './hangupPhrase';

describe('normalizeHangupText', () => {
  it('lowercases and strips punctuation', () => {
    expect(normalizeHangupText('  Bye-Bye!!! ')).toBe('bye bye');
    expect(normalizeHangupText("I'm going later.")).toBe("i'm going later");
  });
});

describe('isHangupPhrase', () => {
  it('matches locked hang-up phrases (case-insensitive)', () => {
    expect(isHangupPhrase('bye')).toBe(true);
    expect(isHangupPhrase('BYE')).toBe(true);
    expect(isHangupPhrase('bye-bye')).toBe(true);
    expect(isHangupPhrase('Bye bye')).toBe(true);
    expect(isHangupPhrase('byebye')).toBe(true);
    expect(isHangupPhrase('goodbye')).toBe(true);
    expect(isHangupPhrase('Good Bye!')).toBe(true);
    expect(isHangupPhrase('see you later')).toBe(true);
    expect(isHangupPhrase('See You Later.')).toBe(true);
    expect(isHangupPhrase("I'm going later")).toBe(true);
    expect(isHangupPhrase('im going later')).toBe(true);
    expect(isHangupPhrase('I am going later')).toBe(true);
  });

  it('matches kid variants: night-night, see ya, gotta go', () => {
    expect(isHangupPhrase('night-night')).toBe(true);
    expect(isHangupPhrase('Night night')).toBe(true);
    expect(isHangupPhrase('nightnight')).toBe(true);
    expect(isHangupPhrase('see ya')).toBe(true);
    expect(isHangupPhrase('See ya!')).toBe(true);
    expect(isHangupPhrase('see ya later')).toBe(true);
    expect(isHangupPhrase('I gotta go')).toBe(true);
    expect(isHangupPhrase("I've gotta go")).toBe(true);
    expect(isHangupPhrase('I got to go')).toBe(true);
    expect(isHangupPhrase('I have to go')).toBe(true);
    expect(isHangupPhrase('gotta go')).toBe(true);
    expect(isHangupPhrase('ok gotta go mommy')).toBe(true);
  });

  it('matches kid phrasing with extra words or punctuation', () => {
    expect(isHangupPhrase('ok bye')).toBe(true);
    expect(isHangupPhrase('bye Luce')).toBe(true);
    expect(isHangupPhrase('bye-bye, mommy')).toBe(true);
    expect(isHangupPhrase('goodbye naomi')).toBe(true);
    expect(isHangupPhrase('um see you later')).toBe(true);
    expect(isHangupPhrase('I am going later now')).toBe(true);
    expect(isHangupPhrase('night-night Luce')).toBe(true);
  });

  it('does not hang up on ordinary play talk', () => {
    expect(isHangupPhrase('')).toBe(false);
    expect(isHangupPhrase('dinosaurs')).toBe(false);
    expect(isHangupPhrase('T-rex')).toBe(false);
    expect(isHangupPhrase('buy a banana')).toBe(false);
    expect(isHangupPhrase('see the moon')).toBe(false);
    expect(isHangupPhrase('I am going outside')).toBe(false);
    expect(isHangupPhrase('later')).toBe(false);
    expect(isHangupPhrase('night')).toBe(false);
    expect(isHangupPhrase('go')).toBe(false);
    expect(isHangupPhrase('see')).toBe(false);
    expect(isHangupPhrase('I gotta stay')).toBe(false);
  });

  it('does not treat wake-continue as hang-up', () => {
    expect(isHangupPhrase('wake up')).toBe(false);
    expect(isHangupPhrase("don't go")).toBe(false);
    expect(isHangupPhrase('come back')).toBe(false);
    expect(isHangupPhrase('more')).toBe(false);
  });
});

describe('isWakeContinuePhrase', () => {
  it('matches wake up / dont go / come back / again / more', () => {
    expect(isWakeContinuePhrase('wake up')).toBe(true);
    expect(isWakeContinuePhrase('Wake-Up!')).toBe(true);
    expect(isWakeContinuePhrase("don't go")).toBe(true);
    expect(isWakeContinuePhrase('do not go')).toBe(true);
    expect(isWakeContinuePhrase('come back')).toBe(true);
    expect(isWakeContinuePhrase('again soon')).toBe(true);
    expect(isWakeContinuePhrase('play again')).toBe(true);
    expect(isWakeContinuePhrase('more')).toBe(true);
    expect(isWakeContinuePhrase('more please')).toBe(true);
    expect(isWakeContinuePhrase('one more')).toBe(true);
    expect(isWakeContinuePhrase('stay')).toBe(true);
    expect(isWakeContinuePhrase('not yet')).toBe(true);
  });

  it('does not match ordinary play without continue intent', () => {
    expect(isWakeContinuePhrase('')).toBe(false);
    expect(isWakeContinuePhrase('dinosaurs')).toBe(false);
    expect(isWakeContinuePhrase('bye')).toBe(false);
    expect(isWakeContinuePhrase('straw')).toBe(false);
  });
});
