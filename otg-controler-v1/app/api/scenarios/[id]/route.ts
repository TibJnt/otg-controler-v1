/**
 * API endpoint for specific scenario
 * GET /api/scenarios/[id] - Get scenario by ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { getScenarioById } from '@/src/lib/storage/scenarioStore';

/**
 * GET /api/scenarios/[id]
 * Returns a specific scenario by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const scenario = await getScenarioById(id);

    if (!scenario) {
      return NextResponse.json(
        { success: false, error: 'Scenario not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, scenario }, { status: 200 });
  } catch (error) {
    console.error('[API] Error loading scenario:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load scenario', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
