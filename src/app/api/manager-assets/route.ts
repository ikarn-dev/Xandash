import { NextRequest, NextResponse } from 'next/server';
import { getManagerAssets, getBatchManagerAssets } from '@/libs/services/manager-assets-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
// Set max duration for serverless function (Vercel)
export const maxDuration = 15;

// Timeout wrapper to ensure we respond before browser times out
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> => {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs))
  ]);
};

// Default empty response for failed requests
const createEmptyResponse = (address: string) => ({
  manager_pubkey: address,
  nft_count: 0,
  sbt_count: 0,
  xand_balance: 0,
  xeno_balance: 0,
  last_updated: Date.now(),
  nft_names: [],
  sbt_names: [],
  nft_previews: [],
  sbt_previews: []
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const addresses = searchParams.get('addresses');

    if (address) {
      // Single manager lookup with 8s timeout
      const assets = await withTimeout(getManagerAssets(address), 8000);

      return NextResponse.json(assets || createEmptyResponse(address), {
        headers: {
          'Cache-Control': 'public, max-age=300',
        }
      });

    } else if (addresses) {
      // Batch manager lookup - limit to 10 addresses for faster response
      const addressList = addresses.split(',').filter(Boolean).slice(0, 10);

      if (addressList.length === 0) {
        return NextResponse.json({ managers: {}, count: 0, cached: 0 }, { status: 200 });
      }

      const assetsMap = await withTimeout(getBatchManagerAssets(addressList), 10000);

      // Convert Map to object for JSON response
      const result: { [address: string]: any } = {};
      addressList.forEach(addr => {
        const assets = assetsMap?.get(addr);
        result[addr] = assets || createEmptyResponse(addr);
      });

      return NextResponse.json({
        managers: result,
        count: addressList.length,
        cached: assetsMap?.size || 0
      }, {
        headers: {
          'Cache-Control': 'public, max-age=300',
        }
      });

    } else {
      return NextResponse.json({ managers: {}, count: 0, cached: 0 }, { status: 200 });
    }

  } catch {
    // Silent error - return empty response
    return NextResponse.json({ managers: {}, count: 0, cached: 0 }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ managers: {}, count: 0, cached: 0 }, { status: 200 });
    }

    const { addresses } = body;

    if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
      return NextResponse.json({ managers: {}, count: 0, cached: 0 }, { status: 200 });
    }

    // Filter and limit addresses - max 10 for faster response
    const validAddresses = addresses
      .filter((addr: any) => typeof addr === 'string' && addr.length > 10)
      .slice(0, 10);

    if (validAddresses.length === 0) {
      return NextResponse.json({ managers: {}, count: 0, cached: 0 }, { status: 200 });
    }

    // Use 10s timeout to ensure we respond before browser times out
    const assetsMap = await withTimeout(getBatchManagerAssets(validAddresses), 10000);

    // Convert Map to object for JSON response
    const result: { [address: string]: any } = {};
    validAddresses.forEach((addr: string) => {
      const assets = assetsMap?.get(addr);
      result[addr] = assets || createEmptyResponse(addr);
    });

    return NextResponse.json({
      managers: result,
      count: validAddresses.length,
      cached: assetsMap?.size || 0,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300',
      }
    });

  } catch {
    // Silent error - return empty response instead of 500
    return NextResponse.json({ managers: {}, count: 0, cached: 0 }, { status: 200 });
  }
}
