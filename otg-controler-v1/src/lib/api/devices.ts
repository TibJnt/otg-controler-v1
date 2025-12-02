/**
 * Device API functions
 */

import { apiGet, apiPost } from './client';
import { DevicesResponse, ScreenshotResponse, NormalizedCoords } from './types';

/**
 * Get all devices
 */
export async function getDevices(): Promise<DevicesResponse> {
  return apiGet<DevicesResponse>('/api/devices');
}

/**
 * Refresh devices from iMouseXP
 */
export async function refreshDevices(): Promise<DevicesResponse> {
  return apiPost<DevicesResponse>('/api/devices');
}

/**
 * Update device coordinates (normalized)
 */
export async function updateDeviceCoords(
  deviceId: string,
  action: 'like' | 'comment' | 'save' | 'commentSendButton' | 'commentInputField',
  coords: NormalizedCoords
): Promise<{ success: boolean; error?: string }> {
  return apiPost(`/api/devices/${deviceId}/coords`, { action, coords });
}

/**
 * Update device coordinates from pixels
 */
export async function updateDeviceCoordsFromPixels(
  deviceId: string,
  action: 'like' | 'comment' | 'save' | 'commentSendButton' | 'commentInputField',
  x: number,
  y: number
): Promise<{ success: boolean; error?: string }> {
  return apiPost(`/api/devices/${deviceId}/coords`, { action, x, y });
}

/**
 * Get device screenshot
 */
export async function getDeviceScreenshot(deviceId: string): Promise<ScreenshotResponse> {
  return apiGet<ScreenshotResponse>(`/api/devices/${deviceId}/screenshot`);
}
