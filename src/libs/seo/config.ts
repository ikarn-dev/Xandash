// SEO Configuration Constants
export const SEO_CONFIG = {
  baseUrl: 'https://www.xandash.online',
  siteName: 'XanDash',
  defaultTitle: 'XanDash - Real-Time Xandeum Network Dashboard & Node Monitor',
  defaultDescription: 'Monitor Xandeum pNodes in real-time. Track node performance, uptime, storage, credits, and network statistics. AI-powered analytics for devnet and mainnet validators.',
  twitterHandle: '@xandeum',
  
  // Open Graph defaults
  ogImage: {
    url: 'https://www.xandash.online/icon.png',
    width: 512,
    height: 512,
    alt: 'XanDash - Xandeum Network Dashboard',
  },
  
  // Keywords
  defaultKeywords: [
    'Xandeum',
    'pNodes',
    'network monitoring',
    'dashboard',
    'validators',
    'blockchain',
    'storage network',
    'node tracker',
    'devnet',
    'mainnet',
  ],
} as const;

// Helper function to generate metadata
export function generateSEOMetadata({
  title,
  description,
  keywords = [],
  path = '',
  image,
}: {
  title: string;
  description: string;
  keywords?: string[];
  path?: string;
  image?: { url: string; width: number; height: number; alt: string };
}) {
  const url = `${SEO_CONFIG.baseUrl}${path}`;
  const ogImage = image || SEO_CONFIG.ogImage;
  
  return {
    title,
    description,
    keywords: [...SEO_CONFIG.defaultKeywords, ...keywords],
    openGraph: {
      title,
      description,
      url,
      siteName: SEO_CONFIG.siteName,
      images: [ogImage],
      type: 'website' as const,
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image' as const,
      title,
      description,
      site: SEO_CONFIG.twitterHandle,
      creator: SEO_CONFIG.twitterHandle,
      images: [ogImage.url],
    },
    alternates: {
      canonical: url,
    },
  };
}
