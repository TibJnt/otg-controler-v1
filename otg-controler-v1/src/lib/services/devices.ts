/**
 * Device service for managing devices and their configurations
 */

import { listDevices as imouseListDevices, screenshotAsDataUrl } from '../clients/imouse';
import {
  loadDevices,
  saveDevices,
  mergeDevices,
  updateDeviceCoords,
  updateDeviceLabel,
  getDeviceById,
} from '../storage/deviceStore';
import { Device, NormalizedCoords, Platform, TikTokCoords, InstagramCoords } from '../types';
import { normalizeCoords, denormalizeCoords } from '../utils/coords';

// TikTok action types
type TikTokAction = 'like' | 'comment' | 'save' | 'commentSendButton' | 'commentInputField' | 'commentBackButton';

// Instagram action types
type InstagramAction = 'like' | 'comment' | 'share' | 'commentSendButton' | 'commentInputField' | 'commentCloseButton';

/**
 * Refresh device list from iMouseXP and merge with stored data
 * Preserves existing labels and coordinates
 */
export async function refreshDevices(): Promise<{
  success: boolean;
  devices?: Device[];
  error?: string;
}> {
  // Get devices from iMouseXP
  const result = await imouseListDevices();

  if (!result.success || !result.devices) {
    return { success: false, error: result.error || 'Failed to get devices from iMouseXP' };
  }

  // Map iMouseXP response to our device format
  // Note: iMouseXP may return width/height as strings
  // IMPORTANT: imgw/imgh are the ACTUAL touch coordinates, width/height are logical (CSS) dimensions
  const newDevices = result.devices.map((d) => {
    const logicalWidth = typeof d.width === 'string' ? parseInt(d.width, 10) : d.width;
    const logicalHeight = typeof d.height === 'string' ? parseInt(d.height, 10) : d.height;
    const screenWidth = d.imgw || logicalWidth;
    const screenHeight = d.imgh || logicalHeight;
    
    console.log(`[DEVICE REFRESH] Device ${d.deviceid}:`);
    console.log(`[DEVICE REFRESH]   Logical (width/height): ${logicalWidth}x${logicalHeight}`);
    console.log(`[DEVICE REFRESH]   Screen (imgw/imgh): ${screenWidth}x${screenHeight}`);
    
    return {
      idImouse: d.deviceid,
      label: d.device_name || `Device ${d.deviceid}`,
      width: logicalWidth,
      height: logicalHeight,
      screenWidth,
      screenHeight,
      state: typeof d.state === 'number' ? String(d.state) : d.state,
      gname: d.gname,
    };
  });

  // Merge with existing stored devices (preserves labels and coords)
  const mergeResult = await mergeDevices(newDevices);

  if (!mergeResult.success) {
    return { success: false, error: mergeResult.error };
  }

  // Return the updated device list
  const devices = await loadDevices();
  return { success: true, devices };
}

/**
 * Get all stored devices
 */
export async function getDevices(): Promise<Device[]> {
  console.log(`[BACKEND] ========================================`);
  console.log(`[BACKEND] getDevices CALLED`);
  const devices = await loadDevices();
  console.log(`[BACKEND] Loaded ${devices.length} devices from storage`);
  devices.forEach((d, i) => {
    console.log(`[BACKEND] Device ${i}: id=${d.idImouse}, screenWidth=${d.screenWidth}, screenHeight=${d.screenHeight}`);
  });
  console.log(`[BACKEND] ========================================`);
  return devices;
}

/**
 * Get a single device by ID
 */
export async function getDevice(idImouse: string): Promise<Device | null> {
  return getDeviceById(idImouse);
}

/**
 * Update device label
 */
export async function setDeviceLabel(
  idImouse: string,
  label: string
): Promise<{ success: boolean; error?: string }> {
  return updateDeviceLabel(idImouse, label);
}

/**
 * Update coordinates for a device action using normalized values
 */
export async function setDeviceCoords(
  idImouse: string,
  platform: Platform,
  action: string,
  coords: NormalizedCoords
): Promise<{ success: boolean; error?: string }> {
  if (platform === 'tiktok') {
    const partialCoords: Partial<TikTokCoords> = {
      [action as TikTokAction]: coords,
    };
    return updateDeviceCoords(idImouse, platform, partialCoords);
  } else {
    const partialCoords: Partial<InstagramCoords> = {
      [action as InstagramAction]: coords,
    };
    return updateDeviceCoords(idImouse, platform, partialCoords);
  }
}

/**
 * Update coordinates from absolute pixel values (from calibration UI)
 * Automatically normalizes based on device SCREEN resolution (imgw/imgh)
 */
export async function setCoordsFromPixels(
  idImouse: string,
  platform: Platform,
  action: string,
  x: number,
  y: number
): Promise<{ success: boolean; error?: string }> {
  console.log(`[BACKEND] ========================================`);
  console.log(`[BACKEND] setCoordsFromPixels CALLED`);
  console.log(`[BACKEND] idImouse: ${idImouse}`);
  console.log(`[BACKEND] platform: ${platform}`);
  console.log(`[BACKEND] action: ${action}`);
  console.log(`[BACKEND] x: ${x}, y: ${y}`);
  console.log(`[BACKEND] ========================================`);

  const device = await getDeviceById(idImouse);

  console.log(`[BACKEND] Device loaded from storage:`, JSON.stringify(device, null, 2));

  if (!device) {
    console.error(`[BACKEND] ERROR: Device not found: ${idImouse}`);
    return { success: false, error: `Device not found: ${idImouse}` };
  }

  console.log(`[BACKEND] Device screenWidth: ${device.screenWidth} (type: ${typeof device.screenWidth})`);
  console.log(`[BACKEND] Device screenHeight: ${device.screenHeight} (type: ${typeof device.screenHeight})`);

  if (!device.screenWidth || !device.screenHeight) {
    console.error(`[BACKEND] ERROR: Missing screen dimensions!`);
    console.error(`[BACKEND] screenWidth: ${device.screenWidth}`);
    console.error(`[BACKEND] screenHeight: ${device.screenHeight}`);
    return {
      success: false,
      error: 'Screen dimensions missing. Please refresh devices to load screenWidth/screenHeight.',
    };
  }

  const targetWidth = device.screenWidth;
  const targetHeight = device.screenHeight;

  console.log(`[BACKEND] >>> NORMALIZING WITH: ${targetWidth}x${targetHeight} <<<`);

  const normalized = normalizeCoords(x, y, targetWidth, targetHeight);

  console.log(`[BACKEND] Normalized result: xNorm=${normalized.xNorm}, yNorm=${normalized.yNorm}`);
  console.log(`[BACKEND] Verification denormalize: x=${Math.round(normalized.xNorm * targetWidth)}, y=${Math.round(normalized.yNorm * targetHeight)}`);

  const result = await setDeviceCoords(idImouse, platform, action, normalized);
  console.log(`[BACKEND] setDeviceCoords result:`, result);

  return result;
}

/**
 * Get absolute pixel coordinates for a device action
 */
export async function getAbsoluteCoords(
  idImouse: string,
  platform: Platform,
  action: string
): Promise<{ success: boolean; x?: number; y?: number; error?: string }> {
  const device = await getDeviceById(idImouse);

  if (!device) {
    return { success: false, error: `Device not found: ${idImouse}` };
  }

  const platformCoords = device.coords[platform];
  if (!platformCoords) {
    return { success: false, error: `No coordinates configured for platform: ${platform}` };
  }

  const coords = platformCoords[action as keyof typeof platformCoords] as NormalizedCoords | undefined;
  if (!coords) {
    return { success: false, error: `No coordinates set for action: ${action}` };
  }

  const width = device.screenWidth || device.width;
  const height = device.screenHeight || device.height;
  const absolute = denormalizeCoords(coords, width, height);
  return { success: true, ...absolute };
}

/**
 * Take a screenshot of a device
 */
export async function getScreenshot(
  idImouse: string
): Promise<{ success: boolean; dataUrl?: string; error?: string }> {
  return screenshotAsDataUrl(idImouse);
}

/**
 * Check if a device has all required coordinates for automation
 */
export async function validateDeviceForAutomation(
  idImouse: string,
  platform: Platform
): Promise<{ valid: boolean; missing: string[] }> {
  const device = await getDeviceById(idImouse);

  if (!device) {
    return { valid: false, missing: ['device not found'] };
  }

  const missing: string[] = [];
  const platformCoords = device.coords[platform];

  if (!platformCoords?.like) {
    missing.push('like');
  }

  // Comment and save/share are optional but warn if missing
  // For now, only like is strictly required

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Get devices that are ready for automation (have required coords)
 */
export async function getAutomationReadyDevices(platform: Platform): Promise<Device[]> {
  const devices = await loadDevices();
  return devices.filter((d) => d.coords[platform]?.like !== undefined);
}
