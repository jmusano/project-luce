import type { PictureChoice } from '../lib/allergyFilter';

type Props = {
  choices: [PictureChoice, PictureChoice] | null;
  disabled?: boolean;
  onChoose: (choice: PictureChoice) => void;
};

/** Exactly two huge picture choices — sized for 3yo fingers / iPad landscape. */
export function PictureChoices({ choices, disabled, onChoose }: Props) {
  if (!choices) {
    return <div className="picture-choices picture-choices--empty" aria-hidden="true" />;
  }

  return (
    <div className="picture-choices" role="group" aria-label="Picture choices">
      {choices.map((c) => (
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
