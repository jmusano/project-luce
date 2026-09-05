import { useCallback, useEffect, useRef, useState } from 'react';
import {
  micModeFromStatus,
  parentMicNote,
  parentStatusLabel,
  type UiStatus,
} from '../lib/micFallback';

type Props = {
  naomiCaption: string;
  luceCaption: string;
  status: UiStatus;
  sessionActive: boolean;
  sttSupported: boolean;
  onHangUp: () => void;
};

const LONG_PRESS_MS = 650;

/**
 * Hidden parent corner: long-press tiny mark.
 * Visual + large captions + vibrate — NEVER sound. Both parents Deaf.
 * No speechSynthesis / Audio here — hang-up and status are visual only.
 */
export function ParentCorner({
  naomiCaption,
  luceCaption,
  status,
  sessionActive,
  sttSupported,
  onHangUp,
}: Props) {
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(false);
  const timerRef = useRef<number | null>(null);
  const prevCaptionsRef = useRef({ naomi: '', luce: '' });

  const vibrateSoft = useCallback(() => {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([40, 30, 40]);
      }
    } catch {
      /* ignore — visual-only is enough */
    }
  }, []);

  const clear = () => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const beginPress = useCallback(() => {
    clear();
    timerRef.current = window.setTimeout(() => {
      vibrateSoft();
      setPulse(true);
      setOpen(true);
    }, LONG_PRESS_MS);
  }, [vibrateSoft]);

  const endPress = useCallback(() => {
    clear();
  }, []);

  // Soft visual + haptic nudge when captions change while panel is open (Deaf parents).
  useEffect(() => {
    if (!open) return;
    const prev = prevCaptionsRef.current;
    const changed =
      (naomiCaption && naomiCaption !== prev.naomi) ||
      (luceCaption && luceCaption !== prev.luce);
    prevCaptionsRef.current = { naomi: naomiCaption, luce: luceCaption };
    if (!changed) return;
    vibrateSoft();
    setPulse(true);
    const t = window.setTimeout(() => setPulse(false), 700);
    return () => window.clearTimeout(t);
  }, [open, naomiCaption, luceCaption, vibrateSoft]);

  useEffect(() => {
    if (!open || !pulse) return;
    const t = window.setTimeout(() => setPulse(false), 700);
    return () => window.clearTimeout(t);
  }, [open, pulse]);

  if (!open) {
    return (
      <button
        type="button"
        className="parent-mark"
        aria-label="Parent"
        onPointerDown={beginPress}
        onPointerUp={endPress}
        onPointerLeave={endPress}
        onPointerCancel={endPress}
        onContextMenu={(e) => e.preventDefault()}
      >
        ·
      </button>
    );
  }

  const label = parentStatusLabel(status, sessionActive);
  const micNote = parentMicNote(micModeFromStatus(status, sttSupported));

  return (
    <div
      className={`parent-panel${pulse ? ' parent-panel--pulse' : ''}`}
      role="dialog"
      aria-label="Parent corner"
    >
      <div className="parent-panel-inner">
        <header className="parent-panel-header">
          <h2>Parent</h2>
          <button type="button" className="parent-close" onClick={() => setOpen(false)}>
            Close
          </button>
        </header>
        <p className="parent-note">
          Visual only — no sound. Large captions follow Naomi and Luce. Vibrate on open
          and when lines change.
        </p>
        {micNote && (
          <p className="parent-mic-note" role="status">
            {micNote}
          </p>
        )}
        <div className="parent-status-block" role="status" aria-live="polite">
          <span className="parent-status-label">Status</span>
          <p className="parent-status-value">{label}</p>
          <p className="parent-session-flag">
            Session: <strong>{sessionActive ? 'ACTIVE' : 'idle'}</strong>
          </p>
        </div>
        <div className="parent-captions" aria-live="polite">
          <p className="parent-caption-line">
            <span className="parent-who">Naomi</span>
            <span className="parent-caption-text">{naomiCaption || '—'}</span>
          </p>
          <p className="parent-caption-line">
            <span className="parent-who">Luce</span>
            <span className="parent-caption-text">{luceCaption || '—'}</span>
          </p>
        </div>
        <button
          type="button"
          className="parent-hangup"
          disabled={!sessionActive}
          onClick={() => {
            if (!sessionActive) return;
            onHangUp();
            vibrateSoft();
            setOpen(false);
          }}
        >
          Hang up — end session
        </button>
      </div>
    </div>
  );
}
