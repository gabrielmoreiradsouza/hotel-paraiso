import { NextResponse } from 'next/server';
import { getMinPrices } from '@/lib/min-prices';

export const revalidate = 86400;

export async function GET() {
  try {
    const prices = await getMinPrices();
    if (Object.keys(prices).length === 0) {
      return NextResponse.json(
        { prices: {} },
        { status: 502, headers: { 'Cache-Control': 'no-store' } }
      );
    }
    return NextResponse.json(
      { prices },
      { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' } }
    );
  } catch {
    return NextResponse.json(
      { prices: {} },
      { status: 502, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
