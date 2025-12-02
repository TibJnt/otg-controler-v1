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
import { Device, DeviceCoords, NormalizedCoords } from '../types';
import { normalizeCoords, denormalizeCoords } from '../utils/coords';

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
  const newDevices = result.devices.map((d) => ({
    idImouse: d.deviceid,
    label: d.device_name || `Device ${d.deviceid}`,
    width: d.width,
    height: d.height,
    state: d.state,
    gname: d.gname,
  }));

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
  return loadDevices();
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
  action: 'like' | 'comment' | 'save' | 'commentSendButton' | 'commentInputField',
  coords: NormalizedCoords
): Promise<{ success: boolean; error?: string }> {
  const partialCoords: Partial<DeviceCoords> = {
    [action]: coords,
  };
  return updateDeviceCoords(idImouse, partialCoords);
}

/**
 * Update coordinates from absolute pixel values (from calibration UI)
 * Automatically normalizes based on device resolution
 */
export async function setCoordsFromPixels(
  idImouse: string,
  action: 'like' | 'comment' | 'save' | 'commentSendButton' | 'commentInputField',
  x: number,
  y: number
): Promise<{ success: boolean; error?: string }> {
  const device = await getDeviceById(idImouse);

  if (!device) {
    return { success: false, error: `Device not found: ${idImouse}` };
  }

  const normalized = normalizeCoords(x, y, device.width, device.height);
  return setDeviceCoords(idImouse, action, normalized);
}

/**
 * Get absolute pixel coordinates for a device action
 */
export async function getAbsoluteCoords(
  idImouse: string,
  action: 'like' | 'comment' | 'save' | 'commentSendButton' | 'commentInputField'
): Promise<{ success: boolean; x?: number; y?: number; error?: string }> {
  const device = await getDeviceById(idImouse);

  if (!device) {
    return { success: false, error: `Device not found: ${idImouse}` };
  }

  const coords = device.coords[action];
  if (!coords) {
    return { success: false, error: `No coordinates set for action: ${action}` };
  }

  const absolute = denormalizeCoords(coords, device.width, device.height);
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
  idImouse: string
): Promise<{ valid: boolean; missing: string[] }> {
  const device = await getDeviceById(idImouse);

  if (!device) {
    return { valid: false, missing: ['device not found'] };
  }

  const missing: string[] = [];

  if (!device.coords.like) {
    missing.push('like');
  }

  // Comment and save are optional but warn if missing
  // For now, only like is strictly required

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Get devices that are ready for automation (have required coords)
 */
export async function getAutomationReadyDevices(): Promise<Device[]> {
  const devices = await loadDevices();
  return devices.filter((d) => d.coords.like !== undefined);
}
