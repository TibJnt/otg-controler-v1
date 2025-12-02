/**
 * iMouseXP API client wrapper
 * Based on Some3C XP API Documentation
 */

import { imousePost } from '../utils/http';

// Response types from iMouseXP API
export interface ImouseDevice {
  deviceid: string;
  device_name: string;
  width: number;
  height: number;
  gname?: string;
  state?: string;
}

export interface DeviceListResponse {
  list: ImouseDevice[];
}

export interface ScreenshotResponse {
  base64?: string;
  path?: string;
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
  const response = await imousePost('/mouse/click', {
    id: deviceId,
    x: Math.round(x),
    y: Math.round(y),
    button: options.button || 'left',
    count: options.count || 1,
  });

  return {
    success: response.success,
    error: response.error,
  };
}

/**
 * Perform a swipe gesture
 * Endpoint: /mouse/swipe
 */
export async function swipe(
  deviceId: string,
  direction: 'up' | 'down' | 'left' | 'right',
  options: {
    len?: number; // Length of swipe
    stepping?: number; // Step size
    stepSleep?: number; // Sleep between steps in ms
  } = {}
): Promise<{ success: boolean; error?: string }> {
  const response = await imousePost('/mouse/swipe', {
    id: deviceId,
    direction,
    len: options.len || 500,
    stepping: options.stepping || 10,
    step_sleep: options.stepSleep || 10,
  });

  return {
    success: response.success,
    error: response.error,
  };
}

/**
 * Scroll to next video (swipe up)
 */
export async function scrollToNextVideo(
  deviceId: string
): Promise<{ success: boolean; error?: string }> {
  return swipe(deviceId, 'up', {
    len: 800,
    stepping: 15,
    stepSleep: 5,
  });
}

/**
 * Input text via keyboard
 * Endpoint: /keyboard/input (or similar)
 */
export async function keyboardInput(
  deviceId: string,
  text: string
): Promise<{ success: boolean; error?: string }> {
  const response = await imousePost('/keyboard/input', {
    id: deviceId,
    text,
  });

  return {
    success: response.success,
    error: response.error,
  };
}

/**
 * Take a screenshot of the device
 * Endpoint: /pic/screenshot
 */
export async function screenshot(
  deviceId: string,
  options: {
    binary?: boolean;
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
  const response = await imousePost<ScreenshotResponse>('/pic/screenshot', {
    id: deviceId,
    binary: options.binary ?? true,
    jpg: options.jpg ?? true,
    save_path: options.savePath,
    rect: options.rect,
  });

  if (!response.success) {
    return { success: false, error: response.error };
  }

  return {
    success: true,
    base64: response.data?.base64,
    path: response.data?.path,
  };
}

/**
 * Take a screenshot and return as base64 data URL
 */
export async function screenshotAsDataUrl(
  deviceId: string
): Promise<{ success: boolean; dataUrl?: string; error?: string }> {
  const result = await screenshot(deviceId, { binary: true, jpg: true });

  if (!result.success || !result.base64) {
    return { success: false, error: result.error || 'No screenshot data returned' };
  }

  return {
    success: true,
    dataUrl: `data:image/jpeg;base64,${result.base64}`,
  };
}
