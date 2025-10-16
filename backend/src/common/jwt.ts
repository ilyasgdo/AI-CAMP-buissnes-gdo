import { sign, verify, type SignOptions, type Secret } from 'jsonwebtoken';

const DEFAULT_EXPIRY_SECONDS = 60 * 60 * 24 * 7; // 7 days

export function jwtSecret(): Secret {
  const secret = process.env.JWT_SECRET?.trim();
  return secret && secret.length > 0 ? secret : 'dev_secret_change_me';
}

export function signToken(payload: { sub: string; email?: string }, options?: Pick<SignOptions, 'expiresIn'>): string {
  const opts: SignOptions = { expiresIn: options?.expiresIn ?? DEFAULT_EXPIRY_SECONDS };
  return sign(payload, jwtSecret(), opts);
}

export function verifyToken<T extends object = any>(token: string): T | null {
  try {
    return verify(token, jwtSecret()) as T;
  } catch (_) {
    return null;
  }
}