import { describe, expect, it } from 'vitest';
import {
  dismissHomeScreenTip,
  isStandaloneDisplay,
  PWA_HOME_TIP_KEY,
  shouldShowHomeScreenTip,
} from './pwaHomeScreen';

function fakeWin(standaloneCss: boolean, iosStandalone = false) {
  return {
    matchMedia: (q: string) => ({
      matches: standaloneCss && q.includes('display-mode: standalone'),
      media: q,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
    navigator: { standalone: iosStandalone },
  } as unknown as Pick<Window, 'matchMedia' | 'navigator'>;
}

describe('pwaHomeScreen', () => {
  it('detects standalone display modes', () => {
    expect(isStandaloneDisplay(fakeWin(true))).toBe(true);
    expect(isStandaloneDisplay(fakeWin(false, true))).toBe(true);
    expect(isStandaloneDisplay(fakeWin(false, false))).toBe(false);
  });

  it('shows tip only when not installed and not dismissed', () => {
    const mem: Record<string, string> = {};
    const storage = {
      getItem: (k: string) => mem[k] ?? null,
      setItem: (k: string, v: string) => {
        mem[k] = v;
      },
    };
    expect(shouldShowHomeScreenTip(storage, fakeWin(false))).toBe(true);
    expect(shouldShowHomeScreenTip(storage, fakeWin(true))).toBe(false);
    dismissHomeScreenTip(storage);
    expect(mem[PWA_HOME_TIP_KEY]).toBe('1');
    expect(shouldShowHomeScreenTip(storage, fakeWin(false))).toBe(false);
  });
});
