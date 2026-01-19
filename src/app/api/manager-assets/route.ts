import { NextRequest, NextResponse } from 'next/server';
import { getManagerAssets, getBatchManagerAssets } from '@/libs/services/manager-assets-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const addresses = searchParams.get('addresses');

    if (address) {
      // Single manager lookup
      const assets = await getManagerAssets(address);

      if (!assets) {
        return NextResponse.json({
          error: 'Failed to fetch manager assets',
          manager_pubkey: address,
          nft_count: 0,
          sbt_count: 0,
          xand_balance: 0,
          last_updated: 0,
          nft_names: [],
          sbt_names: []
        }, { status: 200 });
      }

      return NextResponse.json(assets, {
        headers: {
          'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        }
      });

    } else if (addresses) {
      // Batch manager lookup
      const addressList = addresses.split(',').filter(Boolean).slice(0, 20); // Max 20 addresses

      if (addressList.length === 0) {
        return NextResponse.json({ error: 'No valid addresses provided' }, { status: 400 });
      }

      const assetsMap = await getBatchManagerAssets(addressList);

      // Convert Map to object for JSON response
      const result: { [address: string]: any } = {};
      addressList.forEach(addr => {
        const assets = assetsMap.get(addr);
        result[addr] = assets || {
          manager_pubkey: addr,
          nft_count: 0,
          sbt_count: 0,
          xand_balance: 0,
          last_updated: 0,
          nft_names: [],
          sbt_names: []
        };
      });

      return NextResponse.json({
        managers: result,
        count: addressList.length,
        cached: assetsMap.size
      }, {
        headers: {
          'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        }
      });

    } else {
      return NextResponse.json({ error: 'Address or addresses parameter required' }, { status: 400 });
    }

  } catch (error) {
    console.error('Manager assets API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch manager assets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('[Manager Assets API] Failed to parse request body:', parseError);
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { addresses } = body;

    if (!addresses) {
      console.warn('[Manager Assets API] No addresses field in request');
      return NextResponse.json({ error: 'addresses field required', managers: {} }, { status: 200 });
    }

    if (!Array.isArray(addresses)) {
      console.warn('[Manager Assets API] addresses is not an array:', typeof addresses);
      return NextResponse.json({ error: 'addresses must be an array', managers: {} }, { status: 200 });
    }

    if (addresses.length === 0) {
      return NextResponse.json({ managers: {}, count: 0, cached: 0 }, { status: 200 });
    }

    // Filter out invalid addresses
    const validAddresses = addresses.filter((addr: any) => typeof addr === 'string' && addr.length > 10);

    if (validAddresses.length === 0) {
      return NextResponse.json({ managers: {}, count: 0, cached: 0 }, { status: 200 });
    }

    if (validAddresses.length > 50) {
      // Just truncate instead of erroring
      validAddresses.length = 50;
    }

    const assetsMap = await getBatchManagerAssets(validAddresses);

    // Convert Map to object for JSON response
    const result: { [address: string]: any } = {};
    validAddresses.forEach((addr: string) => {
      const assets = assetsMap.get(addr);
      result[addr] = assets || {
        manager_pubkey: addr,
        nft_count: 0,
        sbt_count: 0,
        xand_balance: 0,
        last_updated: Date.now(),
        nft_names: [],
        sbt_names: []
      };
    });

    return NextResponse.json({
      managers: result,
      count: validAddresses.length,
      cached: assetsMap.size,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      }
    });

  } catch (error) {
    console.error('Manager assets batch API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch manager assets' },
      { status: 500 }
    );
  }
}