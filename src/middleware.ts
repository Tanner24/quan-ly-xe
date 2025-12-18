import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Các route không cần đăng nhập
const publicRoutes = ['/login']

// Các route bắt đầu với prefix này cũng public
const publicPrefixes = ['/api', '/_next', '/images', '/favicon.ico']

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Kiểm tra nếu là public route
    if (publicRoutes.includes(pathname)) {
        return NextResponse.next()
    }

    // Kiểm tra nếu là public prefix (static files, api routes)
    if (publicPrefixes.some(prefix => pathname.startsWith(prefix))) {
        return NextResponse.next()
    }

    // Kiểm tra session cookie
    const sessionCookie = request.cookies.get('vincons_session')

    // Nếu chưa đăng nhập, redirect về /login
    if (!sessionCookie || sessionCookie.value !== 'true') {
        const loginUrl = new URL('/login', request.url)
        // Lưu URL gốc để redirect sau khi đăng nhập
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
    }

    // Đã đăng nhập, cho phép truy cập
    return NextResponse.next()
}

// Cấu hình matcher - áp dụng middleware cho tất cả routes trừ static files
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (images, etc.)
         */
        '/((?!_next/static|_next/image|favicon.ico|images|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|.*\\.ico$).*)',
    ],
}
