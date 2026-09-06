import type { UiStatus } from '../lib/micFallback';

type Props = {
  status: UiStatus;
  onTap: () => void;
};

function faceMode(status: UiStatus): 'tap' | 'listening' | 'talking' | 'unsupported' {
  if (status === 'listening') return 'listening';
  if (status === 'talking') return 'talking';
  if (status === 'unsupported' || status === 'denied') return 'unsupported';
  return 'tap';
}

/** Original Luce portrait — whole face is the talk control. State via glow + rings. */
export function LuceFace({ status, onTap }: Props) {
  const mode = faceMode(status);
  const listening = mode === 'listening';
  const talking = mode === 'talking';
  const unsupported = mode === 'unsupported';
  const tap = mode === 'tap';

  const aria =
    tap
      ? 'Tap to talk with Luce'
      : unsupported
        ? 'Luce — pictures work great'
        : listening
          ? 'Luce is listening'
          : 'Luce is talking';

  return (
    <button
      type="button"
      className={`luce-face is-${mode}`}
      onClick={onTap}
      aria-label={aria}
    >
      <span className="luce-face-glow" aria-hidden="true" />
      <span className="luce-face-portrait-wrap" aria-hidden="true">
        {listening && (
          <svg viewBox="0 0 200 200" className="luce-listen-rings" aria-hidden="true">
            <circle
              cx="100"
              cy="100"
              r="94"
              fill="none"
              stroke="#8fbc8f"
              strokeWidth="3"
              className="listen-ring listen-ring--outer"
            />
            <circle
              cx="100"
              cy="100"
              r="86"
              fill="none"
              stroke="#a8c9a8"
              strokeWidth="2.5"
              className="listen-ring listen-ring--inner"
            />
          </svg>
        )}
        <img
          className="luce-face-portrait"
          src="/luce-portrait.webp"
          alt=""
          draggable={false}
          width={640}
          height={640}
        />
        {talking && <span className="luce-talk-pulse" aria-hidden="true" />}
      </span>
      <span className="luce-wordmark">Luce</span>
    </button>
  );
}
