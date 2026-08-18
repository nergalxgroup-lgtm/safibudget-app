import { NextResponse } from 'next/server';

export function middleware(req) {
  const res = NextResponse.next();
  res.headers.set('Access-Control-Allow-Origin', process.env.FRONTEND_URL);
  res.headers.set('Access-Control-Allow-Credentials', 'true');
  res.headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return new NextResponse(null, { status: 204, headers: res.headers });
  return res;
}

export const config = { matcher: '/api/:path*' };
