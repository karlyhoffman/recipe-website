import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function proxy(request: NextRequest) {
  const isDev = process.env.NODE_ENV === 'development';

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const isAuthenticated = isDev || !!user;

  if (request.nextUrl.pathname.startsWith('/import') && !isAuthenticated) {
    const redirect = NextResponse.redirect(new URL('/', request.url));
    supabaseResponse.cookies.getAll().forEach(({ name, value, ...rest }) =>
      redirect.cookies.set(name, value, rest)
    );
    return redirect;
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-authenticated', String(isAuthenticated));

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  supabaseResponse.cookies.getAll().forEach(({ name, value, ...rest }) =>
    response.cookies.set(name, value, rest)
  );

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
