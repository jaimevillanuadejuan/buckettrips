export { auth as middleware } from './src/auth';

export const config = {
  matcher: ['/my-trips/:path*', '/new-trip/:path*'],
};
