import { NextResponse } from 'next/server';
import { startEngine, isEngineRunning } from '@/src/lib/automation/engine';

/**
 * POST /api/automation/start - Start the automation
 */
export async function POST() {
  try {
    if (isEngineRunning()) {
      return NextResponse.json(
        { success: false, error: 'Automation is already running' },
        { status: 400 }
      );
    }

    const result = await startEngine();

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, warnings: result.warnings },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Automation started',
      warnings: result.warnings,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
