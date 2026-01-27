/**
 * Test Data Factories
 *
 * Factory functions for generating test data.
 * Uses randomized data for deterministic test isolation.
 */

let idCounter = 0;

/**
 * Generate a unique ID for test data
 */
function generateId(): string {
  return `test-${++idCounter}-${Date.now()}`;
}

/**
 * Generate a random email
 */
function generateEmail(): string {
  return `test-${generateId()}@example.com`;
}

/**
 * Library item factory
 */
export interface LibraryItemData {
  id: string;
  audio_id: string;
  title: string;
  url: string;
  duration: number;
  playback_position: number;
  is_played: boolean;
  created_at: string;
}

export function createLibraryItem(overrides: Partial<LibraryItemData> = {}): LibraryItemData {
  const id = generateId();
  return {
    id,
    audio_id: `audio-${id}`,
    title: `Test Article ${id}`,
    url: `https://example.com/article-${id}`,
    duration: 300 + Math.floor(Math.random() * 600),
    playback_position: 0,
    is_played: false,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createLibraryItems(count: number): LibraryItemData[] {
  return Array.from({ length: count }, () => createLibraryItem());
}

/**
 * User profile factory
 */
export interface UserProfileData {
  id: string;
  email: string;
  display_name: string | null;
  credits_balance: number;
  time_bank_minutes: number;
  is_admin: boolean;
  created_at: string;
}

export function createUserProfile(overrides: Partial<UserProfileData> = {}): UserProfileData {
  const id = generateId();
  return {
    id,
    email: generateEmail(),
    display_name: `Test User ${id}`,
    credits_balance: 0,
    time_bank_minutes: 0,
    is_admin: false,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createUserWithCredits(credits: number, overrides: Partial<UserProfileData> = {}): UserProfileData {
  return createUserProfile({
    credits_balance: credits,
    ...overrides,
  });
}

/**
 * Generate response factory
 */
export interface GenerateResponseData {
  audioId: string;
  audioUrl: string;
  title: string;
  duration: number;
  wordCount: number;
}

export function createGenerateResponse(overrides: Partial<GenerateResponseData> = {}): GenerateResponseData {
  const id = generateId();
  return {
    audioId: `audio-${id}`,
    audioUrl: `https://storage.example.com/audio/${id}.mp3`,
    title: `Generated Article ${id}`,
    duration: 300 + Math.floor(Math.random() * 600),
    wordCount: 1000 + Math.floor(Math.random() * 2000),
    ...overrides,
  };
}

/**
 * Cache check response factory
 */
export interface CacheCheckResponseData {
  cached: boolean;
  audioUrl?: string;
  audioId?: string;
  title?: string;
  duration?: number;
}

export function createCacheHit(overrides: Partial<CacheCheckResponseData> = {}): CacheCheckResponseData {
  const id = generateId();
  return {
    cached: true,
    audioUrl: `https://storage.example.com/audio/${id}.mp3`,
    audioId: `audio-${id}`,
    title: `Cached Article ${id}`,
    duration: 300,
    ...overrides,
  };
}

export function createCacheMiss(): CacheCheckResponseData {
  return { cached: false };
}

/**
 * Reset the ID counter (call between tests if needed)
 */
export function resetFactories(): void {
  idCounter = 0;
}
