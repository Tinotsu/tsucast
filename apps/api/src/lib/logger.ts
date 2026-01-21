/**
 * Structured Logger
 *
 * Pino-based logger with sensitive data redaction.
 * Story: 6-1 Error Handling & User Feedback (AC8)
 */

import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  // Redact sensitive data from logs
  redact: {
    paths: [
      // Headers
      'req.headers.authorization',
      '*.authorization',
      // Tokens
      'token',
      '*.token',
      'access_token',
      '*.access_token',
      'refresh_token',
      '*.refresh_token',
      // Passwords and secrets
      'password',
      '*.password',
      'secret',
      '*.secret',
      'api_key',
      '*.api_key',
      'apiKey',
      '*.apiKey',
    ],
    remove: true,
  },
  transport:
    process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
          },
        }
      : undefined,
});
