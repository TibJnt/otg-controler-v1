/**
 * Scenario storage layer
 * Handles loading and applying scenario presets
 */

import fs from 'fs/promises';
import path from 'path';
import { ScenarioPreset, Trigger, AutomationConfig } from '../types';
import { ScenariosFileSchema, DEFAULT_SCENARIOS } from '../schema';
import { saveAutomation, loadAutomation, generateTriggerId } from './automationStore';

const SCENARIOS_FILE = path.join(process.cwd(), 'data', 'scenarios.json');

/**
 * Load all scenario presets from file
 */
export async function loadScenarios(): Promise<ScenarioPreset[]> {
  try {
    const data = await fs.readFile(SCENARIOS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    const validated = ScenariosFileSchema.parse(parsed);
    return validated.scenarios;
  } catch (error: any) {
    // If file doesn't exist or is invalid, return empty array
    if (error?.code === 'ENOENT') {
      console.log('[SCENARIOS] File not found, returning empty array');
      return [];
    }
    console.error('[SCENARIOS] Error loading scenarios:', error);
    return [];
  }
}

/**
 * Get a specific scenario by ID
 */
export async function getScenarioById(scenarioId: string): Promise<ScenarioPreset | null> {
  const scenarios = await loadScenarios();
  return scenarios.find(s => s.id === scenarioId) || null;
}

/**
 * Apply a scenario to the current automation config
 * This replaces timing settings, viewing time, and triggers
 * Device IDs are provided separately and not part of the scenario
 */
export async function applyScenarioToAutomation(
  scenarioId: string,
  deviceIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // Load scenario
    const scenario = await getScenarioById(scenarioId);
    if (!scenario) {
      return { success: false, error: `Scenario not found: ${scenarioId}` };
    }

    // Load current automation to preserve some fields
    const currentAutomation = await loadAutomation();

    // Convert scenario trigger templates to full triggers with generated IDs
    const triggers: Trigger[] = scenario.triggers.map(template => ({
      id: generateTriggerId(),
      action: template.action,
      keywords: [...template.keywords], // Copy array
      probability: template.probability,
      commentTemplates: template.commentTemplates ? [...template.commentTemplates] : undefined,
      commentLanguage: template.commentLanguage,
      // No deviceIds filter - apply to all devices in automation
    }));

    // Build new automation config
    const newConfig: AutomationConfig = {
      name: `${scenario.name} - ${new Date().toLocaleDateString()}`,
      deviceIds: deviceIds.length > 0 ? deviceIds : currentAutomation.deviceIds,
      postIntervalSeconds: scenario.config.postIntervalSeconds,
      scrollDelaySeconds: scenario.config.scrollDelaySeconds,
      viewingTime: {
        relevant: {
          minSeconds: scenario.config.viewingTime.relevant.minSeconds,
          maxSeconds: scenario.config.viewingTime.relevant.maxSeconds,
        },
        nonRelevant: {
          minSeconds: scenario.config.viewingTime.nonRelevant.minSeconds,
          maxSeconds: scenario.config.viewingTime.nonRelevant.maxSeconds,
        },
      },
      triggers,
      running: 'stopped', // Always stopped when applying scenario
    };

    // Save to automation.json
    await saveAutomation(newConfig);

    return { success: true };
  } catch (error) {
    console.error('[SCENARIOS] Error applying scenario:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Initialize scenarios file if it doesn't exist
 */
export async function ensureScenariosFile(): Promise<void> {
  try {
    await fs.access(SCENARIOS_FILE);
  } catch {
    // File doesn't exist, create it
    const dataDir = path.dirname(SCENARIOS_FILE);
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(
      SCENARIOS_FILE,
      JSON.stringify(DEFAULT_SCENARIOS, null, 2),
      'utf-8'
    );
    console.log('[SCENARIOS] Created scenarios.json with defaults');
  }
}
