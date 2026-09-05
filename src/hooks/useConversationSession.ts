import { useCallback, useEffect, useRef, useState } from 'react';
import { createWebSpeechStt } from '../lib/stt';
import { createWebSpeechTts } from '../lib/tts';
import { isHangupPhrase, nextTurn, type Topic } from '../lib/mind';
import type { PictureChoice } from '../lib/allergyFilter';
import { acquireScreenWakeLock, type WakeLockHandle } from '../lib/wakeLock';
import {
  classifySpeechError,
  type MicMode,
  type UiStatus,
} from '../lib/micFallback';

export type { UiStatus } from '../lib/micFallback';

const POST_TTS_MS = 400;
const QUIET_HANGUP_MS = 2 * 60 * 1000;

export function useConversationSession() {
  const sttRef = useRef(createWebSpeechStt());
  const ttsRef = useRef(createWebSpeechTts());
  const turnIndexRef = useRef(0);
  const greetedRef = useRef(false);
  const topicRef = useRef<Topic | null>(null);
  const sessionActiveRef = useRef(false);
  const speakingRef = useRef(false);
  const quietTimerRef = useRef<number | null>(null);
  const listenTimerRef = useRef<number | null>(null);
  const interimRef = useRef('');
  const wakeLockRef = useRef<WakeLockHandle | null>(null);
  const micDeniedRef = useRef(false);

  const [status, setStatus] = useState<UiStatus>('tap');
  const [naomiCaption, setNaomiCaption] = useState('');
  const [luceCaption, setLuceCaption] = useState('');
  const [choices, setChoices] = useState<[PictureChoice, PictureChoice] | null>(null);
  const [sessionActive, setSessionActive] = useState(false);

  const clearQuietTimer = () => {
    if (quietTimerRef.current != null) {
      window.clearTimeout(quietTimerRef.current);
      quietTimerRef.current = null;
    }
  };

  const clearListenTimer = () => {
    if (listenTimerRef.current != null) {
      window.clearTimeout(listenTimerRef.current);
      listenTimerRef.current = null;
    }
  };

  const releaseWakeLock = () => {
    const handle = wakeLockRef.current;
    wakeLockRef.current = null;
    if (handle) void handle.release();
  };

  const hangUp = useCallback(() => {
    sessionActiveRef.current = false;
    setSessionActive(false);
    speakingRef.current = false;
    micDeniedRef.current = false;
    clearQuietTimer();
    clearListenTimer();
    releaseWakeLock();
    sttRef.current.abort();
    ttsRef.current.cancel();
    setStatus('tap');
    setChoices(null);
    turnIndexRef.current = 0;
    greetedRef.current = false;
    topicRef.current = null;
  }, []);

  // Mutable callback bag so listen/speak can call each other without stale closures
  const api = useRef({
    armQuietHangup: () => {},
    listenAgain: () => {},
    speakTurn: (_speech: string, _luce: string, _naomi: string | undefined, _choices: [PictureChoice, PictureChoice]) => {},
    handleKidUtterance: (_text: string) => {},
  });

  api.current.armQuietHangup = () => {
    clearQuietTimer();
    if (!sessionActiveRef.current) return;
    quietTimerRef.current = window.setTimeout(() => hangUp(), QUIET_HANGUP_MS);
  };

  api.current.speakTurn = (speech, luce, naomi, two) => {
    if (!sessionActiveRef.current) return;
    sttRef.current.abort();
    speakingRef.current = true;
    setStatus('talking');
    setLuceCaption(luce);
    if (naomi) setNaomiCaption(naomi);
    setChoices(two);
    clearQuietTimer();

    const afterSpeak = () => {
      speakingRef.current = false;
      if (!sessionActiveRef.current) return;
      api.current.armQuietHangup();
      listenTimerRef.current = window.setTimeout(() => {
        if (sessionActiveRef.current && !speakingRef.current) api.current.listenAgain();
      }, POST_TTS_MS);
    };

    ttsRef.current.speak(speech, {
      onStatus: (s) => {
        if (s === 'speaking') setStatus('talking');
      },
      onEnd: afterSpeak,
      onError: afterSpeak,
    });
  };

  api.current.handleKidUtterance = (text: string) => {
    if (!sessionActiveRef.current) return;
    sttRef.current.abort();
    setNaomiCaption(text);

    if (isHangupPhrase(text)) {
      const turn = nextTurn({
        naomiSaid: text,
        turnIndex: turnIndexRef.current,
        greeted: greetedRef.current,
        topic: topicRef.current,
      });
      if (turn.topic !== undefined) topicRef.current = turn.topic ?? null;
      api.current.speakTurn(
        turn.speech,
        turn.captions.luce,
        turn.captions.naomi,
        turn.twoPictureChoices,
      );
      window.setTimeout(() => hangUp(), 3500);
      return;
    }

    const turn = nextTurn({
      naomiSaid: text,
      turnIndex: turnIndexRef.current,
      greeted: greetedRef.current,
      topic: topicRef.current,
    });
    if (turn.topic !== undefined) topicRef.current = turn.topic ?? null;
    greetedRef.current = true;
    turnIndexRef.current += 1;
    api.current.speakTurn(
      turn.speech,
      turn.captions.luce,
      turn.captions.naomi,
      turn.twoPictureChoices,
    );
  };

  api.current.listenAgain = () => {
    if (!sessionActiveRef.current) return;
    if (speakingRef.current) return;

    // Calm fallback: pictures stay the path forward — no scary errors, no mic loops.
    if (!sttRef.current.supported) {
      setStatus('unsupported');
      api.current.armQuietHangup();
      return;
    }
    if (micDeniedRef.current) {
      setStatus('denied');
      api.current.armQuietHangup();
      return;
    }

    clearListenTimer();
    sttRef.current.abort();
    interimRef.current = '';

    sttRef.current.start({
      onStatus: (s) => {
        if (!sessionActiveRef.current) return;
        if (s === 'listening') setStatus('listening');
        if (s === 'unsupported') {
          setStatus('unsupported');
        }
        if (s === 'denied') {
          micDeniedRef.current = true;
          setStatus('denied');
        }
      },
      onResult: ({ transcript, isFinal }) => {
        if (!sessionActiveRef.current) return;
        interimRef.current = transcript;
        if (transcript) setNaomiCaption(transcript);
        if (isFinal && transcript) {
          clearQuietTimer();
          api.current.handleKidUtterance(transcript);
        }
      },
      onEnd: () => {
        if (!sessionActiveRef.current || speakingRef.current) return;
        if (micDeniedRef.current) {
          setStatus('denied');
          api.current.armQuietHangup();
          return;
        }
        const t = interimRef.current.trim();
        if (t) {
          api.current.handleKidUtterance(t);
          return;
        }
        api.current.armQuietHangup();
        listenTimerRef.current = window.setTimeout(() => {
          if (sessionActiveRef.current && !speakingRef.current) api.current.listenAgain();
        }, 300);
      },
      onError: (message) => {
        if (!sessionActiveRef.current || speakingRef.current) return;
        const kind = classifySpeechError(message);
        if (kind === 'denied' || message === 'unsupported') {
          if (kind === 'denied') micDeniedRef.current = true;
          setStatus(message === 'unsupported' ? 'unsupported' : 'denied');
          api.current.armQuietHangup();
          return;
        }
        // Transient errors: soft retry without alarming the kid UI.
        api.current.armQuietHangup();
        listenTimerRef.current = window.setTimeout(() => {
          if (sessionActiveRef.current && !speakingRef.current) api.current.listenAgain();
        }, 600);
      },
    });
  };

  const startSession = useCallback(() => {
    if (sessionActiveRef.current) return;
    sessionActiveRef.current = true;
    setSessionActive(true);
    turnIndexRef.current = 0;
    greetedRef.current = false;
    topicRef.current = null;
    micDeniedRef.current = false;
    setNaomiCaption('');
    setChoices(null);
    clearQuietTimer();
    clearListenTimer();
    ttsRef.current.cancel();
    sttRef.current.abort();

    // Keep iPad awake for the sitting; no-op if unsupported
    releaseWakeLock();
    void acquireScreenWakeLock(() => sessionActiveRef.current).then((handle) => {
      if (!sessionActiveRef.current) {
        void handle.release();
        return;
      }
      wakeLockRef.current = handle;
    });

    const turn = nextTurn({ turnIndex: 0, greeted: false, topic: null });
    if (turn.topic !== undefined) topicRef.current = turn.topic ?? null;
    greetedRef.current = true;
    turnIndexRef.current = 1;
    api.current.speakTurn(
      turn.speech,
      turn.captions.luce,
      turn.captions.naomi,
      turn.twoPictureChoices,
    );
  }, []);

  const onPictureTap = useCallback(
    (choice: PictureChoice) => {
      if (!sessionActiveRef.current) {
        startSession();
        return;
      }
      if (speakingRef.current) return;
      sttRef.current.abort();
      clearQuietTimer();
      setNaomiCaption(choice.label);

      const turn = nextTurn({
        naomiSaid: choice.label,
        pictureId: choice.id,
        turnIndex: turnIndexRef.current,
        greeted: greetedRef.current,
        topic: topicRef.current,
      });
      if (turn.topic !== undefined) topicRef.current = turn.topic ?? null;
      greetedRef.current = true;
      turnIndexRef.current += 1;
      api.current.speakTurn(
        turn.speech,
        turn.captions.luce,
        turn.captions.naomi,
        turn.twoPictureChoices,
      );
    },
    [startSession],
  );

  useEffect(() => {
    return () => {
      clearQuietTimer();
      clearListenTimer();
      releaseWakeLock();
      sttRef.current.abort();
      ttsRef.current.cancel();
    };
  }, []);

  const sttSupported = sttRef.current.supported;
  let displayStatus: UiStatus = status;
  if (sessionActive && status !== 'talking' && status !== 'tap') {
    if (!sttSupported) displayStatus = 'unsupported';
    else if (micDeniedRef.current && status !== 'listening') displayStatus = 'denied';
  }

  const micMode: MicMode =
    displayStatus === 'denied'
      ? 'denied'
      : !sttSupported || displayStatus === 'unsupported'
        ? 'unsupported'
        : 'ok';

  return {
    status: displayStatus,
    naomiCaption,
    luceCaption,
    choices,
    sessionActive,
    sttSupported,
    micMode,
    ttsSupported: ttsRef.current.supported,
    startSession,
    hangUp,
    onPictureTap,
  };
}
