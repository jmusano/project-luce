/**
 * Screen Wake Lock — keeps iPad awake during an active sitting.
 * Graceful no-op when the API is missing or the request fails.
 */

export type WakeLockHandle = {
  release: () => Promise<void>;
};

type WakeLockSentinelLike = {
  released: boolean;
  release: () => Promise<void>;
  addEventListener: (type: 'release', listener: () => void) => void;
};

type WakeLockNavigator = Navigator & {
  wakeLock?: {
    request: (type: 'screen') => Promise<WakeLockSentinelLike>;
  };
};

export function wakeLockSupported(): boolean {
  if (typeof navigator === 'undefined') return false;
  return typeof (navigator as WakeLockNavigator).wakeLock?.request === 'function';
}

/**
 * Request a screen wake lock. Returns a handle whose release() is always safe.
 * Re-acquires when the tab becomes visible again while stillActive() is true.
 */
export async function acquireScreenWakeLock(
  stillActive: () => boolean,
): Promise<WakeLockHandle> {
  const noop: WakeLockHandle = { release: async () => {} };

  if (!wakeLockSupported()) return noop;

  let sentinel: WakeLockSentinelLike | null = null;
  let releasedByUs = false;
  let visibilityHandler: (() => void) | null = null;

  const request = async () => {
    if (releasedByUs || !stillActive()) return;
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
      return;
    }
    try {
      const nav = navigator as WakeLockNavigator;
      const next = await nav.wakeLock!.request('screen');
      sentinel = next;
      next.addEventListener('release', () => {
        if (sentinel === next) sentinel = null;
      });
    } catch {
      sentinel = null;
    }
  };

  const release = async () => {
    releasedByUs = true;
    if (visibilityHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', visibilityHandler);
      visibilityHandler = null;
    }
    const current = sentinel;
    sentinel = null;
    if (current && !current.released) {
      try {
        await current.release();
      } catch {
        /* ignore */
      }
    }
  };

  if (typeof document !== 'undefined') {
    visibilityHandler = () => {
      if (document.visibilityState === 'visible' && stillActive() && !releasedByUs) {
        void request();
      }
    };
    document.addEventListener('visibilitychange', visibilityHandler);
  }

  await request();

  return { release };
}
