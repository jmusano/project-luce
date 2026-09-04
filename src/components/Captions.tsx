type Props = {
  naomi: string;
  luce: string;
};

/** Dual captions every turn — Deaf parents follow on screen. */
export function Captions({ naomi, luce }: Props) {
  return (
    <div className="captions" aria-live="polite">
      <p className="caption naomi">
        <span className="who">Naomi:</span> {naomi || '…'}
      </p>
      <p className="caption luce">
        <span className="who">Luce:</span> {luce || '…'}
      </p>
    </div>
  );
}
