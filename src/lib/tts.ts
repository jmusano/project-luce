/**
 * Web Speech API TTS wrapper.
 * Soft preschool-teacher storyteller defaults for Naomi (~3).
 * Clean interface so ElevenLabs / Mini voice can swap in later.
 */

export type TtsStatus = 'idle' | 'speaking' | 'unsupported' | 'error';

export type TtsHandlers = {
  onStatus?: (status: TtsStatus) => void;
  onEnd?: () => void;
  onError?: (message: string) => void;
};

export interface TextToSpeech {
  readonly supported: boolean;
  speak(text: string, handlers?: TtsHandlers): void;
  cancel(): void;
  isSpeaking(): boolean;
}

export type TtsOptions = {
  lang?: string;
  rate?: number;
  pitch?: number;
  /** Soft preschool-teacher preference hint */
  voiceNameIncludes?: string[];
};

/** Slightly slower than default — easier for a preschool listener to follow. */
export const SOFT_PRESCHOOL_RATE = 0.92;

/** Gentle lift — warm storyteller, not cartoonish. */
export const SOFT_PRESCHOOL_PITCH = 1.05;

/**
 * Warm female / soft en voice name fragments.
 * Ordered roughly by preference for iOS/iPad Safari (Samantha, Karen, …)
 * then common desktop voices.
 */
export const DEFAULT_SOFT_VOICE_HINTS: readonly string[] = [
  // iOS / iPadOS / macOS
  'Samantha',
  'Karen',
  'Moira',
  'Fiona',
  'Tessa',
  'Victoria',
  'Ava',
  'Allison',
  'Susan',
  'Zoe',
  'Serena',
  'Kate',
  // Android / Chrome
  'Google US English',
  'Google UK English Female',
  // Windows
  'Microsoft Zira',
  'Microsoft Aria',
  'Microsoft Jenny',
  // Generic fallbacks (last)
  'Female',
  'Woman',
];

type VoiceLike = {
  name: string;
  lang: string;
  localService?: boolean;
  default?: boolean;
};

function isEnglish(lang: string): boolean {
  return lang.toLowerCase().startsWith('en');
}

/**
 * Score a voice for soft preschool storytelling.
 * Higher is better. Non-English voices score very low.
 */
export function scoreSoftPreschoolVoice(
  voice: VoiceLike,
  hints: readonly string[] = DEFAULT_SOFT_VOICE_HINTS,
): number {
  const name = voice.name.toLowerCase();
  const lang = voice.lang.toLowerCase();
  if (!isEnglish(lang)) return -1000;

  let score = 10;

  // Prefer US/AU/GB variants commonly warm on Apple devices
  if (lang.startsWith('en-us')) score += 8;
  else if (lang.startsWith('en-au') || lang.startsWith('en-gb') || lang.startsWith('en-ie')) score += 5;
  else if (lang.startsWith('en')) score += 3;

  if (voice.localService) score += 4;
  if (voice.default) score += 1;

  const lowerHints = hints.map((h) => h.toLowerCase());
  for (let i = 0; i < lowerHints.length; i++) {
    const hint = lowerHints[i];
    if (name.includes(hint)) {
      // Hint order dominates lang/local tweaks (earlier = stronger)
      score += 500 - i * 10;
      break;
    }
  }

  // Mild demotion for clearly masculine-sounding system names
  const masculine = ['daniel', 'alex', 'fred', 'tom', 'david', 'mark', 'james', 'aaron', 'rishi', 'oliver'];
  if (masculine.some((m) => name.includes(m))) score -= 40;

  return score;
}

/**
 * Pick the best soft preschool voice from the available list.
 * Pure helper — unit-tested without SpeechSynthesis.
 */
export function pickVoice(
  voices: VoiceLike[],
  hints: readonly string[] = DEFAULT_SOFT_VOICE_HINTS,
): VoiceLike | null {
  if (!voices.length) return null;

  let best: VoiceLike | null = null;
  let bestScore = -Infinity;

  for (const voice of voices) {
    const s = scoreSoftPreschoolVoice(voice, hints);
    if (s > bestScore) {
      bestScore = s;
      best = voice;
    }
  }

  // If somehow nothing scored (empty?), fall back to first English then first voice
  if (!best || bestScore <= -1000) {
    return voices.find((v) => isEnglish(v.lang)) ?? voices[0] ?? null;
  }

  return best;
}

export function createWebSpeechTts(options: TtsOptions = {}): TextToSpeech {
  const lang = options.lang ?? 'en-US';
  const rate = options.rate ?? SOFT_PRESCHOOL_RATE;
  const pitch = options.pitch ?? SOFT_PRESCHOOL_PITCH;
  const hints = options.voiceNameIncludes ?? [...DEFAULT_SOFT_VOICE_HINTS];

  let speaking = false;

  const ensureVoices = (): SpeechSynthesisVoice[] => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return [];
    return window.speechSynthesis.getVoices();
  };

  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => {
      ensureVoices();
    };
  }

  return {
    get supported() {
      return typeof window !== 'undefined' && !!window.speechSynthesis;
    },

    speak(text: string, handlers: TtsHandlers = {}) {
      if (!this.supported) {
        handlers.onStatus?.('unsupported');
        handlers.onError?.('Speech synthesis is not supported.');
        // Still signal end so session loop can continue with captions-only.
        handlers.onEnd?.();
        return;
      }
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang;
      utter.rate = rate;
      utter.pitch = pitch;
      const voice = pickVoice(ensureVoices(), hints) as SpeechSynthesisVoice | null;
      if (voice) utter.voice = voice;

      utter.onstart = () => {
        speaking = true;
        handlers.onStatus?.('speaking');
      };
      utter.onend = () => {
        speaking = false;
        handlers.onStatus?.('idle');
        handlers.onEnd?.();
      };
      utter.onerror = () => {
        speaking = false;
        handlers.onStatus?.('error');
        handlers.onError?.('tts error');
        handlers.onEnd?.();
      };

      speaking = true;
      handlers.onStatus?.('speaking');
      window.speechSynthesis.speak(utter);
    },

    cancel() {
      speaking = false;
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    },

    isSpeaking() {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        return speaking || window.speechSynthesis.speaking;
      }
      return speaking;
    },
  };
}
