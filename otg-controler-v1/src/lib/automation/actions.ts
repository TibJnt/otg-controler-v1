/**
 * Action handlers for Like, Comment, Save/Share operations
 * Supports both TikTok and Instagram platforms
 */

import { click, keyboardInput } from '../clients/imouse';
import { Device, ActionType, Platform, Trigger, TikTokCoords, InstagramCoords, NormalizedCoords } from '../types';
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
 * Get platform-specific coordinates from device
 */
function getPlatformCoords(device: Device, platform: Platform): TikTokCoords | InstagramCoords | undefined {
  return device.coords[platform];
}

/**
 * Execute a Like action on a device
 */
export async function executeLike(device: Device, platform: Platform): Promise<{ success: boolean; error?: string }> {
  const coords = getPlatformCoords(device, platform);
  if (!coords?.like) {
    return { success: false, error: `Like coordinates not configured for ${platform}` };
  }

  const clickDims = getClickDimensions(device);

  // DETAILED DEBUG LOGGING
  logInfo(`=== LIKE ACTION DEBUG [${platform}] ===`, device.idImouse);
  logInfo(`Device logical dimensions: ${device.width}x${device.height}`, device.idImouse);
  logInfo(`Device screen dimensions: ${device.screenWidth}x${device.screenHeight}`, device.idImouse);
  logInfo(`Using for click: ${clickDims.width}x${clickDims.height}`, device.idImouse);
  logInfo(`Stored normalized coords: xNorm=${coords.like.xNorm}, yNorm=${coords.like.yNorm}`, device.idImouse);

  const { x, y } = denormalizeCoords(coords.like, clickDims.width, clickDims.height);
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
 * Execute a Save/Share action on a device
 * TikTok uses "save", Instagram uses "share"
 */
export async function executeSave(device: Device, platform: Platform): Promise<{ success: boolean; error?: string }> {
  const coords = getPlatformCoords(device, platform);

  // Get the appropriate coordinate based on platform
  let saveCoord: NormalizedCoords | undefined;
  if (platform === 'tiktok') {
    saveCoord = (coords as TikTokCoords)?.save;
  } else {
    saveCoord = (coords as InstagramCoords)?.share;
  }

  if (!saveCoord) {
    const coordName = platform === 'tiktok' ? 'save' : 'share';
    return { success: false, error: `${coordName} coordinates not configured for ${platform}` };
  }

  const clickDims = getClickDimensions(device);
  const { x, y } = denormalizeCoords(saveCoord, clickDims.width, clickDims.height);
  const actionName = platform === 'tiktok' ? 'SAVE' : 'SHARE';
  logInfo(`Executing ${actionName} at (${x}, ${y}) [screen: ${clickDims.width}x${clickDims.height}]`, device.idImouse);

  const result = await click(device.idImouse, x, y);

  if (!result.success) {
    logError(`${actionName} failed: ${result.error}`, device.idImouse);
    return result;
  }

  logInfo(`${actionName} executed successfully`, device.idImouse);
  return { success: true };
}

/**
 * Execute a Like and Save/Share combo action on a device
 */
export async function executeLikeAndSave(device: Device, platform: Platform): Promise<{ success: boolean; error?: string }> {
  // Execute like first
  const actionName = platform === 'tiktok' ? 'LIKE_AND_SAVE' : 'LIKE_AND_SHARE';
  logInfo(`Executing ${actionName} combo`, device.idImouse);
  const likeResult = await executeLike(device, platform);

  if (!likeResult.success) {
    logError(`Like failed in ${actionName}: ${likeResult.error}`, device.idImouse);
    return likeResult;
  }

  // Wait briefly between actions
  await sleep(500);

  // Execute save/share
  const saveResult = await executeSave(device, platform);

  if (!saveResult.success) {
    logError(`Save/Share failed in ${actionName}: ${saveResult.error}`, device.idImouse);
    return saveResult;
  }

  logInfo(`${actionName} executed successfully`, device.idImouse);
  return { success: true };
}

/**
 * Execute a Comment action on a device
 */
export async function executeComment(
  device: Device,
  platform: Platform,
  trigger: Trigger
): Promise<{ success: boolean; error?: string }> {
  const coords = getPlatformCoords(device, platform);
  if (!coords?.comment) {
    return { success: false, error: `Comment coordinates not configured for ${platform}` };
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
    coords.comment,
    clickDims.width,
    clickDims.height
  );
  logInfo(`Opening comment field at (${commentX}, ${commentY}) [screen: ${clickDims.width}x${clickDims.height}]`, device.idImouse);

  let result = await click(device.idImouse, commentX, commentY);
  if (!result.success) {
    logError(`Failed to open comment field: ${result.error}`, device.idImouse);
    return result;
  }

  // Wait for the comment field to appear (800-1200ms, human-like timing)
  await randomSleep(800, 400);

  // If there's a specific input field coordinate, click it
  if (coords.commentInputField) {
    const { x: inputX, y: inputY } = denormalizeCoords(
      coords.commentInputField,
      clickDims.width,
      clickDims.height
    );
    await click(device.idImouse, inputX, inputY);
    await randomSleep(400, 300); // 400-700ms for keyboard to focus
  }

  // Type the comment
  logInfo(`Typing comment: "${commentText}"`, device.idImouse);
  result = await keyboardInput(device.idImouse, commentText);
  if (!result.success) {
    logError(`Failed to type comment: ${result.error}`, device.idImouse);
    return result;
  }

  // Simulate reading comment before sending (500-800ms)
  await randomSleep(500, 300);

  // Click send button if configured
  if (coords.commentSendButton) {
    const { x: sendX, y: sendY } = denormalizeCoords(
      coords.commentSendButton,
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

  // Wait for comment to post and animation to complete (1200-1800ms - CRITICAL for close button)
  await randomSleep(1200, 600);

  // Get the close button coordinate (different name per platform)
  let closeCoord: NormalizedCoords | undefined;
  if (platform === 'tiktok') {
    closeCoord = (coords as TikTokCoords).commentBackButton;
  } else {
    closeCoord = (coords as InstagramCoords).commentCloseButton;
  }

  // Close comments section to return to video feed
  if (closeCoord) {
    const { x: backX, y: backY } = denormalizeCoords(
      closeCoord,
      clickDims.width,
      clickDims.height
    );
    logInfo(
      `Closing comments section at (${backX}, ${backY}) [normalized: ${closeCoord.xNorm.toFixed(3)}, ${closeCoord.yNorm.toFixed(3)}, screen: ${clickDims.width}x${clickDims.height}]`,
      device.idImouse
    );
    result = await click(device.idImouse, backX, backY);
    if (!result.success) {
      logWarn(`Failed to close comments section: ${result.error}`, device.idImouse);
      // Continue anyway - comment was sent
    } else {
      logInfo(`Close button clicked successfully, waiting for UI transition...`, device.idImouse);
    }

    // Wait for UI to return to video feed (600-900ms)
    await randomSleep(600, 300);
  } else {
    const closeButtonName = platform === 'tiktok' ? 'commentBackButton' : 'commentCloseButton';
    logWarn(`No ${closeButtonName} coordinate configured - comments may remain open`, device.idImouse);
  }

  logInfo('COMMENT executed successfully', device.idImouse);
  return { success: true };
}

/**
 * Execute an action based on type
 */
export async function executeAction(
  device: Device,
  platform: Platform,
  action: ActionType,
  trigger: Trigger
): Promise<{ success: boolean; error?: string }> {
  switch (action) {
    case 'LIKE':
      return executeLike(device, platform);

    case 'SAVE':
      return executeSave(device, platform);

    case 'LIKE_AND_SAVE':
      return executeLikeAndSave(device, platform);

    case 'COMMENT':
      return executeComment(device, platform, trigger);

    case 'LIKE_AND_COMMENT': {
      const likeResult = await executeLike(device, platform);
      if (!likeResult.success) {
        return likeResult;
      }
      await sleep(500); // Brief pause between actions
      return executeComment(device, platform, trigger);
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

/**
 * Sleep with randomized duration to simulate human-like timing
 * @param baseMs - Base delay in milliseconds
 * @param varianceMs - Random variance to add (0 to varianceMs)
 */
function randomSleep(baseMs: number, varianceMs: number = 200): Promise<void> {
  const delay = baseMs + Math.random() * varianceMs;
  return sleep(Math.round(delay));
}
