export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    '/((?!login|register|splash|forgot-password|reset-password|api/auth|api/register|_next/static|_next/image|favicon.ico).*)',
  ],
}
