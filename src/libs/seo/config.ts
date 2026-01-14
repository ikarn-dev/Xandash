// SEO Configuration Constants
export const SEO_CONFIG = {
  baseUrl: 'https://www.xandash.online',
  siteName: 'XanDash',
  defaultTitle: 'XanDash - Xandeum Dashboard | pNode Monitor & Network Analytics',
  defaultDescription: 'XanDash is the official Xandeum dashboard for monitoring pNodes in real-time. Track node performance, uptime, storage, credits, and network statistics with AI-powered analytics.',
  twitterHandle: '@xandeum',
  
  // Open Graph defaults
  ogImage: {
    url: 'https://www.xandash.online/icon.png',
    width: 512,
    height: 512,
    alt: 'XanDash - Xandeum Network Dashboard',
  },
  
  // Keywords - optimized for search (primary keywords first)
  defaultKeywords: [
    // Primary search terms (what users search for)
    'xandeum dashboard',
    'pnode dashboard',
    'xandeum pnode dashboard',
    'xandash',
    'xandash dashboard',
    // Brand keywords
    'XanDash',
    'Xandeum',
    'Xandeum network',
    'Xandeum monitor',
    'Xandeum analytics',
    'Xandeum explorer',
    // Node keywords
    'pNodes',
    'pNode monitor',
    'pNode tracker',
    'pNode analytics',
    'pNode status',
    'pNode uptime',
    'pNode credits',
    'pNode leaderboard',
    'Xandeum pNodes',
    'Xandeum validators',
    'Xandeum nodes',
    // Network keywords
    'network monitoring',
    'network dashboard',
    'network analytics',
    'node distribution',
    // Blockchain keywords
    'blockchain dashboard',
    'blockchain analytics',
    'crypto dashboard',
    // Storage keywords
    'storage network',
    'decentralized storage',
    'STOINC',
    'STOINC calculator',
    // Token keywords
    'XAND',
    'XAND token',
    // Technical keywords
    'validators',
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
