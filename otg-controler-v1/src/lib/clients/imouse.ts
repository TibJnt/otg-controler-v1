/**
 * iMouseXP API client wrapper
 * Based on Some3C XP API Documentation
 */

import { imousePost } from '../utils/http';

// Response types from iMouseXP API
export interface ImouseDevice {
  deviceid: string;
  device_name: string;
  width: number | string;      // Logical width (CSS points)
  height: number | string;     // Logical height (CSS points)
  imgw?: number;               // Actual screen/touch width in pixels
  imgh?: number;               // Actual screen/touch height in pixels
  gname?: string;
  state?: number | string;
}

export interface DeviceListResponse {
  list: ImouseDevice[];
}

export interface ScreenshotResponse {
  image?: string;  // base64 encoded image data
  path?: string;
  code?: number;
  message?: string;
}

/**
 * Get list of connected devices
 * Endpoint: /device/get
 */
export async function listDevices(): Promise<{
  success: boolean;
  devices?: ImouseDevice[];
  error?: string;
}> {
  const response = await imousePost<DeviceListResponse>('/device/get');

  if (!response.success) {
    return { success: false, error: response.error };
  }

  return {
    success: true,
    devices: response.data?.list || [],
  };
}

/**
 * Perform a mouse click at specified coordinates
 * Endpoint: /mouse/click
 */
export async function click(
  deviceId: string,
  x: number,
  y: number,
  options: {
    button?: 'left' | 'right';
    count?: number;
  } = {}
): Promise<{ success: boolean; error?: string }> {
  const payload = {
    id: deviceId,
    x: Math.round(x),
    y: Math.round(y),
    button: options.button || 'left',
    count: options.count || 1,
  };
  
  console.log(`[iMouseXP CLICK] Sending click to device ${deviceId}:`);
  console.log(`[iMouseXP CLICK] Payload: ${JSON.stringify(payload)}`);
  
  const response = await imousePost('/mouse/click', payload);
  
  console.log(`[iMouseXP CLICK] Response success: ${response.success}, error: ${response.error || 'none'}`);

  return {
    success: response.success,
    error: response.error,
  };
}

/**
 * Perform a swipe gesture using /mouse/swipe endpoint
 * @param deviceId - Device ID
 * @param x - Starting X position
 * @param y - Starting Y position  
 * @param direction - Swipe direction: 'up', 'down', 'left', 'right'
 * @param length - Distance to swipe in pixels
 */
export async function swipe(
  deviceId: string,
  x: number,
  y: number,
  direction: 'up' | 'down' | 'left' | 'right',
  length: number
): Promise<{ success: boolean; error?: string }> {
  const payload = {
    id: deviceId,
    x: Math.round(x),
    y: Math.round(y),
    direction,
    length: Math.round(length),
  };
  
  console.log(`[iMouseXP SWIPE] Sending swipe to device ${deviceId}:`);
  console.log(`[iMouseXP SWIPE] Start (${payload.x}, ${payload.y}), direction: ${direction}, length: ${payload.length}`);
  
  const response = await imousePost('/mouse/swipe', payload);
  
  console.log(`[iMouseXP SWIPE] Response success: ${response.success}, error: ${response.error || 'none'}`);

  return {
    success: response.success,
    error: response.error,
  };
}

/**
 * Scroll to next video (swipe up from center of screen)
 * @param deviceId - Device ID
 * @param screenWidth - Width of screen in pixels (default 608)
 * @param screenHeight - Height of screen in pixels (default 1080)
 */
export async function scrollToNextVideo(
  deviceId: string,
  screenWidth: number = 608,
  screenHeight: number = 1080
): Promise<{ success: boolean; error?: string }> {
  // Start from center of screen, swipe up
  const centerX = Math.round(screenWidth / 2);
  const startY = Math.round(screenHeight * 0.7);  // 70% from top
  const swipeLength = Math.round(screenHeight * 0.5);  // Swipe 50% of screen height
  
  console.log(`[SCROLL] Scrolling to next video: start (${centerX}, ${startY}), direction: up, length: ${swipeLength}`);
  
  return swipe(deviceId, centerX, startY, 'up', swipeLength);
}

/**
 * Input text via keyboard
 * Endpoint: /key/sendkey
 * Note: Only supports English letters, numbers, and basic ASCII characters
 */
export async function keyboardInput(
  deviceId: string,
  text: string
): Promise<{ success: boolean; error?: string }> {
  const response = await imousePost('/key/sendkey', {
    id: deviceId,
    key: text,
  });

  return {
    success: response.success,
    error: response.error,
  };
}

/**
 * Take a screenshot of the device
 * Endpoint: /pic/screenshot
 * 
 * Note: When binary=true, iMouseXP returns raw image data, not JSON.
 * We handle this by setting binary=false to get base64 in JSON response.
 */
export async function screenshot(
  deviceId: string,
  options: {
    jpg?: boolean;
    savePath?: string;
    rect?: { x: number; y: number; width: number; height: number };
  } = {}
): Promise<{
  success: boolean;
  base64?: string;
  path?: string;
  error?: string;
}> {
  // Use binary: false to get JSON response with base64
  const response = await imousePost<ScreenshotResponse>('/pic/screenshot', {
    id: deviceId,
    binary: false,
    jpg: options.jpg ?? true,
    save_path: options.savePath,
    rect: options.rect,
  });

  if (!response.success) {
    return { success: false, error: response.error };
  }

  return {
    success: true,
    base64: response.data?.image,
    path: response.data?.path,
  };
}

/**
 * Take a screenshot and return as base64 data URL
 */
export async function screenshotAsDataUrl(
  deviceId: string
): Promise<{ success: boolean; dataUrl?: string; error?: string }> {
  const result = await screenshot(deviceId, { jpg: true });

  if (!result.success || !result.base64) {
    return { success: false, error: result.error || 'No screenshot data returned' };
  }

  return {
    success: true,
    dataUrl: `data:image/jpeg;base64,${result.base64}`,
  };
}
