/**
 * API endpoints for scenario presets
 * GET /api/scenarios - List all scenarios
 * POST /api/scenarios - Apply a scenario to automation config
 */

import { NextRequest, NextResponse } from 'next/server';
import { loadScenarios, applyScenarioToAutomation } from '@/src/lib/storage/scenarioStore';
import { z } from 'zod';

/**
 * GET /api/scenarios
 * Returns all available scenario presets
 */
export async function GET() {
  try {
    const scenarios = await loadScenarios();
    return NextResponse.json({ success: true, scenarios }, { status: 200 });
  } catch (error) {
    console.error('[API] Error loading scenarios:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load scenarios', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/scenarios
 * Apply a scenario preset to the automation config
 * Body: { scenarioId: string, deviceIds: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const schema = z.object({
      scenarioId: z.string().min(1),
      deviceIds: z.array(z.string()),
    });

    const validated = schema.parse(body);

    // Apply scenario
    const result = await applyScenarioToAutomation(validated.scenarioId, validated.deviceIds);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to apply scenario' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Scenario applied successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] Error applying scenario:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to apply scenario', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
