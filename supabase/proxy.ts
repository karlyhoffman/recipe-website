import { errors, jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import { getCookieOptions, getSecret, signToken } from '@/lib/session';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  const isProtected =
    pathname.startsWith('/import') || pathname.startsWith('/api/import/');
  const isLoginPage = pathname === '/login';

  const token = request.cookies.get('admin_session')?.value;
  let isAuthenticated = false;
  let isExpired = false;

  if (token) {
    try {
      await jwtVerify(token, getSecret(), { algorithms: ['HS256'] });
      isAuthenticated = true;
    } catch (err) {
      if (err instanceof errors.JWTExpired) {
        isExpired = true;
      }
    }
  }

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnUrl', pathname);
    if (isExpired) loginUrl.searchParams.set('expired', '1');
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginPage && isAuthenticated) {
    return NextResponse.redirect(new URL('/import', request.url));
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-authenticated', String(isAuthenticated));

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  if (isAuthenticated) {
    const newToken = await signToken();
    response.cookies.set('admin_session', newToken, getCookieOptions());
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
