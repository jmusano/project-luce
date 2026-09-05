import { describe, expect, it } from 'vitest';
import {
  classifySpeechError,
  kidSafeStatusText,
  micModeFromStatus,
  parentMicNote,
  parentStatusLabel,
} from './micFallback';

describe('classifySpeechError', () => {
  it('maps permission codes to denied', () => {
    expect(classifySpeechError('not-allowed')).toBe('denied');
    expect(classifySpeechError('service-not-allowed')).toBe('denied');
  });

  it('treats aborted and no-speech as benign', () => {
    expect(classifySpeechError('aborted')).toBe('benign');
    expect(classifySpeechError('no-speech')).toBe('benign');
  });

  it('treats other codes as error', () => {
    expect(classifySpeechError('network')).toBe('error');
    expect(classifySpeechError('audio-capture')).toBe('error');
  });
});

describe('kidSafeStatusText', () => {
  it('keeps clear listening / talking / tap states', () => {
    expect(kidSafeStatusText('listening', true)).toBe('Listening');
    expect(kidSafeStatusText('talking', true)).toBe('Luce is talking');
    expect(kidSafeStatusText('tap', true)).toBe('Tap to talk');
  });

  it('uses calm picture prompts for unsupported and denied', () => {
    expect(kidSafeStatusText('unsupported', false)).toMatch(/picture/i);
    expect(kidSafeStatusText('denied', true)).toMatch(/picture/i);
    expect(kidSafeStatusText('unsupported', false)).not.toMatch(/error|denied|permission/i);
    expect(kidSafeStatusText('denied', true)).not.toMatch(/error|denied|permission/i);
  });
});

describe('parent mic note + labels', () => {
  it('exposes visual mic notes without sound cues', () => {
    expect(parentMicNote('unsupported')).toMatch(/pictures/i);
    expect(parentMicNote('denied')).toMatch(/pictures/i);
    expect(parentMicNote('ok')).toBeNull();
  });

  it('labels parent status for unsupported vs denied', () => {
    expect(parentStatusLabel('unsupported', true)).toMatch(/unavailable/i);
    expect(parentStatusLabel('denied', true)).toMatch(/permission/i);
    expect(micModeFromStatus('denied', true)).toBe('denied');
    expect(micModeFromStatus('listening', false)).toBe('unsupported');
  });
});
