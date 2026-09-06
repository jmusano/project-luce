/**
 * Hang-up phrase detection for preschool speech / STT noise.
 * Locked phrases: bye, bye-bye, goodbye, see you later, "I am going later",
 * plus kid variants: night-night, see ya, I gotta go.
 * Wake-continue: after farewell starts, "wake up" / "don't go" / "come back" /
 * "again" / "more" cancels hang-up and keeps playing.
 * Case-insensitive; tolerates punctuation, hyphens, and kid spacing.
 */

/** Normalize STT / kid speech for phrase matching. */
export function normalizeHangupText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[^a-z0-9'\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const HANGUP_PATTERNS: RegExp[] = [
  /\bbye[\s-]*bye\b/,
  /\bbyebye\b/,
  /\bgood[\s-]*bye\b/,
  /\bgoodbye\b/,
  /\bsee you later\b/,
  /\bsee ya(?:\s+later)?\b/,
  /\bnight[\s-]*night\b/,
  /\bnightnight\b/,
  /\bi\s+am\s+going\s+later\b/,
  /\bi'?m\s+going\s+later\b/,
  /\bim\s+going\s+later\b/,
  /\bi\s+gotta\s+go\b/,
  /\bi'?ve\s+gotta\s+go\b/,
  /\bi\s+got\s+to\s+go\b/,
  /\bi\s+have\s+(?:got\s+)?to\s+go\b/,
  /\bgotta\s+go\b/,
  // Lone "bye" after multi-word forms (does not match inside goodbye — already handled)
  /\bbye\b/,
];

/** Kid wants to keep playing after Luce started saying goodbye. */
const WAKE_CONTINUE_PATTERNS: RegExp[] = [
  /\bwake[\s-]*up\b/,
  /\bdon'?t\s+go\b/,
  /\bdo\s+not\s+go\b/,
  /\bcome\s+back\b/,
  /\bagain\s+soon\b/,
  /\bplay\s+again\b/,
  /\bone\s+more\b/,
  /\bmore(?:\s+(?:please|story|stories|play))?\b/,
  /\bnot\s+(?:yet|bye|goodbye)\b/,
  /\bstay\b/,
];

export function isHangupPhrase(text: string): boolean {
  const normalized = normalizeHangupText(text);
  if (!normalized) return false;
  // Wake-continue wins over hang-up if both somehow appear
  if (isWakeContinuePhrase(normalized)) return false;
  return HANGUP_PATTERNS.some((re) => re.test(normalized));
}

/**
 * After farewell begins, these cancel the hang-up timeout and resume play.
 * Pass already-normalized or raw kid/STT text.
 */
export function isWakeContinuePhrase(text: string): boolean {
  const normalized = normalizeHangupText(text);
  if (!normalized) return false;
  return WAKE_CONTINUE_PATTERNS.some((re) => re.test(normalized));
}
