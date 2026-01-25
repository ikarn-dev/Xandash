import { MetadataRoute } from 'next';
import { SEO_CONFIG } from './config';

export function generateRobots(): MetadataRoute.Robots {
  const { baseUrl } = SEO_CONFIG;

  return {
    rules: [
      // Block all crawlers by default
      {
        userAgent: '*',
        disallow: '/',
      },
      // Allow only Googlebot
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/_next/', '/admin/', '/private/'],
      },
      {
        userAgent: 'Googlebot-Image',
        allow: '/',
      },
      {
        userAgent: 'Googlebot-News',
        allow: '/',
      },
      {
        userAgent: 'Googlebot-Video',
        allow: '/',
      },
      {
        userAgent: 'AdsBot-Google',
        allow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
