import {
  filterPictureChoices,
  type PictureChoice,
} from '../lib/allergyFilter';

type Props = {
  choices: [PictureChoice, PictureChoice] | null;
  disabled?: boolean;
  onChoose: (choice: PictureChoice) => void;
};

/** Exactly two huge picture choices — sized for 3yo fingers / iPad landscape.
 * Defense-in-depth: re-run allergy filter so nut food never renders. */
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
      {two.map((c) => (
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
          <span className="picture-label">{c.label}</span>
        </button>
      ))}
    </div>
  );
}
