/**
 * Trigger matching and keyword utilities
 */

import { Trigger } from '../types';

/**
 * Parse keywords from comma-separated input string
 * Normalizes to lowercase and trims whitespace
 */
export function parseKeywords(input: string): string[] {
  return input
    .split(',')
    .map((k) => k.trim().toLowerCase())
    .filter((k) => k.length > 0);
}

/**
 * Check if any keyword matches in the analysis text
 * Case-insensitive matching
 */
export function matchesKeywords(analysisText: string, keywords: string[]): boolean {
  const lowerText = analysisText.toLowerCase();
  return keywords.some((keyword) => lowerText.includes(keyword.toLowerCase()));
}

/**
 * Find the first matching trigger for given analysis text and device
 * Returns null if no trigger matches
 */
export function findMatchingTrigger(
  triggers: Trigger[],
  analysisText: string,
  deviceId: string
): Trigger | null {
  for (const trigger of triggers) {
    // Check if trigger applies to this device
    const appliesToDevice =
      !trigger.deviceIds || trigger.deviceIds.length === 0 || trigger.deviceIds.includes(deviceId);

    if (!appliesToDevice) {
      continue;
    }

    // Check if keywords match
    if (matchesKeywords(analysisText, trigger.keywords)) {
      return trigger;
    }
  }

  return null;
}

/**
 * Determine if action should be executed based on probability
 * Returns true if action should proceed
 */
export function shouldExecuteAction(probability: number = 1): boolean {
  return Math.random() < probability;
}

/**
 * Determine if this cycle should be skipped for humanization
 * @param skipProbability - Probability to skip (0-1)
 */
export function shouldSkipCycle(skipProbability: number = 0): boolean {
  return Math.random() < skipProbability;
}

/**
 * Get a random comment template from the list
 */
export function getRandomComment(templates: string[]): string | null {
  if (!templates || templates.length === 0) {
    return null;
  }
  const index = Math.floor(Math.random() * templates.length);
  return templates[index];
}

/**
 * Validate trigger keywords are not empty
 */
export function validateTriggerKeywords(keywords: string[]): boolean {
  return keywords.length > 0 && keywords.every((k) => k.trim().length > 0);
}
