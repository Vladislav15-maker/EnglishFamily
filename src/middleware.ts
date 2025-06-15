import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// const AUTH_COOKIE_NAME = 'englishcourse_session'; // This was not used in the active part of the middleware

export function middleware(request: NextRequest) {
  // This function is kept for Next.js to find a middleware export,
  // but it will not be invoked due to the empty matcher below.
  return NextResponse.next();
}

export const config = {
  matcher: [], // Empty matcher: this middleware will not run on any path.
};
