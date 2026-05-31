import { SignJWT, jwtVerify } from 'jose';

export interface SessionPayload {
  sub: 'admin';
  iat?: number;
  exp?: number;
}

function getSecret(): Uint8Array {
  const key = process.env.JWT_SECRET;
  if (!key) throw new Error('JWT_SECRET is not set');
  return new TextEncoder().encode(key);
}

export async function signToken(): Promise<string> {
  return new SignJWT({ sub: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ['HS256'] });
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
}
