/**
 * Coordinate normalization and denormalization utilities
 * Normalized coordinates are in the range [0, 1]
 * Absolute coordinates are in pixels based on device resolution
 */

import { NormalizedCoords } from '../types';

/**
 * Convert absolute pixel coordinates to normalized [0-1] coordinates
 */
export function normalizeCoords(
  x: number,
  y: number,
  width: number,
  height: number
): NormalizedCoords {
  return {
    xNorm: Math.max(0, Math.min(1, x / width)),
    yNorm: Math.max(0, Math.min(1, y / height)),
  };
}

/**
 * Convert normalized [0-1] coordinates to absolute pixel coordinates
 */
export function denormalizeCoords(
  coords: NormalizedCoords,
  width: number,
  height: number
): { x: number; y: number } {
  return {
    x: Math.round(coords.xNorm * width),
    y: Math.round(coords.yNorm * height),
  };
}

/**
 * Validate that coordinates are within the normalized range
 */
export function isValidNormalizedCoords(coords: NormalizedCoords): boolean {
  return (
    coords.xNorm >= 0 &&
    coords.xNorm <= 1 &&
    coords.yNorm >= 0 &&
    coords.yNorm <= 1
  );
}

/**
 * Calculate distance between two normalized coordinate points
 */
export function coordDistance(a: NormalizedCoords, b: NormalizedCoords): number {
  const dx = a.xNorm - b.xNorm;
  const dy = a.yNorm - b.yNorm;
  return Math.sqrt(dx * dx + dy * dy);
}
