import type { PictureChoice } from '../lib/allergyFilter';

type Props = {
  choices: [PictureChoice, PictureChoice] | null;
  disabled?: boolean;
  onChoose: (choice: PictureChoice) => void;
};

/** Exactly two huge picture choices side by side. */
export function PictureChoices({ choices, disabled, onChoose }: Props) {
  if (!choices) {
    return <div className="picture-choices picture-choices--empty" aria-hidden="true" />;
  }

  return (
    <div className="picture-choices">
      {choices.map((c) => (
        <button
          key={c.id}
          type="button"
          className="picture-choice"
          disabled={disabled}
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
