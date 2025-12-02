import { NextRequest, NextResponse } from 'next/server';
import {
  getAllTriggers,
  createTrigger,
  updateTrigger,
  deleteTrigger,
} from '@/src/lib/services/automation';
import { ActionType } from '@/src/lib/types';

/**
 * GET /api/triggers - Get all triggers
 */
export async function GET() {
  try {
    const triggers = await getAllTriggers();
    return NextResponse.json({ success: true, triggers });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/triggers - Create or update a trigger
 * Body for create: { action, keywordsInput, deviceIds?, commentTemplates?, ... }
 * Body for update: { id, ...updates }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // If id is provided, it's an update
    if (body.id) {
      const result = await updateTrigger(body.id, body);
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        );
      }
      const triggers = await getAllTriggers();
      return NextResponse.json({ success: true, triggers });
    }

    // Otherwise, create new trigger
    if (!body.action || !body.keywordsInput) {
      return NextResponse.json(
        { success: false, error: 'action and keywordsInput are required' },
        { status: 400 }
      );
    }

    const result = await createTrigger({
      action: body.action as ActionType,
      keywordsInput: body.keywordsInput,
      deviceIds: body.deviceIds,
      commentTemplates: body.commentTemplates,
      commentLanguage: body.commentLanguage,
      probability: body.probability,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    const triggers = await getAllTriggers();
    return NextResponse.json({ success: true, trigger: result.trigger, triggers });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/triggers - Delete a trigger
 * Body: { id: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'id is required' },
        { status: 400 }
      );
    }

    const result = await deleteTrigger(body.id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    const triggers = await getAllTriggers();
    return NextResponse.json({ success: true, triggers });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
