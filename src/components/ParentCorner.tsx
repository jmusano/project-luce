import { useCallback, useRef, useState } from 'react';

type Props = {
  naomiCaption: string;
  luceCaption: string;
  status: string;
  sessionActive: boolean;
  onHangUp: () => void;
};

const LONG_PRESS_MS = 650;

/**
 * Hidden parent corner: long-press tiny mark.
 * Visual + captions + vibrate — NEVER sound. Both parents Deaf.
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
      if (navigator.vibrate) navigator.vibrate(30);
    } catch {
      /* ignore */
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
          Visual only — no sound. Captions follow Naomi and Luce.
        </p>
        <dl className="parent-meta">
          <div>
            <dt>Status</dt>
            <dd>{status}</dd>
          </div>
          <div>
            <dt>Session</dt>
            <dd>{sessionActive ? 'active' : 'idle'}</dd>
          </div>
        </dl>
        <div className="parent-captions">
          <p>
            <strong>Naomi:</strong> {naomiCaption || '—'}
          </p>
          <p>
            <strong>Luce:</strong> {luceCaption || '—'}
          </p>
        </div>
        {sessionActive && (
          <button
            type="button"
            className="parent-hangup"
            onClick={() => {
              onHangUp();
              vibrateSoft();
            }}
          >
            End session
          </button>
        )}
      </div>
    </div>
  );
}
