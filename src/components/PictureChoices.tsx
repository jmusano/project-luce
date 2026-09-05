import {
  filterPictureChoices,
  type PictureChoice,
} from '../lib/allergyFilter';

type Props = {
  choices: [PictureChoice, PictureChoice] | null;
  disabled?: boolean;
  onChoose: (choice: PictureChoice) => void;
};

/** Keep picture labels short enough for huge 3yo buttons on iPad. */
export function shortPictureLabel(label: string, max = 14): string {
  const t = label.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(1, max - 1)).trimEnd()}…`;
}

/**
 * Exactly two huge picture choices — sized for 3yo fingers / iPad landscape.
 * Defense-in-depth: always allergyFilter labels/emoji before show so nut food
 * never renders even if a beat forgot to scrub.
 */
export function PictureChoices({ choices, disabled, onChoose }: Props) {
  if (!choices) {
    return <div className="picture-choices picture-choices--empty" aria-hidden="true" />;
  }

  const safe = filterPictureChoices([...choices]);
  const two = (
    safe.length >= 2
      ? safe.slice(0, 2)
      : [
          { id: 'safe-a', emoji: '🌸', label: 'flower' },
          { id: 'safe-b', emoji: '☁️', label: 'cloud' },
        ]
  ) as [PictureChoice, PictureChoice];

  return (
    <div className="picture-choices" role="group" aria-label="Picture choices">
      {two.map((c) => {
        const label = shortPictureLabel(c.label);
        return (
          <button
            key={c.id}
            type="button"
            className="picture-choice"
            disabled={disabled}
            aria-label={c.label}
            onClick={() => onChoose(c)}
          >
            <span className="picture-emoji" aria-hidden="true">
              {c.emoji}
            </span>
            <span className="picture-label">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
