/**
 * Unit Tests: TTS Service (Kokoro on RunPod)
 *
 * Tests request format, response parsing, voice validation, and error paths.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateSpeech } from "../../src/services/tts.js";

// Mock logger
vi.mock("../../src/lib/logger.js", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Helper: create a base64-encoded fake MP3 buffer of given byte size
function fakeAudioBase64(byteSize: number): string {
  return Buffer.alloc(byteSize, 0x41).toString("base64");
}

describe("TTS Service", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.KOKORO_API_URL = "https://api.runpod.ai/v2/test-endpoint";
    process.env.KOKORO_API_KEY = "test-api-key";
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("generateSpeech", () => {
    it("should send correct request body to RunPod /runsync", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            id: "job-1",
            status: "COMPLETED",
            output: { audio_base64: fakeAudioBase64(16000) },
            executionTime: 2.5,
          }),
      });
      vi.stubGlobal("fetch", mockFetch);

      await generateSpeech({ text: "Hello world", voiceId: "am_adam" });

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toBe(
        "https://api.runpod.ai/v2/test-endpoint/runsync"
      );
      expect(opts.method).toBe("POST");
      expect(opts.headers).toMatchObject({
        Authorization: "Bearer test-api-key",
        "Content-Type": "application/json",
      });

      const body = JSON.parse(opts.body);
      expect(body).toEqual({
        input: {
          text: "Hello world",
          voice_id: "am_adam",
          output_format: "mp3",
          mp3_bitrate: 64,
        },
      });
    });

    it("should map 'default' voice to am_adam", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            id: "job-2",
            status: "COMPLETED",
            output: { audio_base64: fakeAudioBase64(8000) },
          }),
      });
      vi.stubGlobal("fetch", mockFetch);

      await generateSpeech({ text: "Test", voiceId: "default" });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.input.voice_id).toBe("am_adam");
    });

    it("should reject invalid voice IDs", async () => {
      await expect(
        generateSpeech({ text: "Test", voiceId: "invalid_voice" })
      ).rejects.toThrow("TTS_FAILED");
    });

    it("should accept all valid Kokoro voice IDs", async () => {
      const validIds = ["am_adam", "af_sarah", "am_michael", "af_bella"];
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            id: "job-3",
            status: "COMPLETED",
            output: { audio_base64: fakeAudioBase64(8000) },
          }),
      });
      vi.stubGlobal("fetch", mockFetch);

      for (const voiceId of validIds) {
        await generateSpeech({ text: "Test", voiceId });
      }

      expect(mockFetch).toHaveBeenCalledTimes(validIds.length);
    });

    it("should return audioBuffer and durationSeconds", async () => {
      // 16000 bytes at 64kbps = 2 seconds (16000 / 8000)
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            id: "job-4",
            status: "COMPLETED",
            output: { audio_base64: fakeAudioBase64(16000) },
            executionTime: 1.0,
          }),
      });
      vi.stubGlobal("fetch", mockFetch);

      const result = await generateSpeech({
        text: "Hello",
        voiceId: "af_bella",
      });

      expect(result.audioBuffer).toBeInstanceOf(Buffer);
      expect(result.audioBuffer.length).toBe(16000);
      expect(result.durationSeconds).toBe(2); // Math.floor(16000/8000)
    });

    it("should throw TTS_FAILED when env vars are missing", async () => {
      delete process.env.KOKORO_API_URL;

      await expect(
        generateSpeech({ text: "Test", voiceId: "am_adam" })
      ).rejects.toThrow("TTS_FAILED");
    });

    it("should throw TTS_FAILED on non-ok HTTP response", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: () => Promise.resolve("RunPod error"),
      });
      vi.stubGlobal("fetch", mockFetch);

      await expect(
        generateSpeech({ text: "Test", voiceId: "am_adam" })
      ).rejects.toThrow("TTS_FAILED");
    });

    it("should throw TTS_FAILED when RunPod job status is FAILED", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            id: "job-fail",
            status: "FAILED",
            error: "Out of memory",
          }),
      });
      vi.stubGlobal("fetch", mockFetch);

      await expect(
        generateSpeech({ text: "Test", voiceId: "am_adam" })
      ).rejects.toThrow("TTS_FAILED");
    });

    it("should throw TTS_FAILED when response is missing audio_base64", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            id: "job-empty",
            status: "COMPLETED",
            output: {},
          }),
      });
      vi.stubGlobal("fetch", mockFetch);

      await expect(
        generateSpeech({ text: "Test", voiceId: "am_adam" })
      ).rejects.toThrow("TTS_FAILED");
    });

    it("should throw TIMEOUT on AbortError", async () => {
      const mockFetch = vi.fn().mockRejectedValue(
        Object.assign(new Error("The operation was aborted"), {
          name: "AbortError",
        })
      );
      vi.stubGlobal("fetch", mockFetch);

      await expect(
        generateSpeech({ text: "Test", voiceId: "am_adam" })
      ).rejects.toThrow("TIMEOUT");
    });
  });
});
