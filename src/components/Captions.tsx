type Props = {
  naomi: string;
  luce: string;
};

/**
 * Dual captions every turn — Deaf parents follow on screen.
 * High-contrast labels + large type; Naomi vs Luce clearly distinct.
 * Empty rows show readable placeholders (never blank text beside the who pill).
 */
export function Captions({ naomi, luce }: Props) {
  const naomiText = naomi.trim() ? naomi : 'Waiting for Naomi…';
  const luceText = luce.trim() ? luce : 'Waiting for Luce…';

  return (
    <div
      className="captions"
      aria-live="polite"
      aria-atomic="true"
      aria-label="Captions"
    >
      <p className="caption caption--naomi">
        <span className="who">Naomi</span>
        <span className="caption-text">{naomiText}</span>
      </p>
      <p className="caption caption--luce">
        <span className="who">Luce</span>
        <span className="caption-text">{luceText}</span>
      </p>
    </div>
  );
}
