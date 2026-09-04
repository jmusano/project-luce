type Props = {
  status: 'tap' | 'listening' | 'talking' | 'unsupported';
  sttSupported: boolean;
};

export function StatusLine({ status, sttSupported }: Props) {
  let text = 'Tap to talk';
  if (!sttSupported && status !== 'talking') {
    text = 'Tap pictures to talk (mic unavailable)';
  } else if (status === 'listening') {
    text = 'Listening';
  } else if (status === 'talking') {
    text = 'Luce is talking';
  } else if (status === 'unsupported') {
    text = 'Tap pictures to talk (mic unavailable)';
  }

  return (
    <p className="status-line" role="status" aria-live="polite">
      {text}
    </p>
  );
}
