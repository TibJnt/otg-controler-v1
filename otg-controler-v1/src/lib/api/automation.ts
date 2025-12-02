/**
 * Automation API functions
 */

import { apiGet, apiPost, apiDelete } from './client';
import {
  AutomationResponse,
  AutomationConfig,
  TriggersResponse,
  StartStopResponse,
  HealthResponse,
  LogsResponse,
  ActionType,
} from './types';

/**
 * Get automation configuration
 */
export async function getAutomation(): Promise<AutomationResponse> {
  return apiGet<AutomationResponse>('/api/automation');
}

/**
 * Update automation configuration
 */
export async function updateAutomation(
  config: Partial<AutomationConfig>
): Promise<AutomationResponse> {
  return apiPost<AutomationResponse>('/api/automation', config);
}

/**
 * Start automation
 */
export async function startAutomation(): Promise<StartStopResponse> {
  return apiPost<StartStopResponse>('/api/automation/start');
}

/**
 * Stop automation
 */
export async function stopAutomation(emergency = false): Promise<StartStopResponse> {
  const endpoint = emergency ? '/api/automation/stop?emergency=true' : '/api/automation/stop';
  return apiPost<StartStopResponse>(endpoint);
}

/**
 * Get all triggers
 */
export async function getTriggers(): Promise<TriggersResponse> {
  return apiGet<TriggersResponse>('/api/triggers');
}

/**
 * Create a new trigger
 */
export async function createTrigger(trigger: {
  action: ActionType;
  keywordsInput: string;
  deviceIds?: string[];
  commentTemplates?: string[];
  commentLanguage?: 'fr' | 'en';
  probability?: number;
}): Promise<TriggersResponse> {
  return apiPost<TriggersResponse>('/api/triggers', trigger);
}

/**
 * Update an existing trigger
 */
export async function updateTrigger(
  id: string,
  updates: Partial<{
    action: ActionType;
    keywordsInput: string;
    deviceIds: string[];
    commentTemplates: string[];
    commentLanguage: 'fr' | 'en';
    probability: number;
  }>
): Promise<TriggersResponse> {
  return apiPost<TriggersResponse>('/api/triggers', { id, ...updates });
}

/**
 * Delete a trigger
 */
export async function deleteTrigger(id: string): Promise<TriggersResponse> {
  return apiDelete<TriggersResponse>('/api/triggers', { id });
}

/**
 * Get health status
 */
export async function getHealth(): Promise<HealthResponse> {
  return apiGet<HealthResponse>('/api/health');
}

/**
 * Get recent logs
 */
export async function getLogs(count = 50): Promise<LogsResponse> {
  return apiGet<LogsResponse>(`/api/logs?count=${count}`);
}

/**
 * Clear logs
 */
export async function clearLogs(): Promise<{ success: boolean; message?: string }> {
  return apiDelete('/api/logs');
}
