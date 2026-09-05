import { kidSafeStatusText, type UiStatus } from '../lib/micFallback';

type Props = {
  status: UiStatus;
  sttSupported: boolean;
};

export function StatusLine({ status, sttSupported }: Props) {
  const text = kidSafeStatusText(status, sttSupported);

  return (
    <p className="status-line" role="status" aria-live="polite">
      {text}
    </p>
  );
}
