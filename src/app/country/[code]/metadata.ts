import type { Metadata } from 'next';

interface GenerateMetadataProps {
  params: Promise<{ code: string }>;
}

// Country code to name mapping for better SEO
const countryNames: Record<string, string> = {
  us: 'United States',
  gb: 'United Kingdom',
  de: 'Germany',
  fr: 'France',
  ca: 'Canada',
  au: 'Australia',
  jp: 'Japan',
  sg: 'Singapore',
  nl: 'Netherlands',
  in: 'India',
  br: 'Brazil',
  kr: 'South Korea',
  it: 'Italy',
  es: 'Spain',
  se: 'Sweden',
  ch: 'Switzerland',
  pl: 'Poland',
  fi: 'Finland',
  no: 'Norway',
  dk: 'Denmark',
};

export async function generateMetadata({ params }: GenerateMetadataProps): Promise<Metadata> {
  const { code } = await params;
  const decodedCode = decodeURIComponent(code).toLowerCase();
  const countryName = countryNames[decodedCode] || decodedCode.toUpperCase();

  return {
    title: `${countryName} - Xandeum pNodes & Network Stats | XanDash`,
    description: `View all Xandeum pNodes in ${countryName}. Regional network statistics, node distribution, performance metrics, and geographic analytics.`,
    keywords: ['country nodes', 'regional stats', 'node distribution', 'geographic analytics', countryName, 'Xandeum network'],
    openGraph: {
      title: `${countryName} - Xandeum pNodes & Network Stats`,
      description: `Explore Xandeum pNode distribution and performance in ${countryName}.`,
      url: `https://www.xandash.online/country/${encodeURIComponent(decodedCode)}`,
    },
    alternates: {
      canonical: `https://www.xandash.online/country/${encodeURIComponent(decodedCode)}`,
    },
  };
}
