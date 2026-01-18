import { NextResponse } from 'next/server';
import { localCache } from '@/libs/cache/LocalCache';

export async function GET() {
  try {
    const stats = localCache.getStats();
    const hitRatio = localCache.getHitRatio();
    
    return NextResponse.json({
      ...stats,
      hitRatio: Math.round(hitRatio * 100 * 100) / 100, // Percentage with 2 decimals
      memoryUsage: {
        rss: process.memoryUsage().rss,
        heapUsed: process.memoryUsage().heapUsed,
        heapTotal: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external
      },
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Cache stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cache statistics' },
      { status: 500 }
    );
  }
}

// Clear cache endpoint (for debugging)
export async function DELETE() {
  try {
    localCache.clear();
    
    return NextResponse.json({
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}