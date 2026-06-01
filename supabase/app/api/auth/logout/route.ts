import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getCookieOptions } from '@/lib/session';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();

  cookieStore.set('admin_session', '', {
    ...getCookieOptions(),
    expires: new Date(0),
    maxAge: 0,
  });

  return NextResponse.redirect(new URL('/', request.url), { status: 302 });
}
