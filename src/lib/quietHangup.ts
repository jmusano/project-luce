/**
 * Quiet hang-up timer — ~2 minutes with no talk/picture activity ends the sitting.
 * Silent only: no "are you there?" nag. Arm on idle listen; clear/re-arm on talk or picture.
 */

/** Default quiet window before silent hang-up (~2 minutes). */
export const QUIET_HANGUP_MS = 2 * 60 * 1000;

export type QuietHangupTimer = {
  /** Start or restart the quiet countdown (no-op when session inactive). */
  arm: () => void;
  /** Cancel any pending quiet hang-up. */
  clear: () => void;
  /** True while a quiet timer is scheduled (tests / diagnostics). */
  isArmed: () => boolean;
};

export type QuietHangupOptions = {
  /** Quiet window in ms; defaults to QUIET_HANGUP_MS. */
  ms?: number;
  /** Session still active? Checked on arm and when the timer fires. */
  isActive: () => boolean;
  /** Silent hang-up — never prompts the kid. */
  onHangup: () => void;
  /** Injectable timer APIs for unit tests. */
  schedule?: (fn: () => void, ms: number) => number;
  cancel?: (id: number) => void;
};

/**
 * Create a quiet hang-up controller.
 * Call arm() after TTS / listen idle; clear() on talk, picture, or hang-up.
 */
export function createQuietHangupTimer(opts: QuietHangupOptions): QuietHangupTimer {
  const ms = opts.ms ?? QUIET_HANGUP_MS;
  const schedule =
    opts.schedule ??
    ((fn, delay) => {
      if (typeof window === 'undefined') {
        return setTimeout(fn, delay) as unknown as number;
      }
      return window.setTimeout(fn, delay);
    });
  const cancel =
    opts.cancel ??
    ((id) => {
      if (typeof window === 'undefined') {
        clearTimeout(id);
        return;
      }
      window.clearTimeout(id);
    });

  let timerId: number | null = null;

  const clear = () => {
    if (timerId != null) {
      cancel(timerId);
      timerId = null;
    }
  };

  const arm = () => {
    clear();
    if (!opts.isActive()) return;
    timerId = schedule(() => {
      timerId = null;
      // Silent hang-up only — foundation lock: no are-you-there nag.
      if (opts.isActive()) opts.onHangup();
    }, ms);
  };

  return {
    arm,
    clear,
    isArmed: () => timerId != null,
  };
}
