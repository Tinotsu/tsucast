/**
 * Voice Tests
 *
 * Tests for voice constants and options.
 * Story: 3-1 Voice Selection & Preview
 */

import { VOICES, DEFAULT_VOICE_ID, getVoiceById } from '../../../constants/voices';

describe('voices', () => {
  describe('VOICES', () => {
    it('should have at least 4 voices', () => {
      expect(VOICES.length).toBeGreaterThanOrEqual(4);
    });

    it('should have required properties for each voice', () => {
      VOICES.forEach((voice) => {
        expect(voice.id).toBeTruthy();
        expect(voice.name).toBeTruthy();
        expect(voice.description).toBeTruthy();
        expect(['male', 'female', 'neutral']).toContain(voice.gender);
        expect(voice.style).toBeTruthy();
        expect(voice.previewUrl).toBeTruthy();
        expect(voice.kokoroVoiceId).toBeTruthy();
      });
    });

    it('should have unique IDs', () => {
      const ids = VOICES.map((v) => v.id);
      const uniqueIds = [...new Set(ids)];
      expect(ids.length).toBe(uniqueIds.length);
    });

    it('should have unique Kokoro voice IDs', () => {
      const kokoroIds = VOICES.map((v) => v.kokoroVoiceId);
      const uniqueKokoroIds = [...new Set(kokoroIds)];
      expect(kokoroIds.length).toBe(uniqueKokoroIds.length);
    });

    it('should have valid preview URLs', () => {
      VOICES.forEach((voice) => {
        expect(voice.previewUrl).toMatch(/^https?:\/\//);
      });
    });
  });

  describe('DEFAULT_VOICE_ID', () => {
    it('should be a valid voice ID', () => {
      const defaultVoice = VOICES.find((v) => v.id === DEFAULT_VOICE_ID);
      expect(defaultVoice).toBeDefined();
    });
  });

  describe('getVoiceById', () => {
    it('should return voice for valid ID', () => {
      const firstVoice = VOICES[0];
      const result = getVoiceById(firstVoice.id);
      expect(result).toEqual(firstVoice);
    });

    it('should return undefined for invalid ID', () => {
      const result = getVoiceById('non-existent-id');
      expect(result).toBeUndefined();
    });

    it('should return default voice when ID is default', () => {
      const result = getVoiceById(DEFAULT_VOICE_ID);
      expect(result).toBeDefined();
      expect(result?.id).toBe(DEFAULT_VOICE_ID);
    });
  });
});
