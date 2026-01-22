/**
 * Cloudflare Pages Worker for Next.js
 * Routes requests to the appropriate Next.js assets and pages
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Handle static assets from .next/static
    if (pathname.startsWith('/_next/static/')) {
      return env.ASSETS.fetch(request);
    }

    // Handle public assets and common file types
    if (
      pathname.startsWith('/public/') ||
      pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json|webp|avif)$/)
    ) {
      return env.ASSETS.fetch(request);
    }

    // Handle API routes and dynamic pages
    try {
      return await env.ASSETS.fetch(request);
    } catch (error) {
      // Fallback to index for client-side routing on GET requests
      if (request.method === 'GET') {
        try {
          return await env.ASSETS.fetch(new Request(new URL('/index.html', url).toString(), request));
        } catch {
          return new Response('Not Found', { status: 404 });
        }
      }
      return new Response('Not Found', { status: 404 });
    }
  },
};
