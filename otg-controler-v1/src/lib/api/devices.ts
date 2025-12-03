/**
 * Device API functions
 */

import { apiGet, apiPost } from './client';
import { DevicesResponse, ScreenshotResponse, NormalizedCoords } from './types';

/**
 * Get all devices
 */
export async function getDevices(): Promise<DevicesResponse> {
  console.log('[API] ========== GET /api/devices ==========');
  const response = await apiGet<DevicesResponse>('/api/devices');
  console.log('[API] Response received, devices count:', response.devices?.length);
  response.devices?.forEach((d, i) => {
    console.log(`[API] Device ${i} from API:`, {
      id: d.idImouse,
      screenWidth: d.screenWidth,
      screenHeight: d.screenHeight,
      width: d.width,
      height: d.height,
    });
  });
  return response;
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
  console.log('[API] ========== POST /api/devices/:id/coords ==========');
  console.log('[API] Sending pixel coords:', { deviceId, action, x, y });
  const response = await apiPost<{ success: boolean; error?: string }>(`/api/devices/${deviceId}/coords`, { action, x, y });
  console.log('[API] Response:', response);
  return response;
}

/**
 * Get device screenshot
 */
export async function getDeviceScreenshot(deviceId: string): Promise<ScreenshotResponse> {
  return apiGet<ScreenshotResponse>(`/api/devices/${deviceId}/screenshot`);
}
