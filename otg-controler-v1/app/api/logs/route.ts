import { NextRequest, NextResponse } from 'next/server';
import { getRecentLogs, formatLogEntry, clearLogs } from '@/src/lib/utils/logger';

/**
 * GET /api/logs - Get recent log entries
 * Query params: ?count=50 (default 50, max 100)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const countParam = searchParams.get('count');
    const count = Math.min(parseInt(countParam || '50', 10) || 50, 100);

    const logs = getRecentLogs(count);

    return NextResponse.json({
      success: true,
      logs: logs.map((entry) => ({
        timestamp: entry.timestamp.toISOString(),
        level: entry.level,
        message: entry.message,
        deviceId: entry.deviceId,
        formatted: formatLogEntry(entry),
      })),
      count: logs.length,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/logs - Clear log buffer
 */
export async function DELETE() {
  try {
    clearLogs();
    return NextResponse.json({ success: true, message: 'Logs cleared' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
