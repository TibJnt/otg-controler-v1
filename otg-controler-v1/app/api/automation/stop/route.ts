import { NextRequest, NextResponse } from 'next/server';
import { stopEngine, emergencyStop, isEngineRunning } from '@/src/lib/automation/engine';

/**
 * POST /api/automation/stop - Stop the automation
 * Query param: ?emergency=true for emergency stop
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isEmergency = searchParams.get('emergency') === 'true';

    if (!isEngineRunning()) {
      return NextResponse.json(
        { success: false, error: 'Automation is not running' },
        { status: 400 }
      );
    }

    if (isEmergency) {
      await emergencyStop();
      return NextResponse.json({
        success: true,
        message: 'Emergency stop executed',
      });
    }

    const result = await stopEngine();

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Automation stopping',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
