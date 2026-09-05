import { afterEach, describe, expect, it, vi } from 'vitest';
import { acquireScreenWakeLock, wakeLockSupported } from './wakeLock';

describe('wakeLockSupported', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is false when wakeLock is missing', () => {
    vi.stubGlobal('navigator', {});
    expect(wakeLockSupported()).toBe(false);
  });

  it('is true when wakeLock.request exists', () => {
    vi.stubGlobal('navigator', {
      wakeLock: { request: vi.fn() },
    });
    expect(wakeLockSupported()).toBe(true);
  });
});

describe('acquireScreenWakeLock', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('no-ops when unsupported and release is safe', async () => {
    vi.stubGlobal('navigator', {});
    const handle = await acquireScreenWakeLock(() => true);
    await expect(handle.release()).resolves.toBeUndefined();
  });

  it('requests screen lock and releases the sentinel', async () => {
    const release = vi.fn().mockResolvedValue(undefined);
    const addEventListener = vi.fn();
    const request = vi.fn().mockResolvedValue({
      released: false,
      release,
      addEventListener,
    });
    vi.stubGlobal('navigator', { wakeLock: { request } });
    vi.stubGlobal('document', {
      visibilityState: 'visible',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const handle = await acquireScreenWakeLock(() => true);
    expect(request).toHaveBeenCalledWith('screen');
    await handle.release();
    expect(release).toHaveBeenCalled();
  });

  it('swallows request failures', async () => {
    const request = vi.fn().mockRejectedValue(new Error('denied'));
    vi.stubGlobal('navigator', { wakeLock: { request } });
    vi.stubGlobal('document', {
      visibilityState: 'visible',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const handle = await acquireScreenWakeLock(() => true);
    await expect(handle.release()).resolves.toBeUndefined();
  });
});
