/**
 * Action handlers for Like, Comment, Save operations
 */

import { click, keyboardInput } from '../clients/imouse';
import { Device, ActionType, Trigger } from '../types';
import { denormalizeCoords } from '../utils/coords';
import { getRandomComment } from '../utils/triggers';
import { logInfo, logError, logWarn } from '../utils/logger';

/**
 * Execute a Like action on a device
 */
export async function executeLike(device: Device): Promise<{ success: boolean; error?: string }> {
  if (!device.coords.like) {
    return { success: false, error: 'Like coordinates not configured' };
  }

  const { x, y } = denormalizeCoords(device.coords.like, device.width, device.height);
  logInfo(`Executing LIKE at (${x}, ${y})`, device.idImouse);

  const result = await click(device.idImouse, x, y);

  if (!result.success) {
    logError(`Like failed: ${result.error}`, device.idImouse);
    return result;
  }

  logInfo('LIKE executed successfully', device.idImouse);
  return { success: true };
}

/**
 * Execute a Save action on a device
 */
export async function executeSave(device: Device): Promise<{ success: boolean; error?: string }> {
  if (!device.coords.save) {
    return { success: false, error: 'Save coordinates not configured' };
  }

  const { x, y } = denormalizeCoords(device.coords.save, device.width, device.height);
  logInfo(`Executing SAVE at (${x}, ${y})`, device.idImouse);

  const result = await click(device.idImouse, x, y);

  if (!result.success) {
    logError(`Save failed: ${result.error}`, device.idImouse);
    return result;
  }

  logInfo('SAVE executed successfully', device.idImouse);
  return { success: true };
}

/**
 * Execute a Comment action on a device
 */
export async function executeComment(
  device: Device,
  trigger: Trigger
): Promise<{ success: boolean; error?: string }> {
  if (!device.coords.comment) {
    return { success: false, error: 'Comment coordinates not configured' };
  }

  // Get comment text
  const commentText = getRandomComment(trigger.commentTemplates || []);
  if (!commentText) {
    logWarn('No comment templates available, skipping comment', device.idImouse);
    return { success: false, error: 'No comment templates configured' };
  }

  // Click on comment button to open comment field
  const { x: commentX, y: commentY } = denormalizeCoords(
    device.coords.comment,
    device.width,
    device.height
  );
  logInfo(`Opening comment field at (${commentX}, ${commentY})`, device.idImouse);

  let result = await click(device.idImouse, commentX, commentY);
  if (!result.success) {
    logError(`Failed to open comment field: ${result.error}`, device.idImouse);
    return result;
  }

  // Wait a bit for the comment field to appear
  await sleep(500);

  // If there's a specific input field coordinate, click it
  if (device.coords.commentInputField) {
    const { x: inputX, y: inputY } = denormalizeCoords(
      device.coords.commentInputField,
      device.width,
      device.height
    );
    await click(device.idImouse, inputX, inputY);
    await sleep(300);
  }

  // Type the comment
  logInfo(`Typing comment: "${commentText}"`, device.idImouse);
  result = await keyboardInput(device.idImouse, commentText);
  if (!result.success) {
    logError(`Failed to type comment: ${result.error}`, device.idImouse);
    return result;
  }

  // Wait a bit before sending
  await sleep(300);

  // Click send button if configured
  if (device.coords.commentSendButton) {
    const { x: sendX, y: sendY } = denormalizeCoords(
      device.coords.commentSendButton,
      device.width,
      device.height
    );
    logInfo(`Clicking send button at (${sendX}, ${sendY})`, device.idImouse);
    result = await click(device.idImouse, sendX, sendY);
    if (!result.success) {
      logError(`Failed to send comment: ${result.error}`, device.idImouse);
      return result;
    }
  }

  logInfo('COMMENT executed successfully', device.idImouse);
  return { success: true };
}

/**
 * Execute an action based on type
 */
export async function executeAction(
  device: Device,
  action: ActionType,
  trigger: Trigger
): Promise<{ success: boolean; error?: string }> {
  switch (action) {
    case 'LIKE':
      return executeLike(device);

    case 'SAVE':
      return executeSave(device);

    case 'COMMENT':
      return executeComment(device, trigger);

    case 'LIKE_AND_COMMENT': {
      const likeResult = await executeLike(device);
      if (!likeResult.success) {
        return likeResult;
      }
      await sleep(500); // Brief pause between actions
      return executeComment(device, trigger);
    }

    case 'SKIP':
      logInfo('Action is SKIP, no action executed', device.idImouse);
      return { success: true };

    default:
      return { success: false, error: `Unknown action type: ${action}` };
  }
}

/**
 * Helper sleep function
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
