import dotenv from 'dotenv';

dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';

// JWT_SECRET must come from the environment — no source-controlled
// fallback. A hardcoded default would mean anyone with a copy of this
// repository (i.e. everyone) could forge a valid OWNER token against
// any deployment that forgot to set this variable.
const jwtSecret = process.env.JWT_SECRET;
const KNOWN_PLACEHOLDER_VALUES = new Set([
  'replace-with-a-long-random-string',
  'dev-only-insecure-secret-change-me',
]);

if (!jwtSecret || jwtSecret.length < 32 || KNOWN_PLACEHOLDER_VALUES.has(jwtSecret)) {
  if (nodeEnv === 'production') {
    throw new Error(
      'JWT_SECRET is missing, too short, or still set to a placeholder value. ' +
        'Refusing to start in production — set a real, random secret (32+ characters).'
    );
  }
  console.warn(
    '\x1b[33m%s\x1b[0m',
    'WARNING: JWT_SECRET is missing/weak/placeholder. Using it anyway because ' +
      'NODE_ENV is not "production", but tokens signed with a weak secret can be ' +
      'forged. Set a strong JWT_SECRET in .env before deploying.'
  );
}

if (!process.env.DATABASE_URL && nodeEnv === 'production') {
  throw new Error('DATABASE_URL is required.');
}

export const env = {
  port: process.env.PORT || 5000,
  nodeEnv,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  jwtSecret: jwtSecret || 'dev-only-insecure-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
};
