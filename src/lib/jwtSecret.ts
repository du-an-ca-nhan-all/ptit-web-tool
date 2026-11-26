const MIN_SECRET_LENGTH = 32;

const globalForJwt = globalThis as typeof globalThis & {
  __devEphemeralJwtSecret?: Uint8Array;
};

/**
 * Returns the JWT signing key from `process.env.JWT_SECRET`.
 * - In production: fails fast if missing or shorter than 32 characters (no hardcoded fallback).
 * - In development/test: generates an ephemeral per-process random key if unset and logs a warning.
 */
export function getJwtSecret(): Uint8Array {
  const envSecret = process.env.JWT_SECRET?.trim();
  if (envSecret && envSecret.length >= MIN_SECRET_LENGTH) {
    return new TextEncoder().encode(envSecret);
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[SEC-01] Missing or weak JWT_SECRET environment variable (must be at least 32 characters).'
    );
  }

  if (!globalForJwt.__devEphemeralJwtSecret) {
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    globalForJwt.__devEphemeralJwtSecret = randomBytes;
    console.warn(
      '[SEC-01] JWT_SECRET is not set in environment; using an ephemeral dev-only key. Set JWT_SECRET (>=32 chars) in .env.'
    );
  }

  return globalForJwt.__devEphemeralJwtSecret;
}
