import type { Metadata } from 'next';

interface GenerateMetadataProps {
  params: Promise<{ ip: string }>;
}

export async function generateMetadata({ params }: GenerateMetadataProps): Promise<Metadata> {
  const { ip } = await params;
  const decodedIP = decodeURIComponent(ip);

  return {
    title: `${decodedIP} - Xandeum pNode Profile & Analytics | XanDash`,
    description: `Monitor ${decodedIP} pNode performance. Real-time uptime, storage metrics, credits history, and detailed analytics for this Xandeum validator.`,
    keywords: ['node profile', 'pNode analytics', 'validator stats', 'node monitoring', 'Xandeum node', decodedIP],
    openGraph: {
      title: `${decodedIP} - Xandeum pNode Profile`,
      description: `Real-time performance monitoring and analytics for ${decodedIP} pNode.`,
      url: `https://www.xandash.online/profile/${encodeURIComponent(decodedIP)}`,
    },
    alternates: {
      canonical: `https://www.xandash.online/profile/${encodeURIComponent(decodedIP)}`,
    },
  };
}
