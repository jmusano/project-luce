/**
 * Hang-up phrase detection for preschool speech / STT noise.
 * Locked phrases: bye, bye-bye, goodbye, see you later, "I am going later",
 * plus kid variants: night-night, see ya, I gotta go.
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

export function isHangupPhrase(text: string): boolean {
  const normalized = normalizeHangupText(text);
  if (!normalized) return false;
  return HANGUP_PATTERNS.some((re) => re.test(normalized));
}
