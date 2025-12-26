import { NextResponse } from 'next/server';
import { cache } from '@/libs/cache/LocalCache';

const COINGECKO_API_URL = process.env.NEXT_PUBLIC_COINGECKO_API_URL || '';
const COINGECKO_API_KEY = process.env.NEXT_PUBLIC_COINGECKO_API_KEY || '';

export async function GET() {
  try {
    if (!COINGECKO_API_URL) {
      return NextResponse.json(
        { error: 'CoinGecko API URL not configured' },
        { status: 500 }
      );
    }

    // Check cache first (5 minute TTL)
    const cacheKey = 'xand-info';
    const cached = await cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { 'Cache-Control': 'public, max-age=60' },
      });
    }

    const response = await fetch(COINGECKO_API_URL, {
      headers: {
        'x-cg-demo-api-key': COINGECKO_API_KEY,
      },
      next: { revalidate: 300 }, // 5 minutes
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();

    // Cache for 5 minutes
    await cache.set(cacheKey, data, 300);

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, max-age=60' },
    });
  } catch (error) {
    console.error('XAND Info API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch XAND info' },
      { status: 500 }
    );
  }
}
