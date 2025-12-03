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
 * Find ALL matching triggers for given analysis text and device
 * Returns array of all triggers that match (empty array if none match)
 * Used for weighted random selection in scenarios
 */
export function findAllMatchingTriggers(
  triggers: Trigger[],
  analysisText: string,
  deviceId: string
): Trigger[] {
  const matches: Trigger[] = [];

  for (const trigger of triggers) {
    // Check if trigger applies to this device
    const appliesToDevice =
      !trigger.deviceIds || trigger.deviceIds.length === 0 || trigger.deviceIds.includes(deviceId);

    if (!appliesToDevice) {
      continue;
    }

    // Check if keywords match
    if (matchesKeywords(analysisText, trigger.keywords)) {
      matches.push(trigger);
    }
  }

  return matches;
}

/**
 * Select a trigger from array using weighted random selection
 * Uses trigger.probability as weight
 * Returns null if array is empty
 */
export function selectWeightedTrigger(triggers: Trigger[]): Trigger | null {
  if (triggers.length === 0) return null;
  if (triggers.length === 1) return triggers[0];

  // Calculate total weight (sum of all probabilities)
  const totalWeight = triggers.reduce((sum, t) => sum + (t.probability ?? 1), 0);

  // Handle edge case: all probabilities are 0
  if (totalWeight === 0) {
    return triggers[0]; // Fallback to first trigger
  }

  // Generate random value between 0 and totalWeight
  let random = Math.random() * totalWeight;

  // Iterate and subtract weights until random <= 0
  for (const trigger of triggers) {
    random -= (trigger.probability ?? 1);
    if (random <= 0) {
      return trigger;
    }
  }

  // Fallback (should not reach here due to math, but safety)
  return triggers[triggers.length - 1];
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
