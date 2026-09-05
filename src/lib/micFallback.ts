/**
 * Calm mic / STT fallback copy for preschool + Deaf parents.
 * Kid-facing lines stay soft; parent notes stay visual (no sound).
 */

export type UiStatus = 'tap' | 'listening' | 'talking' | 'unsupported' | 'denied';

export type MicMode = 'ok' | 'unsupported' | 'denied';

/** Classify Web Speech recognition.error codes. */
export function classifySpeechError(error: string): 'denied' | 'benign' | 'error' {
  if (error === 'not-allowed' || error === 'service-not-allowed') return 'denied';
  if (error === 'aborted' || error === 'no-speech') return 'benign';
  return 'error';
}

export function micModeFromStatus(status: UiStatus, sttSupported: boolean): MicMode {
  if (status === 'denied') return 'denied';
  if (status === 'unsupported' || !sttSupported) return 'unsupported';
  return 'ok';
}

/** Kid-safe status line — never scary permission / error language. */
export function kidSafeStatusText(status: UiStatus, sttSupported: boolean): string {
  if (status === 'talking') return 'Luce is talking';
  if (status === 'listening') return 'Your turn — listening';

  const mode = micModeFromStatus(status, sttSupported);
  if (mode === 'unsupported') return 'Pictures work — tap one!';
  if (mode === 'denied') return 'Mic resting — tap a picture!';
  return 'Tap Luce to talk';
}

/** Short visual parent note (captions only — never sound). */
export function parentMicNote(mode: MicMode): string | null {
  if (mode === 'unsupported') {
    return 'Mic not available here. Naomi can keep going with pictures; captions still show.';
  }
  if (mode === 'denied') {
    return 'Mic permission is off. Pictures still work; captions still show.';
  }
  return null;
}

export function parentStatusLabel(status: UiStatus, sessionActive: boolean): string {
  if (!sessionActive && status === 'tap') return 'Idle — tap Luce to start';
  switch (status) {
    case 'listening':
      return 'Listening to Naomi';
    case 'talking':
      return 'Luce is talking';
    case 'unsupported':
      return 'Mic unavailable — use pictures';
    case 'denied':
      return 'Mic permission off — use pictures';
    case 'tap':
      return sessionActive ? 'Ready' : 'Idle — tap Luce to start';
    default:
      return status;
  }
}
