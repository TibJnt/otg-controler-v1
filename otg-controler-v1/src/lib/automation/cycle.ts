/**
 * Single device cycle execution
 * Handles: scroll -> delay -> screenshot -> analyze -> match trigger -> execute action
 */

import { scrollToNextVideo, screenshotAsDataUrl } from '../clients/imouse';
import { analyzeImage, buildAnalysisText } from '../clients/vision';
import { getTriggersForDevice } from '../storage/automationStore';
import { getDeviceById } from '../storage/deviceStore';
import { Device } from '../types';
import { findMatchingTrigger, shouldExecuteAction, shouldSkipCycle } from '../utils/triggers';
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
 * Execute a single automation cycle for a device
 */
export async function executeCycle(
  deviceId: string,
  config: EngineConfig
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
    const device = await getDeviceById(deviceId);
    if (!device) {
      result.error = `Device not found: ${deviceId}`;
      logError(result.error, deviceId);
      return result;
    }
    result.deviceLabel = device.label;

    // Check for humanization skip (random skip to appear more human)
    if (shouldSkipCycle(config.skipProbability)) {
      result.skippedByHumanization = true;
      result.success = true;
      logInfo('Cycle skipped for humanization', deviceId);
      return result;
    }

    // Step 1: Scroll to next video
    logInfo('Scrolling to next video...', deviceId);
    const scrollResult = await scrollToNextVideo(deviceId);
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
    const analysisResult = await analyzeImage(screenshotResult.dataUrl);
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

    // Step 5: Match triggers
    if (result.analyzed && result.analysisText) {
      const triggers = await getTriggersForDevice(deviceId);
      const matchedTrigger = findMatchingTrigger(triggers, result.analysisText, deviceId);

      if (matchedTrigger) {
        result.matchedTrigger = matchedTrigger;
        logInfo(`Trigger matched: action=${matchedTrigger.action}, keywords=[${matchedTrigger.keywords.join(', ')}]`, deviceId);

        // Check probability
        const probability = matchedTrigger.probability ?? 1;
        if (!shouldExecuteAction(probability)) {
          result.skippedByProbability = true;
          logInfo(`Action skipped by probability (${probability})`, deviceId);
        } else {
          // Step 6: Execute action
          result.actionExecuted = matchedTrigger.action;
          const actionResult = await executeAction(device, matchedTrigger.action, matchedTrigger);
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
