/**
 * Automation config storage helpers for reading/writing automation.json
 */

import { getConfig } from '../config';
import {
  AutomationConfigSchema,
  AutomationConfigSchemaType,
  TriggerSchema,
  DEFAULT_AUTOMATION_CONFIG,
} from '../schema';
import { AutomationConfig, AutomationStatus, Trigger } from '../types';
import { readJsonFile, writeJsonFile } from './jsonStore';

/**
 * Load automation config from automation.json
 */
export async function loadAutomation(): Promise<AutomationConfig> {
  const config = getConfig();
  return readJsonFile(config.automationFilePath, AutomationConfigSchema, DEFAULT_AUTOMATION_CONFIG);
}

/**
 * Save automation config to automation.json
 */
export async function saveAutomation(
  automation: AutomationConfig
): Promise<{ success: boolean; error?: string }> {
  const config = getConfig();
  return writeJsonFile(config.automationFilePath, automation, AutomationConfigSchema);
}

/**
 * Update automation name
 */
export async function updateAutomationName(
  name: string
): Promise<{ success: boolean; error?: string }> {
  const automation = await loadAutomation();
  automation.name = name;
  return saveAutomation(automation);
}

/**
 * Update selected device IDs for automation
 */
export async function updateSelectedDevices(
  deviceIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const automation = await loadAutomation();
  automation.deviceIds = deviceIds;
  return saveAutomation(automation);
}

/**
 * Update timing settings
 */
export async function updateTimingSettings(settings: {
  postIntervalSeconds?: number;
  scrollDelaySeconds?: number;
}): Promise<{ success: boolean; error?: string }> {
  const automation = await loadAutomation();

  if (settings.postIntervalSeconds !== undefined) {
    automation.postIntervalSeconds = settings.postIntervalSeconds;
  }
  if (settings.scrollDelaySeconds !== undefined) {
    automation.scrollDelaySeconds = settings.scrollDelaySeconds;
  }

  return saveAutomation(automation);
}

/**
 * Set automation running status
 */
export async function setRunningStatus(
  status: AutomationStatus
): Promise<{ success: boolean; error?: string }> {
  const automation = await loadAutomation();
  automation.running = status;
  return saveAutomation(automation);
}

/**
 * Get current running status
 */
export async function getRunningStatus(): Promise<AutomationStatus> {
  const automation = await loadAutomation();
  return automation.running;
}

/**
 * Add or update a trigger
 * If trigger with same ID exists, updates it; otherwise adds new
 */
export async function upsertTrigger(
  trigger: Trigger
): Promise<{ success: boolean; error?: string }> {
  // Validate the trigger
  const validated = TriggerSchema.safeParse(trigger);
  if (!validated.success) {
    return {
      success: false,
      error: `Invalid trigger: ${validated.error.issues.map((e) => e.message).join(', ')}`,
    };
  }

  const automation = await loadAutomation();
  const existingIndex = automation.triggers.findIndex((t) => t.id === trigger.id);

  if (existingIndex >= 0) {
    automation.triggers[existingIndex] = validated.data;
  } else {
    automation.triggers.push(validated.data);
  }

  return saveAutomation(automation);
}

/**
 * Remove a trigger by ID
 */
export async function removeTrigger(
  triggerId: string
): Promise<{ success: boolean; error?: string }> {
  const automation = await loadAutomation();
  const filtered = automation.triggers.filter((t) => t.id !== triggerId);

  if (filtered.length === automation.triggers.length) {
    return { success: false, error: `Trigger not found: ${triggerId}` };
  }

  automation.triggers = filtered;
  return saveAutomation(automation);
}

/**
 * Get all triggers
 */
export async function getTriggers(): Promise<Trigger[]> {
  const automation = await loadAutomation();
  return automation.triggers;
}

/**
 * Get triggers applicable to a specific device
 * Returns triggers that either have no deviceIds (apply to all) or include the device
 */
export async function getTriggersForDevice(deviceId: string): Promise<Trigger[]> {
  const automation = await loadAutomation();
  return automation.triggers.filter(
    (t) => !t.deviceIds || t.deviceIds.length === 0 || t.deviceIds.includes(deviceId)
  );
}

/**
 * Generate a unique trigger ID
 */
export function generateTriggerId(): string {
  return `trigger_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Parse keywords from comma-separated string (from UI input)
 */
export function parseKeywords(input: string): string[] {
  return input
    .split(',')
    .map((k) => k.trim().toLowerCase())
    .filter((k) => k.length > 0);
}
