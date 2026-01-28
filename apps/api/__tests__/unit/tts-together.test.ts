/**
 * Together.ai TTS Service Tests
 *
 * Tests for src/services/tts-together.ts
 * Story: Streaming Audio Generation (HLS + Together.ai)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isTogetherConfigured, generateSpeechTogether } from '../../src/services/tts-together.js';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('tts-together', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('isTogetherConfigured', () => {
    it('returns false when TOGETHER_API_KEY is not set', () => {
      delete process.env.TOGETHER_API_KEY;
      expect(isTogetherConfigured()).toBe(false);
    });

    it('returns true when TOGETHER_API_KEY is set', () => {
      process.env.TOGETHER_API_KEY = 'test-key';
      expect(isTogetherConfigured()).toBe(true);
    });
  });

  describe('generateSpeechTogether', () => {
    it('throws error when API key is not configured', async () => {
      delete process.env.TOGETHER_API_KEY;

      await expect(
        generateSpeechTogether({ text: 'Hello', voiceId: 'default' })
      ).rejects.toThrow('TTS_FAILED');
    });

    it('calls Together.ai API with correct parameters', async () => {
      process.env.TOGETHER_API_KEY = 'test-key';

      // Create mock audio data
      const mockAudioData = new Uint8Array(16000); // 1 second at 128kbps
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => mockAudioData.buffer,
      });

      await generateSpeechTogether({ text: 'Hello world', voiceId: 'default' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];

      expect(url).toBe('https://api.together.xyz/v1/audio/speech');
      expect(options.method).toBe('POST');
      expect(options.headers['Authorization']).toBe('Bearer test-key');
      expect(options.headers['Content-Type']).toBe('application/json');

      const body = JSON.parse(options.body);
      expect(body.model).toBe('hexgrad/Kokoro-82M');
      expect(body.input).toBe('Hello world');
      expect(body.voice).toBe('af_alloy'); // default voice
      expect(body.response_format).toBe('mp3');
    });

    it('maps voice IDs correctly', async () => {
      process.env.TOGETHER_API_KEY = 'test-key';

      const mockAudioData = new Uint8Array(16000);
      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: async () => mockAudioData.buffer,
      });

      // Test different voice mappings
      await generateSpeechTogether({ text: 'Test', voiceId: 'am_adam' });
      let body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.voice).toBe('am_adam');

      await generateSpeechTogether({ text: 'Test', voiceId: 'unknown' });
      body = JSON.parse(mockFetch.mock.calls[1][1].body);
      expect(body.voice).toBe('af_alloy'); // Falls back to default
    });

    it('returns audio buffer and estimated duration', async () => {
      process.env.TOGETHER_API_KEY = 'test-key';

      // 32KB = ~2 seconds at 128kbps (32000 / 16000)
      const mockAudioData = new Uint8Array(32000);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => mockAudioData.buffer,
      });

      const result = await generateSpeechTogether({
        text: 'Hello world',
        voiceId: 'default',
      });

      expect(result.audioBuffer).toBeInstanceOf(Buffer);
      expect(result.audioBuffer.length).toBe(32000);
      expect(result.durationSeconds).toBe(2); // 32000 / 16000 = 2
    });

    it('throws TTS_FAILED on API error', async () => {
      process.env.TOGETHER_API_KEY = 'test-key';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server error',
      });

      await expect(
        generateSpeechTogether({ text: 'Hello', voiceId: 'default' })
      ).rejects.toThrow('TTS_FAILED');
    });

    it('throws TIMEOUT on abort', async () => {
      process.env.TOGETHER_API_KEY = 'test-key';

      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(abortError);

      await expect(
        generateSpeechTogether({ text: 'Hello', voiceId: 'default' })
      ).rejects.toThrow('TIMEOUT');
    });

    it('respects external abort signal', async () => {
      process.env.TOGETHER_API_KEY = 'test-key';

      const controller = new AbortController();

      // Simulate immediate abort
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(abortError);

      const promise = generateSpeechTogether({
        text: 'Hello',
        voiceId: 'default',
        signal: controller.signal,
      });

      await expect(promise).rejects.toThrow('TIMEOUT');
    });

    it('ensures minimum duration of 1 second', async () => {
      process.env.TOGETHER_API_KEY = 'test-key';

      // Very small audio (less than 16KB)
      const mockAudioData = new Uint8Array(1000);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => mockAudioData.buffer,
      });

      const result = await generateSpeechTogether({
        text: 'Hi',
        voiceId: 'default',
      });

      expect(result.durationSeconds).toBe(1); // Minimum duration
    });
  });
});
