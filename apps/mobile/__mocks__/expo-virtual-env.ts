/**
 * Manual mock for expo/virtual/env
 *
 * babel-preset-expo transforms `process.env.EXPO_PUBLIC_*` to
 * `require('expo/virtual/env').env.EXPO_PUBLIC_*`. In Jest's node
 * environment, the real ESM file can't be parsed. This mock provides
 * a plain object wrapping process.env so transformed code still works.
 */

export const env = process.env;
