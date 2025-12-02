import { NextResponse } from 'next/server';
import { getDevices, refreshDevices } from '@/src/lib/services/devices';

/**
 * GET /api/devices - Get all devices
 */
export async function GET() {
  try {
    const devices = await getDevices();
    return NextResponse.json({ success: true, devices });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/devices - Refresh devices from iMouseXP
 */
export async function POST() {
  try {
    const result = await refreshDevices();

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, devices: result.devices });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
