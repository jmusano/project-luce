import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  QUIET_HANGUP_MS,
  createQuietHangupTimer,
} from './quietHangup';

describe('QUIET_HANGUP_MS', () => {
  it('is about two minutes', () => {
    expect(QUIET_HANGUP_MS).toBe(2 * 60 * 1000);
  });
});

describe('createQuietHangupTimer', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('arms and hangs up silently after the quiet window', () => {
    vi.useFakeTimers();
    const onHangup = vi.fn();
    const timer = createQuietHangupTimer({
      isActive: () => true,
      onHangup,
      ms: 1000,
    });

    timer.arm();
    expect(timer.isArmed()).toBe(true);
    expect(onHangup).not.toHaveBeenCalled();

    vi.advanceTimersByTime(999);
    expect(onHangup).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onHangup).toHaveBeenCalledTimes(1);
    expect(timer.isArmed()).toBe(false);
  });

  it('defaults to QUIET_HANGUP_MS (~2 min)', () => {
    vi.useFakeTimers();
    const onHangup = vi.fn();
    const timer = createQuietHangupTimer({
      isActive: () => true,
      onHangup,
    });

    timer.arm();
    vi.advanceTimersByTime(QUIET_HANGUP_MS - 1);
    expect(onHangup).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onHangup).toHaveBeenCalledTimes(1);
  });

  it('clear cancels a pending hang-up', () => {
    vi.useFakeTimers();
    const onHangup = vi.fn();
    const timer = createQuietHangupTimer({
      isActive: () => true,
      onHangup,
      ms: 500,
    });

    timer.arm();
    timer.clear();
    expect(timer.isArmed()).toBe(false);
    vi.advanceTimersByTime(1000);
    expect(onHangup).not.toHaveBeenCalled();
  });

  it('arm resets the window (talk/picture activity)', () => {
    vi.useFakeTimers();
    const onHangup = vi.fn();
    const timer = createQuietHangupTimer({
      isActive: () => true,
      onHangup,
      ms: 1000,
    });

    timer.arm();
    vi.advanceTimersByTime(800);
    // Kid talked or tapped a picture — quiet clock restarts
    timer.arm();
    vi.advanceTimersByTime(800);
    expect(onHangup).not.toHaveBeenCalled();
    vi.advanceTimersByTime(200);
    expect(onHangup).toHaveBeenCalledTimes(1);
  });

  it('does not arm when session is inactive', () => {
    vi.useFakeTimers();
    const onHangup = vi.fn();
    const timer = createQuietHangupTimer({
      isActive: () => false,
      onHangup,
      ms: 100,
    });

    timer.arm();
    expect(timer.isArmed()).toBe(false);
    vi.advanceTimersByTime(500);
    expect(onHangup).not.toHaveBeenCalled();
  });

  it('does not hang up if session ended before fire', () => {
    vi.useFakeTimers();
    let active = true;
    const onHangup = vi.fn();
    const timer = createQuietHangupTimer({
      isActive: () => active,
      onHangup,
      ms: 200,
    });

    timer.arm();
    active = false;
    vi.advanceTimersByTime(200);
    expect(onHangup).not.toHaveBeenCalled();
  });

  it('uses injectable schedule/cancel', () => {
    const ids: number[] = [];
    const schedule = vi.fn((fn: () => void, ms: number) => {
      expect(ms).toBe(42);
      const id = 7;
      ids.push(id);
      // do not auto-fire
      void fn;
      return id;
    });
    const cancel = vi.fn();
    const timer = createQuietHangupTimer({
      isActive: () => true,
      onHangup: () => {},
      ms: 42,
      schedule,
      cancel,
    });

    timer.arm();
    expect(schedule).toHaveBeenCalledTimes(1);
    expect(timer.isArmed()).toBe(true);
    timer.clear();
    expect(cancel).toHaveBeenCalledWith(7);
    expect(timer.isArmed()).toBe(false);
  });
});
