import { NextRequest, NextResponse } from 'next/server';
import { getAutomation, updateAutomation } from '@/src/lib/services/automation';

/**
 * GET /api/automation - Get automation configuration
 */
export async function GET() {
  try {
    const config = await getAutomation();
    return NextResponse.json({ success: true, config });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/automation - Update automation configuration
 * Body: Partial<AutomationConfig>
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await updateAutomation(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    const config = await getAutomation();
    return NextResponse.json({ success: true, config });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
