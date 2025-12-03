/**
 * Frontend API functions for scenario presets
 */

import { ScenarioPreset } from '../types';
import { apiGet, apiPost } from './client';

/**
 * Response types
 */
export interface ScenariosResponse {
  success: boolean;
  scenarios: ScenarioPreset[];
}

export interface ScenarioResponse {
  success: boolean;
  scenario: ScenarioPreset;
}

export interface ApplyScenarioRequest {
  scenarioId: string;
  deviceIds: string[];
}

export interface ApplyScenarioResponse {
  success: boolean;
  message?: string;
}

/**
 * Get all available scenario presets
 */
export async function getScenarios(): Promise<ScenariosResponse> {
  return apiGet<ScenariosResponse>('/api/scenarios');
}

/**
 * Get a specific scenario by ID
 */
export async function getScenario(id: string): Promise<ScenarioResponse> {
  return apiGet<ScenarioResponse>(`/api/scenarios/${id}`);
}

/**
 * Apply a scenario preset to the automation configuration
 * This will replace the current automation settings
 */
export async function applyScenario(
  scenarioId: string,
  deviceIds: string[]
): Promise<ApplyScenarioResponse> {
  return apiPost<ApplyScenarioResponse>('/api/scenarios', {
    scenarioId,
    deviceIds,
  });
}
