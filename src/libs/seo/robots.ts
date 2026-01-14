import { MetadataRoute } from 'next';
import { SEO_CONFIG } from './config';

export function generateRobots(): MetadataRoute.Robots {
  const { baseUrl } = SEO_CONFIG;

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/', '/admin/', '/private/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
      },
      {
        userAgent: 'Googlebot-Image',
        allow: '/',
      },
      {
        userAgent: ['Bingbot', 'Slurp', 'DuckDuckBot', 'Baiduspider', 'YandexBot'],
        allow: '/',
        crawlDelay: 1,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
