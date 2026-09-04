/**
 * Web Speech API TTS wrapper.
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

function pickVoice(voices: SpeechSynthesisVoice[], hints: string[]): SpeechSynthesisVoice | null {
  const lowerHints = hints.map((h) => h.toLowerCase());
  const preferred = voices.find((v) =>
    lowerHints.some((h) => v.name.toLowerCase().includes(h) || v.lang.toLowerCase().startsWith('en')),
  );
  return preferred ?? voices.find((v) => v.lang.toLowerCase().startsWith('en')) ?? voices[0] ?? null;
}

export function createWebSpeechTts(options: TtsOptions = {}): TextToSpeech {
  const lang = options.lang ?? 'en-US';
  const rate = options.rate ?? 0.92;
  const pitch = options.pitch ?? 1.05;
  const hints = options.voiceNameIncludes ?? ['Samantha', 'Karen', 'Google US English', 'Female'];

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
      const voice = pickVoice(ensureVoices(), hints);
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
