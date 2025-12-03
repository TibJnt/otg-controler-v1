import { NextRequest, NextResponse } from 'next/server';
import { setDeviceCoords, setCoordsFromPixels } from '@/src/lib/services/devices';
import { Platform } from '@/src/lib/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/devices/[id]/coords - Update device coordinates
 * Body: { platform: 'tiktok'|'instagram', action: 'like'|'comment'|..., coords: { xNorm, yNorm } }
 * OR: { platform: 'tiktok'|'instagram', action: 'like'|..., x: number, y: number } for pixel coordinates
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { platform, action, coords, x, y } = body;

    // Validate platform (default to 'tiktok' for backwards compatibility)
    const validPlatform: Platform = platform === 'instagram' ? 'instagram' : 'tiktok';

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'action is required' },
        { status: 400 }
      );
    }

    // Check if using normalized coords or pixel coords
    if (coords && typeof coords.xNorm === 'number' && typeof coords.yNorm === 'number') {
      const result = await setDeviceCoords(id, validPlatform, action, coords);
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        );
      }
      return NextResponse.json({ success: true });
    }

    if (typeof x === 'number' && typeof y === 'number') {
      const result = await setCoordsFromPixels(id, validPlatform, action, x, y);
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        );
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: 'Either coords {xNorm, yNorm} or {x, y} is required' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
