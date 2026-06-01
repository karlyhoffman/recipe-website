import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { ipAddress } from '@vercel/functions';
import bcrypt from 'bcryptjs';
import { signToken, getCookieOptions } from '@/lib/session';
import { isRateLimited, recordFailedAttempt, clearAttempts } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, returnUrl } = body as {
      username?: string;
      password?: string;
      returnUrl?: string;
    };

    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
      return Response.json({ error: 'Username and password are required.' }, { status: 400 });
    }

    const ip = ipAddress(request) ?? '127.0.0.1';

    if (isRateLimited(ip)) {
      return Response.json(
        { error: 'Too many failed login attempts. Please try again in 15 minutes.' },
        { status: 429 }
      );
    }

    const validUsername = process.env.ADMIN_USERNAME;
    const validHash = process.env.ADMIN_PASSWORD_HASH;

    if (!validUsername || !validHash) {
      return Response.json(
        { error: 'Something went wrong, please try again.' },
        { status: 500 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, validHash);
    const isValid = username === validUsername && passwordMatch;

    if (!isValid) {
      recordFailedAttempt(ip);
      return Response.json({ error: 'Invalid username or password.' }, { status: 401 });
    }

    clearAttempts(ip);
    const token = await signToken();
    const cookieStore = await cookies();
    cookieStore.set('admin_session', token, getCookieOptions());

    const safeReturnUrl =
      typeof returnUrl === 'string' &&
      returnUrl.startsWith('/') &&
      !returnUrl.startsWith('//') &&
      !returnUrl.includes('://')
        ? returnUrl
        : '/import';

    return Response.json({ ok: true, redirectTo: safeReturnUrl });
  } catch {
    return Response.json(
      { error: 'Something went wrong, please try again.' },
      { status: 500 }
    );
  }
}
