import { MetadataRoute } from 'next';
import { SEO_CONFIG } from './config';

export function generateRobots(): MetadataRoute.Robots {
  const { baseUrl } = SEO_CONFIG;

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
