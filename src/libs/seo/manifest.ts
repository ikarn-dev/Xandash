import { MetadataRoute } from 'next';
import { SEO_CONFIG } from './config';

export function generateManifest(): MetadataRoute.Manifest {
  const { siteName, defaultDescription } = SEO_CONFIG;

  return {
    name: `${siteName} - Xandeum Network Dashboard`,
    short_name: siteName,
    description: defaultDescription,
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#3B82F6',
    orientation: 'portrait-primary',
    categories: ['productivity', 'utilities', 'business'],
    lang: 'en',
    dir: 'ltr',
    icons: [
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
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: 'pNodes',
        short_name: 'pNodes',
        description: 'View all Xandeum network validators',
        url: '/nodes',
        icons: [{ src: '/icon.png', sizes: '96x96' }],
      },
      {
        name: 'Leaderboard',
        short_name: 'Leaderboard',
        description: 'View pNode credits leaderboard',
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
  };
}
