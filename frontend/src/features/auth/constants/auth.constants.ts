export const AUTH_CONSTANTS = {
  MIN_PASSWORD_LENGTH: 10,
  MAX_PASSWORD_LENGTH: 72,
  OTP_LENGTH: 6,
  ERRORS: {
    INVALID_CREDENTIALS: 'Invalid email or password',
    ACCOUNT_LOCKED: 'Account locked, try again in 15 minutes.',
    PASSWORD_TOO_SHORT: 'Password must be 10 to 72 characters and different from your email',
    PASSWORDS_DONT_MATCH: 'Passwords do not match',
    INVALID_EMAIL: 'Enter a valid email address',
  },
} as const;
