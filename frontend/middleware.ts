import {NextRequest, NextResponse} from "next/server";

const TOKEN_COOKIE='admin_token';

export function middleware(req : NextRequest) {
    const token = req.cookies.get(TOKEN_COOKIE)?.value;
    if (!token) {
        const loginUrl = new URL('/public/login', req.url);
        loginUrl.searchParams.set('next', req.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}
export const config = {
    matcher: [
        '/admin/:path*',
    ],
};
