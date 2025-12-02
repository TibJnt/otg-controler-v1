/**
 * Automation configuration service
 * Manages automation settings, triggers, and running state
 */

import {
  loadAutomation,
  saveAutomation,
  setRunningStatus,
  getRunningStatus,
  upsertTrigger as storageUpsertTrigger,
  removeTrigger as storageRemoveTrigger,
  getTriggers,
  getTriggersForDevice,
  generateTriggerId,
} from '../storage/automationStore';
import { loadDevices } from '../storage/deviceStore';
import { AutomationConfig, AutomationStatus, Trigger, ActionType } from '../types';
import { parseKeywords, validateTriggerKeywords } from '../utils/triggers';

/**
 * Get current automation configuration
 */
export async function getAutomation(): Promise<AutomationConfig> {
  return loadAutomation();
}

/**
 * Save full automation configuration
 */
export async function updateAutomation(
  config: Partial<AutomationConfig>
): Promise<{ success: boolean; error?: string }> {
  const current = await loadAutomation();
  const updated: AutomationConfig = {
    ...current,
    ...config,
  };
  return saveAutomation(updated);
}

/**
 * Update automation name
 */
export async function setAutomationName(
  name: string
): Promise<{ success: boolean; error?: string }> {
  return updateAutomation({ name });
}

/**
 * Update timing settings
 */
export async function setTimingSettings(settings: {
  postIntervalSeconds?: number;
  scrollDelaySeconds?: number;
}): Promise<{ success: boolean; error?: string }> {
  return updateAutomation(settings);
}

/**
 * Update selected device IDs for automation
 */
export async function setSelectedDevices(
  deviceIds: string[]
): Promise<{ success: boolean; error?: string }> {
  return updateAutomation({ deviceIds });
}

/**
 * Set automation running status
 */
export async function setRunning(
  status: AutomationStatus
): Promise<{ success: boolean; error?: string }> {
  return setRunningStatus(status);
}

/**
 * Get current running status
 */
export async function isRunning(): Promise<boolean> {
  const status = await getRunningStatus();
  return status === 'running';
}

/**
 * Start automation
 * Validates that there are devices selected and coords configured
 */
export async function startAutomation(): Promise<{
  success: boolean;
  error?: string;
  warnings?: string[];
}> {
  const config = await loadAutomation();
  const devices = await loadDevices();
  const warnings: string[] = [];

  // Check if any devices are selected
  if (config.deviceIds.length === 0) {
    return { success: false, error: 'No devices selected for automation' };
  }

  // Validate selected devices exist and have coordinates
  const validDeviceIds: string[] = [];
  for (const deviceId of config.deviceIds) {
    const device = devices.find((d) => d.idImouse === deviceId);
    if (!device) {
      warnings.push(`Device ${deviceId} not found, skipping`);
      continue;
    }
    if (!device.coords.like) {
      warnings.push(`Device ${device.label} missing like coordinates, skipping`);
      continue;
    }
    validDeviceIds.push(deviceId);
  }

  if (validDeviceIds.length === 0) {
    return { success: false, error: 'No valid devices available for automation' };
  }

  // Update running status
  const result = await setRunningStatus('running');
  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true, warnings: warnings.length > 0 ? warnings : undefined };
}

/**
 * Stop automation
 */
export async function stopAutomation(): Promise<{ success: boolean; error?: string }> {
  return setRunningStatus('stopped');
}

/**
 * Create a new trigger from UI input
 */
export async function createTrigger(input: {
  action: ActionType;
  keywordsInput: string; // Comma-separated keywords
  deviceIds?: string[];
  commentTemplates?: string[];
  commentLanguage?: 'fr' | 'en';
  probability?: number;
}): Promise<{ success: boolean; trigger?: Trigger; error?: string }> {
  const keywords = parseKeywords(input.keywordsInput);

  if (!validateTriggerKeywords(keywords)) {
    return { success: false, error: 'At least one valid keyword is required' };
  }

  const trigger: Trigger = {
    id: generateTriggerId(),
    action: input.action,
    keywords,
    deviceIds: input.deviceIds,
    commentTemplates: input.commentTemplates,
    commentLanguage: input.commentLanguage,
    probability: input.probability ?? 1,
  };

  const result = await storageUpsertTrigger(trigger);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true, trigger };
}

/**
 * Update an existing trigger
 */
export async function updateTrigger(
  triggerId: string,
  updates: Partial<Omit<Trigger, 'id'>> & { keywordsInput?: string }
): Promise<{ success: boolean; error?: string }> {
  const triggers = await getTriggers();
  const existing = triggers.find((t) => t.id === triggerId);

  if (!existing) {
    return { success: false, error: `Trigger not found: ${triggerId}` };
  }

  // Parse keywords if provided as string
  let keywords = existing.keywords;
  if (updates.keywordsInput !== undefined) {
    keywords = parseKeywords(updates.keywordsInput);
    if (!validateTriggerKeywords(keywords)) {
      return { success: false, error: 'At least one valid keyword is required' };
    }
  } else if (updates.keywords) {
    keywords = updates.keywords;
  }

  const updated: Trigger = {
    ...existing,
    ...updates,
    keywords,
    id: triggerId, // Ensure ID doesn't change
  };

  return storageUpsertTrigger(updated);
}

/**
 * Delete a trigger
 */
export async function deleteTrigger(
  triggerId: string
): Promise<{ success: boolean; error?: string }> {
  return storageRemoveTrigger(triggerId);
}

/**
 * Get all triggers
 */
export async function getAllTriggers(): Promise<Trigger[]> {
  return getTriggers();
}

/**
 * Get triggers applicable to a specific device
 */
export async function getDeviceTriggers(deviceId: string): Promise<Trigger[]> {
  return getTriggersForDevice(deviceId);
}

/**
 * Get active devices (selected and valid) for current automation config
 */
export async function getActiveDevices(): Promise<string[]> {
  const config = await loadAutomation();
  const devices = await loadDevices();

  return config.deviceIds.filter((deviceId) => {
    const device = devices.find((d) => d.idImouse === deviceId);
    return device && device.coords.like;
  });
}
