/**
 * Free Content Tests
 *
 * Tests for:
 * 1. getFreeContent() API function — request construction and response handling
 * 2. useFreeContent() hook — React Query configuration
 */

import { getFreeContent } from '../../../services/api';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

describe('getFreeContent (API function)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch free content from /api/free-content endpoint', async () => {
    const mockItems = [
      {
        id: '1',
        title: 'Test Article',
        status: 'ready',
        audio_url: 'https://cdn.example.com/audio/1.mp3',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ items: mockItems }),
    });

    const result = await getFreeContent();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];

    // H2: Verify full URL construction
    expect(url).toBe(`${API_URL}/api/free-content`);

    // Should NOT include Authorization header (no auth required)
    expect(options?.headers?.Authorization).toBeUndefined();

    // Verify response shape
    expect(result).toHaveProperty('items');
    expect(result.items).toEqual(mockItems);
  });

  it('should return items array from response', async () => {
    const mockItems = [
      { id: '1', title: 'Article One', status: 'ready', audio_url: 'https://cdn.example.com/1.mp3' },
      { id: '2', title: 'Article Two', status: 'ready', audio_url: 'https://cdn.example.com/2.mp3' },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ items: mockItems }),
    });

    const result = await getFreeContent();
    expect(result.items).toHaveLength(2);
    expect(result.items[0].title).toBe('Article One');
  });

  it('should handle empty items array', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ items: [] }),
    });

    const result = await getFreeContent();
    expect(result.items).toEqual([]);
  });

  it('should throw on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    await expect(getFreeContent()).rejects.toThrow('Failed to fetch free content');
  });

  it('should throw on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(getFreeContent()).rejects.toThrow('Network error');
  });
});

describe('useFreeContent (hook configuration)', () => {
  it('should export useFreeContent as a function', () => {
    // H3: Verify the hook module exports correctly
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const hookModule = require('../../../hooks/useFreeContent');
    expect(hookModule).toHaveProperty('useFreeContent');
    expect(typeof hookModule.useFreeContent).toBe('function');
  });
});
