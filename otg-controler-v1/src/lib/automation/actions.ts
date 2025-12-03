/**
 * Action handlers for Like, Comment, Save operations
 */

import { click, keyboardInput } from '../clients/imouse';
import { Device, ActionType, Trigger } from '../types';
import { denormalizeCoords } from '../utils/coords';
import { getRandomComment } from '../utils/triggers';
import { logInfo, logError, logWarn } from '../utils/logger';

/**
 * Get the effective screen dimensions for click coordinates
 * Uses screenWidth/screenHeight if available, falls back to width/height
 */
function getClickDimensions(device: Device): { width: number; height: number } {
  return {
    width: device.screenWidth || device.width,
    height: device.screenHeight || device.height,
  };
}

/**
 * Execute a Like action on a device
 */
export async function executeLike(device: Device): Promise<{ success: boolean; error?: string }> {
  if (!device.coords.like) {
    return { success: false, error: 'Like coordinates not configured' };
  }

  const clickDims = getClickDimensions(device);
  
  // DETAILED DEBUG LOGGING
  logInfo(`=== LIKE ACTION DEBUG ===`, device.idImouse);
  logInfo(`Device logical dimensions: ${device.width}x${device.height}`, device.idImouse);
  logInfo(`Device screen dimensions: ${device.screenWidth}x${device.screenHeight}`, device.idImouse);
  logInfo(`Using for click: ${clickDims.width}x${clickDims.height}`, device.idImouse);
  logInfo(`Stored normalized coords: xNorm=${device.coords.like.xNorm}, yNorm=${device.coords.like.yNorm}`, device.idImouse);
  
  const { x, y } = denormalizeCoords(device.coords.like, clickDims.width, clickDims.height);
  logInfo(`Calculated absolute coords: x=${x}, y=${y}`, device.idImouse);
  logInfo(`Sending click to iMouseXP...`, device.idImouse);

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

  const clickDims = getClickDimensions(device);
  const { x, y } = denormalizeCoords(device.coords.save, clickDims.width, clickDims.height);
  logInfo(`Executing SAVE at (${x}, ${y}) [screen: ${clickDims.width}x${clickDims.height}]`, device.idImouse);

  const result = await click(device.idImouse, x, y);

  if (!result.success) {
    logError(`Save failed: ${result.error}`, device.idImouse);
    return result;
  }

  logInfo('SAVE executed successfully', device.idImouse);
  return { success: true };
}

/**
 * Execute a Like and Save combo action on a device
 */
export async function executeLikeAndSave(device: Device): Promise<{ success: boolean; error?: string }> {
  // Execute like first
  logInfo('Executing LIKE_AND_SAVE combo', device.idImouse);
  const likeResult = await executeLike(device);

  if (!likeResult.success) {
    logError(`Like failed in LIKE_AND_SAVE: ${likeResult.error}`, device.idImouse);
    return likeResult;
  }

  // Wait briefly between actions
  await sleep(500);

  // Execute save
  const saveResult = await executeSave(device);

  if (!saveResult.success) {
    logError(`Save failed in LIKE_AND_SAVE: ${saveResult.error}`, device.idImouse);
    return saveResult;
  }

  logInfo('LIKE_AND_SAVE executed successfully', device.idImouse);
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

  const clickDims = getClickDimensions(device);

  // Get comment text
  const commentText = getRandomComment(trigger.commentTemplates || []);
  if (!commentText) {
    logWarn('No comment templates available, skipping comment', device.idImouse);
    return { success: false, error: 'No comment templates configured' };
  }

  // Click on comment button to open comment field
  const { x: commentX, y: commentY } = denormalizeCoords(
    device.coords.comment,
    clickDims.width,
    clickDims.height
  );
  logInfo(`Opening comment field at (${commentX}, ${commentY}) [screen: ${clickDims.width}x${clickDims.height}]`, device.idImouse);

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
      clickDims.width,
      clickDims.height
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
      clickDims.width,
      clickDims.height
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

    case 'LIKE_AND_SAVE':
      return executeLikeAndSave(device);

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

    case 'NO_ACTION':
      logInfo('Action is NO_ACTION, viewing only (no device interaction)', device.idImouse);
      return { success: true };

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
