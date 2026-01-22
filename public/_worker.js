/**
 * Cloudflare Pages Worker for Next.js
 * This file handles routing and serves the Next.js application
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Handle static assets
    if (
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/public/') ||
      pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)
    ) {
      return env.ASSETS.fetch(request);
    }

    // Handle API routes and dynamic pages
    try {
      return await env.ASSETS.fetch(request);
    } catch (error) {
      // Fallback to index for client-side routing
      if (request.method === 'GET') {
        return env.ASSETS.fetch(new Request(new URL('/index.html', url).toString(), request));
      }
      return new Response('Not Found', { status: 404 });
    }
  },
};
