/**
 * Automation engine - singleton that manages the automation loop
 */

import { loadAutomation, setRunningStatus } from '../storage/automationStore';
import { loadDevices } from '../storage/deviceStore';
import { getConfig } from '../config';
import { Device, Platform } from '../types';
import { logInfo, logError, logWarn } from '../utils/logger';
import { executeCycle, postActionDelay } from './cycle';
import { EngineState, EngineConfig, CycleResult, CycleCallback } from './types';

// Singleton engine state
let engineState: EngineState = {
  status: 'idle',
  cycleCount: 0,
  errors: [],
};

// Callback for cycle completion
let cycleCallback: CycleCallback | null = null;

/**
 * Get current engine state
 */
export function getEngineState(): EngineState {
  return { ...engineState };
}

/**
 * Set callback for cycle completion events
 */
export function onCycleComplete(callback: CycleCallback | null): void {
  cycleCallback = callback;
}

/**
 * Check if engine is running
 */
export function isEngineRunning(): boolean {
  return engineState.status === 'running';
}

/**
 * Start the automation engine
 */
export async function startEngine(): Promise<{
  success: boolean;
  error?: string;
  warnings?: string[];
}> {
  if (engineState.status === 'running') {
    return { success: false, error: 'Engine is already running' };
  }

  if (engineState.status === 'stopping') {
    return { success: false, error: 'Engine is currently stopping, please wait' };
  }

  const warnings: string[] = [];

  // Load configuration
  const automation = await loadAutomation();
  const devices = await loadDevices();
  const appConfig = getConfig();

  // Validate devices
  if (automation.deviceIds.length === 0) {
    return { success: false, error: 'No devices selected for automation' };
  }

  // Get platform from automation config
  const platform: Platform = automation.platform;

  // Filter to valid devices (must have like coords for the selected platform)
  const validDevices: Device[] = [];
  for (const deviceId of automation.deviceIds) {
    const device = devices.find((d) => d.idImouse === deviceId);
    if (!device) {
      warnings.push(`Device ${deviceId} not found, skipping`);
      continue;
    }
    const platformCoords = device.coords[platform];
    if (!platformCoords?.like) {
      warnings.push(`Device ${device.label} missing ${platform} like coordinates, skipping`);
      continue;
    }
    validDevices.push(device);
  }

  if (validDevices.length === 0) {
    return { success: false, error: `No valid devices available for ${platform} automation` };
  }

  // Check triggers
  if (automation.triggers.length === 0) {
    warnings.push('No triggers configured, automation will only scroll');
  }

  // Update state
  engineState = {
    status: 'running',
    cycleCount: 0,
    startedAt: new Date(),
    errors: [],
  };

  // Update storage running flag
  await setRunningStatus('running');

  logInfo(`Automation started with ${validDevices.length} device(s) for ${platform}`);

  // Build engine config
  const engineConfig: EngineConfig = {
    postIntervalSeconds: automation.postIntervalSeconds,
    scrollDelaySeconds: automation.scrollDelaySeconds,
    delayJitterMin: appConfig.delayJitterMin,
    delayJitterMax: appConfig.delayJitterMax,
    skipProbability: appConfig.skipProbability,
  };

  // Start the main loop (non-blocking)
  runMainLoop(validDevices, engineConfig, platform);

  return { success: true, warnings: warnings.length > 0 ? warnings : undefined };
}

/**
 * Stop the automation engine
 */
export async function stopEngine(): Promise<{ success: boolean; error?: string }> {
  if (engineState.status === 'idle') {
    return { success: false, error: 'Engine is not running' };
  }

  if (engineState.status === 'stopping') {
    return { success: false, error: 'Engine is already stopping' };
  }

  logInfo('Stopping automation...');
  engineState.status = 'stopping';

  // Update storage running flag
  await setRunningStatus('stopped');

  return { success: true };
}

/**
 * Emergency stop - immediately halt
 */
export async function emergencyStop(): Promise<void> {
  logWarn('EMERGENCY STOP triggered');
  engineState.status = 'idle';
  engineState.currentDeviceId = undefined;
  engineState.currentDeviceLabel = undefined;
  await setRunningStatus('stopped');
}

/**
 * Main automation loop
 */
async function runMainLoop(devices: Device[], config: EngineConfig, platform: Platform): Promise<void> {
  logInfo(`Main loop started for ${platform}`);

  try {
    while (engineState.status === 'running') {
      // Iterate through all devices
      for (const device of devices) {
        // Check if we should stop
        if (engineState.status !== 'running') {
          break;
        }

        // Update current device
        engineState.currentDeviceId = device.idImouse;
        engineState.currentDeviceLabel = device.label;

        logInfo(`Processing device: ${device.label}`, device.idImouse);

        // Execute cycle for this device
        const result = await executeCycle(device.idImouse, config, platform);

        // Update state
        engineState.cycleCount++;
        engineState.lastCycleResult = result;

        if (!result.success && result.error) {
          engineState.errors.push(result.error);
          // Keep only last 10 errors
          if (engineState.errors.length > 10) {
            engineState.errors.shift();
          }
        }

        // Notify callback
        if (cycleCallback) {
          try {
            cycleCallback(result);
          } catch (err) {
            logError(`Cycle callback error: ${err}`);
          }
        }

        // Check again if we should stop
        if (engineState.status !== 'running') {
          break;
        }

        // Post-action delay before next device
        await postActionDelay(config);
      }
    }
  } catch (error) {
    logError(`Main loop error: ${error instanceof Error ? error.message : String(error)}`);
    engineState.errors.push(String(error));
  } finally {
    // Clean up
    engineState.status = 'idle';
    engineState.currentDeviceId = undefined;
    engineState.currentDeviceLabel = undefined;
    await setRunningStatus('stopped');
    logInfo('Automation stopped');
  }
}

/**
 * Get automation statistics
 */
export function getEngineStats(): {
  status: string;
  cycleCount: number;
  uptime: number | null;
  currentDevice: string | null;
  recentErrors: string[];
} {
  return {
    status: engineState.status,
    cycleCount: engineState.cycleCount,
    uptime: engineState.startedAt
      ? Math.round((Date.now() - engineState.startedAt.getTime()) / 1000)
      : null,
    currentDevice: engineState.currentDeviceLabel || null,
    recentErrors: [...engineState.errors],
  };
}
