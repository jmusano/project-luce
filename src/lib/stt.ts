/**
 * Web Speech API STT wrapper.
 * Clean interface so Mini / cloud STT can swap in later.
 */

export type SttStatus = 'idle' | 'listening' | 'unsupported' | 'error';

export type SttResult = {
  transcript: string;
  isFinal: boolean;
};

export type SttHandlers = {
  onResult?: (result: SttResult) => void;
  onStatus?: (status: SttStatus) => void;
  onError?: (message: string) => void;
  onEnd?: () => void;
};

export interface SpeechToText {
  readonly supported: boolean;
  start(handlers?: SttHandlers): void;
  stop(): void;
  abort(): void;
}

function getRecognitionCtor(): (new () => SpeechRecognition) | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

/**
 * Browser Web Speech recognition.
 * continuous=false + silence ends one utterance (~1.5s browser default).
 */
export function createWebSpeechStt(lang = 'en-US'): SpeechToText {
  const Ctor = getRecognitionCtor();
  let recognition: SpeechRecognition | null = null;
  let handlers: SttHandlers = {};
  let intentionalStop = false;

  return {
    get supported() {
      return Ctor != null;
    },

    start(nextHandlers: SttHandlers = {}) {
      handlers = nextHandlers;
      if (!Ctor) {
        handlers.onStatus?.('unsupported');
        handlers.onError?.('Speech recognition is not supported in this browser.');
        return;
      }
      intentionalStop = false;
      try {
        recognition?.abort();
      } catch {
        /* ignore */
      }
      recognition = new Ctor();
      recognition.lang = lang;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => handlers.onStatus?.('listening');
      recognition.onresult = (ev: SpeechRecognitionEvent) => {
        let transcript = '';
        let isFinal = false;
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          const r = ev.results[i];
          transcript += r[0]?.transcript ?? '';
          if (r.isFinal) isFinal = true;
        }
        handlers.onResult?.({ transcript: transcript.trim(), isFinal });
      };
      recognition.onerror = (ev: SpeechRecognitionErrorEvent) => {
        if (ev.error === 'aborted' || ev.error === 'no-speech') {
          handlers.onStatus?.('idle');
          return;
        }
        handlers.onStatus?.('error');
        handlers.onError?.(ev.error || 'recognition error');
      };
      recognition.onend = () => {
        handlers.onStatus?.('idle');
        if (!intentionalStop) handlers.onEnd?.();
      };

      try {
        recognition.start();
      } catch (e) {
        handlers.onStatus?.('error');
        handlers.onError?.(e instanceof Error ? e.message : 'failed to start');
      }
    },

    stop() {
      intentionalStop = true;
      try {
        recognition?.stop();
      } catch {
        /* ignore */
      }
    },

    abort() {
      intentionalStop = true;
      try {
        recognition?.abort();
      } catch {
        /* ignore */
      }
      handlers.onStatus?.('idle');
    },
  };
}
