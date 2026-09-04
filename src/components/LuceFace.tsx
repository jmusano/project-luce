type Props = {
  status: 'tap' | 'listening' | 'talking' | 'unsupported';
  onTap: () => void;
};

/** Soft large Luce face — preschool-teacher energy. Whole face is the talk control. */
export function LuceFace({ status, onTap }: Props) {
  const listening = status === 'listening';
  const talking = status === 'talking';

  return (
    <button
      type="button"
      className={`luce-face ${listening ? 'is-listening' : ''} ${talking ? 'is-talking' : ''}`}
      onClick={onTap}
      aria-label={status === 'tap' ? 'Tap to talk with Luce' : 'Luce'}
    >
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
        {/* soft hair */}
        <ellipse cx="100" cy="88" rx="78" ry="82" fill="#6b8f71" />
        <ellipse cx="100" cy="100" rx="70" ry="72" fill="url(#skin)" />
        {/* cheeks */}
        <ellipse cx="58" cy="115" rx="16" ry="10" fill="url(#cheek)" />
        <ellipse cx="142" cy="115" rx="16" ry="10" fill="url(#cheek)" />
        {/* eyes */}
        <ellipse cx="72" cy="95" rx="8" ry={talking ? 9 : 10} fill="#3d4a3f" />
        <ellipse cx="128" cy="95" rx="8" ry={talking ? 9 : 10} fill="#3d4a3f" />
        <circle cx="74" cy="92" r="2.5" fill="#fff" opacity="0.85" />
        <circle cx="130" cy="92" r="2.5" fill="#fff" opacity="0.85" />
        {/* smile */}
        <path
          d={
            talking
              ? 'M70 128 Q100 158 130 128'
              : listening
                ? 'M74 130 Q100 148 126 130'
                : 'M76 128 Q100 145 124 128'
          }
          fill="none"
          stroke="#c4785a"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* listening ring */}
        {listening && (
          <circle
            cx="100"
            cy="100"
            r="88"
            fill="none"
            stroke="#8fbc8f"
            strokeWidth="3"
            opacity="0.55"
            className="listen-ring"
          />
        )}
      </svg>
      <span className="luce-wordmark">Luce</span>
    </button>
  );
}
