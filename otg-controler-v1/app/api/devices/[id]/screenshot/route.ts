import { NextRequest, NextResponse } from 'next/server';
import { getScreenshot } from '@/src/lib/services/devices';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/devices/[id]/screenshot - Get device screenshot
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const result = await getScreenshot(id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      dataUrl: result.dataUrl,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
