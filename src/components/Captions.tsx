type Props = {
  naomi: string;
  luce: string;
};

/**
 * Dual captions every turn — Deaf parents follow on screen.
 * High-contrast labels + large type; Naomi vs Luce clearly distinct.
 */
export function Captions({ naomi, luce }: Props) {
  return (
    <div className="captions" aria-live="polite" aria-label="Captions">
      <p className="caption caption--naomi">
        <span className="who">Naomi</span>
        <span className="caption-text">{naomi || '…'}</span>
      </p>
      <p className="caption caption--luce">
        <span className="who">Luce</span>
        <span className="caption-text">{luce || '…'}</span>
      </p>
    </div>
  );
}
