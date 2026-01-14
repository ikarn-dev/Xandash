import { MetadataRoute } from 'next';
import { SEO_CONFIG } from './config';

export function generateManifest(): MetadataRoute.Manifest {
  const { siteName, defaultDescription } = SEO_CONFIG;

  return {
    name: `${siteName} - Xandeum Dashboard`,
    short_name: siteName,
    description: defaultDescription,
    start_url: '/',
    id: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    orientation: 'portrait-primary',
    categories: ['productivity', 'utilities', 'finance'],
    lang: 'en',
    dir: 'ltr',
    icons: [
      {
        src: '/favicon.ico',
        sizes: '48x48',
        type: 'image/x-icon',
      },
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'pNodes',
        short_name: 'pNodes',
        description: 'View all pNodes',
        url: '/nodes',
        icons: [{ src: '/icon.png', sizes: '96x96' }],
      },
      {
        name: 'Leaderboard',
        short_name: 'Leaderboard',
        description: 'View credits leaderboard',
        url: '/leaderboard',
        icons: [{ src: '/icon.png', sizes: '96x96' }],
      },
      {
        name: 'Network Map',
        short_name: 'Network',
        description: 'View global node distribution',
        url: '/network',
        icons: [{ src: '/icon.png', sizes: '96x96' }],
      },
    ],
    related_applications: [],
    prefer_related_applications: false,
  };
}
