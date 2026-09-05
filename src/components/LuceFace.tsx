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

/** Soft large Luce face — preschool-teacher energy. Whole face is the talk control. */
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
      <svg viewBox="0 0 200 200" className="luce-face-svg" aria-hidden="true">
        <defs>
          <radialGradient id="cheek" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f4c4a8" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#f4c4a8" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="skin" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ffe8d6" />
            <stop offset="100%" stopColor="#f0c9a8" />
          </radialGradient>
        </defs>

        {/* soft outer aura rings — listening */}
        {listening && (
          <>
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="#8fbc8f"
              strokeWidth="2.5"
              className="listen-ring listen-ring--outer"
            />
            <circle
              cx="100"
              cy="100"
              r="82"
              fill="none"
              stroke="#a8c9a8"
              strokeWidth="2"
              className="listen-ring listen-ring--inner"
            />
          </>
        )}

        {/* soft hair */}
        <ellipse cx="100" cy="88" rx="78" ry="82" fill="#6b8f71" />
        <ellipse cx="100" cy="100" rx="70" ry="72" fill="url(#skin)" />

        {/* cheeks — brighter when talking */}
        <ellipse
          cx="58"
          cy="115"
          rx={talking ? 18 : 16}
          ry={talking ? 12 : 10}
          fill="url(#cheek)"
          className="luce-cheek"
        />
        <ellipse
          cx="142"
          cy="115"
          rx={talking ? 18 : 16}
          ry={talking ? 12 : 10}
          fill="url(#cheek)"
          className="luce-cheek"
        />

        {/* eyes */}
        {unsupported ? (
          <>
            {/* soft happy squint — calm / pictures-first */}
            <path
              d="M64 96 Q72 102 80 96"
              fill="none"
              stroke="#3d4a3f"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M120 96 Q128 102 136 96"
              fill="none"
              stroke="#3d4a3f"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </>
        ) : (
          <>
            <ellipse
              cx="72"
              cy="95"
              rx={listening ? 9 : 8}
              ry={talking ? 8.5 : listening ? 11 : 10}
              fill="#3d4a3f"
              className="luce-eye"
            />
            <ellipse
              cx="128"
              cy="95"
              rx={listening ? 9 : 8}
              ry={talking ? 8.5 : listening ? 11 : 10}
              fill="#3d4a3f"
              className="luce-eye"
            />
            <circle cx="74" cy="92" r="2.5" fill="#fff" opacity="0.85" />
            <circle cx="130" cy="92" r="2.5" fill="#fff" opacity="0.85" />
          </>
        )}

        {/* smile / mouth */}
        {talking ? (
          <ellipse
            cx="100"
            cy="136"
            rx="16"
            ry="10"
            fill="#c4785a"
            opacity="0.85"
            className="luce-mouth"
          />
        ) : (
          <path
            d={
              listening
                ? 'M74 130 Q100 150 126 130'
                : unsupported
                  ? 'M78 130 Q100 142 122 130'
                  : 'M76 128 Q100 145 124 128'
            }
            fill="none"
            stroke="#c4785a"
            strokeWidth="4"
            strokeLinecap="round"
            className="luce-mouth"
          />
        )}
      </svg>
      <span className="luce-wordmark">Luce</span>
    </button>
  );
}
