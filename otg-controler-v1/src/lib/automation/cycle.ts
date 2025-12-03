/**
 * Single device cycle execution
 * Handles: scroll -> delay -> screenshot -> analyze -> match trigger -> execute action
 */

import { scrollToNextVideo, screenshotAsDataUrl } from '../clients/imouse';
import { analyzeImage, buildAnalysisText } from '../clients/vision';
import { getTriggersForDevice, loadAutomation } from '../storage/automationStore';
import { getDeviceById } from '../storage/deviceStore';
import { Device, AutomationConfig, Platform } from '../types';
import { findAllMatchingTriggers, selectWeightedTrigger, shouldSkipCycle } from '../utils/triggers';
import { logInfo, logError, logWarn } from '../utils/logger';
import { executeAction } from './actions';
import { CycleResult, EngineConfig } from './types';

/**
 * Apply jitter to a delay value
 */
function applyJitter(baseMs: number, config: EngineConfig): number {
  const jitterRange = config.delayJitterMax - config.delayJitterMin;
  const jitter = config.delayJitterMin + Math.random() * jitterRange;
  return Math.round(baseMs * jitter);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate viewing time based on whether content is relevant
 * Returns time in milliseconds
 */
function getViewingTime(hasMatch: boolean, config: AutomationConfig): number {
  if (!config.viewingTime) {
    return 0; // No viewing time configured, skip
  }

  const range = hasMatch
    ? config.viewingTime.relevant
    : config.viewingTime.nonRelevant;

  const minMs = range.minSeconds * 1000;
  const maxMs = range.maxSeconds * 1000;

  // Random time between min and max
  return minMs + Math.random() * (maxMs - minMs);
}

/**
 * Execute a single automation cycle for a device
 */
export async function executeCycle(
  deviceId: string,
  config: EngineConfig,
  platform: Platform
): Promise<CycleResult> {
  const startTime = new Date();

  // Initialize result
  const result: CycleResult = {
    deviceId,
    deviceLabel: deviceId,
    timestamp: startTime,
    success: false,
    scrolled: false,
    analyzed: false,
    skippedByProbability: false,
    skippedByHumanization: false,
  };

  try {
    // Get device info
    logInfo(`[CYCLE DEBUG] Loading device from storage...`, deviceId);
    const device = await getDeviceById(deviceId);
    if (!device) {
      result.error = `Device not found: ${deviceId}`;
      logError(result.error, deviceId);
      return result;
    }
    result.deviceLabel = device.label;

    // DEBUG: Log device dimensions
    logInfo(`[CYCLE DEBUG] Device loaded (platform: ${platform}):`, deviceId);
    logInfo(`[CYCLE DEBUG]   label: ${device.label}`, deviceId);
    logInfo(`[CYCLE DEBUG]   width: ${device.width}, height: ${device.height}`, deviceId);
    logInfo(`[CYCLE DEBUG]   screenWidth: ${device.screenWidth}, screenHeight: ${device.screenHeight}`, deviceId);
    const platformCoords = device.coords[platform];
    logInfo(`[CYCLE DEBUG]   like coords: ${JSON.stringify(platformCoords?.like)}`, deviceId);

    // Check for humanization skip (random skip to appear more human)
    if (shouldSkipCycle(config.skipProbability)) {
      result.skippedByHumanization = true;
      result.success = true;
      logInfo('Cycle skipped for humanization', deviceId);
      return result;
    }

    // Step 1: Scroll to next video
    // Use screenWidth/screenHeight for proper swipe coordinates
    const scrollWidth = device.screenWidth || device.width;
    const scrollHeight = device.screenHeight || device.height;
    logInfo(`Scrolling to next video... (screen: ${scrollWidth}x${scrollHeight})`, deviceId);
    const scrollResult = await scrollToNextVideo(deviceId, scrollWidth, scrollHeight);
    if (!scrollResult.success) {
      result.error = `Scroll failed: ${scrollResult.error}`;
      logError(result.error, deviceId);
      return result;
    }
    result.scrolled = true;

    // Step 2: Wait for video to load (with jitter)
    const scrollDelay = applyJitter(config.scrollDelaySeconds * 1000, config);
    logInfo(`Waiting ${Math.round(scrollDelay / 1000)}s for video to load...`, deviceId);
    await sleep(scrollDelay);

    // Step 3: Take screenshot
    logInfo('Taking screenshot...', deviceId);
    const screenshotResult = await screenshotAsDataUrl(deviceId);
    if (!screenshotResult.success || !screenshotResult.dataUrl) {
      result.error = `Screenshot failed: ${screenshotResult.error}`;
      logError(result.error, deviceId);
      return result;
    }

    // Step 4: Analyze with Vision API
    logInfo('Analyzing screenshot...', deviceId);
    const analysisResult = await analyzeImage(screenshotResult.dataUrl, platform);
    if (!analysisResult.success || !analysisResult.result) {
      result.error = `Vision analysis failed: ${analysisResult.error}`;
      logError(result.error, deviceId);
      // Continue anyway - we'll just skip action
      result.analyzed = false;
    } else {
      result.analyzed = true;
      result.visionResult = analysisResult.result;
      result.analysisText = buildAnalysisText(analysisResult.result);
      logInfo(`Analysis: "${result.visionResult.caption}"`, deviceId);
      logInfo(`Topics: ${result.visionResult.topics.join(', ')}`, deviceId);
    }

    // Step 5: Match triggers (find ALL matching triggers for weighted selection)
    if (result.analyzed && result.analysisText) {
      const triggers = await getTriggersForDevice(deviceId);
      const matchingTriggers = findAllMatchingTriggers(triggers, result.analysisText, deviceId);

      // Step 5a: Calculate and apply viewing time based on match status
      const automation = await loadAutomation();
      const viewingTimeMs = getViewingTime(matchingTriggers.length > 0, automation);

      if (viewingTimeMs > 0) {
        const viewingTimeSec = Math.round(viewingTimeMs / 1000);
        const contentType = matchingTriggers.length > 0 ? 'relevant' : 'non-relevant';
        logInfo(`Simulating viewing time for ${contentType} content: ${viewingTimeSec}s`, deviceId);
        await sleep(viewingTimeMs);
      }

      // Step 5b: Select and execute action using weighted selection
      if (matchingTriggers.length > 0) {
        const selectedTrigger = selectWeightedTrigger(matchingTriggers);

        if (selectedTrigger) {
          result.matchedTrigger = selectedTrigger;
          logInfo(
            `Trigger selected via weighted random: action=${selectedTrigger.action}, ` +
            `keywords=[${selectedTrigger.keywords.slice(0, 3).join(', ')}...]`,
            deviceId
          );

          // Execute the selected action
          result.actionExecuted = selectedTrigger.action;
          const actionResult = await executeAction(device, platform, selectedTrigger.action, selectedTrigger);
          result.actionSuccess = actionResult.success;

          if (!actionResult.success) {
            logWarn(`Action execution failed: ${actionResult.error}`, deviceId);
          }
        }
      } else {
        logInfo('No trigger matched', deviceId);
      }
    }

    result.success = true;
    return result;
  } catch (error) {
    result.error = `Cycle error: ${error instanceof Error ? error.message : String(error)}`;
    logError(result.error, deviceId);
    return result;
  }
}

/**
 * Execute post-action delay before next cycle
 */
export async function postActionDelay(config: EngineConfig): Promise<void> {
  const delay = applyJitter(config.postIntervalSeconds * 1000, config);
  logInfo(`Waiting ${Math.round(delay / 1000)}s before next cycle...`);
  await sleep(delay);
}
