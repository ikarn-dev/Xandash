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
  
  // Keywords - optimized for search
  defaultKeywords: [
    // Brand keywords
    'XanDash',
    'XanDash Dashboard',
    'XanDash online',
    'XanDash monitor',
    'XanDash analytics',
    'Xandeum',
    'Xandeum dashboard',
    'Xandeum network',
    'Xandeum monitor',
    'Xandeum analytics',
    'Xandeum explorer',
    'Xandeum stats',
    'Xandeum statistics',
    'Xandeum tracker',
    // Node keywords
    'pNodes',
    'pNode monitor',
    'pNode tracker',
    'pNode dashboard',
    'pNode analytics',
    'pNode stats',
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
    'network stats',
    'network map',
    'node distribution',
    'global nodes',
    // Blockchain keywords
    'blockchain dashboard',
    'blockchain analytics',
    'blockchain monitor',
    'blockchain explorer',
    'crypto dashboard',
    'crypto analytics',
    'crypto monitor',
    // Storage keywords
    'storage network',
    'decentralized storage',
    'storage analytics',
    'STOINC',
    'STOINC calculator',
    'storage incentive',
    // Token keywords
    'XAND',
    'XAND token',
    'XAND price',
    'XAND analytics',
    // Technical keywords
    'validators',
    'node tracker',
    'devnet',
    'mainnet',
    'RPC endpoints',
    'API testing',
    // Governance keywords
    'governance',
    'proposals',
    'voting',
    'treasury',
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
