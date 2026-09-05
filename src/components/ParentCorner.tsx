import { useCallback, useRef, useState } from 'react';

type Props = {
  naomiCaption: string;
  luceCaption: string;
  status: string;
  sessionActive: boolean;
  onHangUp: () => void;
};

const LONG_PRESS_MS = 650;

function statusLabel(status: string, sessionActive: boolean): string {
  if (!sessionActive && status === 'tap') return 'Idle — tap Luce to start';
  switch (status) {
    case 'listening':
      return 'Listening to Naomi';
    case 'talking':
      return 'Luce is talking';
    case 'unsupported':
      return 'Mic unavailable — use pictures';
    case 'tap':
      return sessionActive ? 'Ready' : 'Idle — tap Luce to start';
    default:
      return status;
  }
}

/**
 * Hidden parent corner: long-press tiny mark.
 * Visual + large captions + vibrate — NEVER sound. Both parents Deaf.
 */
export function ParentCorner({
  naomiCaption,
  luceCaption,
  status,
  sessionActive,
  onHangUp,
}: Props) {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<number | null>(null);

  const vibrateSoft = () => {
    try {
      if (navigator.vibrate) navigator.vibrate([40, 30, 40]);
    } catch {
      /* ignore — visual-only is enough */
    }
  };

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
      setOpen(true);
    }, LONG_PRESS_MS);
  }, []);

  const endPress = useCallback(() => {
    clear();
  }, []);

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

  const label = statusLabel(status, sessionActive);

  return (
    <div className="parent-panel" role="dialog" aria-label="Parent corner">
      <div className="parent-panel-inner">
        <header className="parent-panel-header">
          <h2>Parent</h2>
          <button type="button" className="parent-close" onClick={() => setOpen(false)}>
            Close
          </button>
        </header>
        <p className="parent-note">
          Visual only — no sound. Large captions follow Naomi and Luce.
        </p>
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
