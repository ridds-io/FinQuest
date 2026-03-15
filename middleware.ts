import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request: { headers: request.headers } });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value, ...options });
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;
  if (!user && (pathname.startsWith('/game') || pathname.startsWith('/profile'))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/game', request.url));
  }
  return response;
}

export const config = {
  matcher: ['/game/:path*', '/profile/:path*', '/login'],
};

