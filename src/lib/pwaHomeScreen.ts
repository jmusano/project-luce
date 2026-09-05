/**
 * PWA home-screen helpers for parent corner tip (never kid chrome).
 * iPad Safari: Add to Home Screen → standalone display mode.
 */

export const PWA_HOME_TIP_KEY = 'luce-pwa-home-tip-dismissed';

export function isStandaloneDisplay(
  win: Pick<Window, 'matchMedia' | 'navigator'> = window,
): boolean {
  try {
    if (win.matchMedia?.('(display-mode: standalone)').matches) return true;
    // iOS Safari legacy
    const nav = win.navigator as Navigator & { standalone?: boolean };
    if (nav?.standalone === true) return true;
  } catch {
    /* ignore */
  }
  return false;
}

export function shouldShowHomeScreenTip(
  storage: Pick<Storage, 'getItem'> | null = typeof localStorage !== 'undefined' ? localStorage : null,
  win: Pick<Window, 'matchMedia' | 'navigator'> = window,
): boolean {
  if (isStandaloneDisplay(win)) return false;
  try {
    if (storage?.getItem(PWA_HOME_TIP_KEY) === '1') return false;
  } catch {
    /* private mode — still show tip once per open */
  }
  return true;
}

export function dismissHomeScreenTip(
  storage: Pick<Storage, 'setItem'> | null = typeof localStorage !== 'undefined' ? localStorage : null,
): void {
  try {
    storage?.setItem(PWA_HOME_TIP_KEY, '1');
  } catch {
    /* ignore */
  }
}
