import { NextResponse } from 'next/server';
import { getEngineState, getEngineStats } from '@/src/lib/automation/engine';
import { getAutomation } from '@/src/lib/services/automation';
import { getDevices } from '@/src/lib/services/devices';

/**
 * GET /api/health - Get health and status summary
 */
export async function GET() {
  try {
    const [engineState, engineStats, automation, devices] = await Promise.all([
      Promise.resolve(getEngineState()),
      Promise.resolve(getEngineStats()),
      getAutomation(),
      getDevices(),
    ]);

    return NextResponse.json({
      success: true,
      status: {
        engine: {
          status: engineState.status,
          running: engineState.status === 'running',
          currentDevice: engineStats.currentDevice,
          cycleCount: engineStats.cycleCount,
          uptime: engineStats.uptime,
          recentErrors: engineStats.recentErrors,
        },
        automation: {
          name: automation.name,
          running: automation.running,
          selectedDevices: automation.deviceIds.length,
          triggers: automation.triggers.length,
        },
        devices: {
          total: devices.length,
          configured: devices.filter((d) => d.coords.tiktok?.like || d.coords.instagram?.like).length,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
