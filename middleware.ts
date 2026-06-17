export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    '/((?!login|register|api/auth|api/register|api/db-test|_next/static|_next/image|favicon.ico).*)',
  ],
}
