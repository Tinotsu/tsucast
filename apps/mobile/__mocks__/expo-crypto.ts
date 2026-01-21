/**
 * Manual mock for expo-crypto
 *
 * This mock is automatically used by Jest when modules import 'expo-crypto'.
 * Uses a simple djb2 hash function to generate consistent hashes.
 */

// Simple hash function that returns different hashes for different inputs
const simpleHash = (str: string): string => {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  // Convert to hex and pad to 64 characters (SHA256 length)
  const hex = Math.abs(hash >>> 0).toString(16);
  // Create a 64-char hash by repeating and padding
  return hex.repeat(Math.ceil(64 / hex.length)).substring(0, 64);
};

export const digestStringAsync = jest.fn(
  (_algorithm: string, data: string): Promise<string> => {
    return Promise.resolve(simpleHash(data));
  }
);

export const CryptoDigestAlgorithm = {
  SHA256: 'SHA-256',
  SHA384: 'SHA-384',
  SHA512: 'SHA-512',
  MD5: 'MD5',
};
