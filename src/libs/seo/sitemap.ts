import { MetadataRoute } from 'next';
import { SEO_CONFIG } from './config';

export function generateSitemap(): MetadataRoute.Sitemap {
  const { baseUrl } = SEO_CONFIG;
  const currentDate = new Date().toISOString();

  // Core pages with highest priority
  const corePages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/nodes`,
      lastModified: currentDate,
      changeFrequency: 'hourly',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/network`,
      lastModified: currentDate,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/leaderboard`,
      lastModified: currentDate,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
  ];

  // Feature pages
  const featurePages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/compare`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/governance`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/xand`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/stoinc`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  // Utility pages
  const utilityPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/endpoints`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/docs`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about-xandash`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  return [...corePages, ...featurePages, ...utilityPages];
}
