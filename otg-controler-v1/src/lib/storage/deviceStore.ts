/**
 * Device storage helpers for reading/writing devices.json
 */

import { getConfig } from '../config';
import {
  DevicesFileSchema,
  DevicesFileSchemaType,
  DeviceSchemaType,
  DEFAULT_DEVICES,
  DeviceCoordsSchema,
} from '../schema';
import { Device, DeviceCoords } from '../types';
import { readJsonFile, writeJsonFile } from './jsonStore';

/**
 * Load all devices from devices.json
 */
export async function loadDevices(): Promise<Device[]> {
  const config = getConfig();
  return readJsonFile(config.devicesFilePath, DevicesFileSchema, DEFAULT_DEVICES);
}

/**
 * Save all devices to devices.json
 */
export async function saveDevices(
  devices: Device[]
): Promise<{ success: boolean; error?: string }> {
  const config = getConfig();
  return writeJsonFile(config.devicesFilePath, devices, DevicesFileSchema);
}

/**
 * Get a single device by its iMouseXP ID
 */
export async function getDeviceById(idImouse: string): Promise<Device | null> {
  const devices = await loadDevices();
  return devices.find((d) => d.idImouse === idImouse) ?? null;
}

/**
 * Add or update a device
 * If device exists (by idImouse), updates it; otherwise adds new
 */
export async function upsertDevice(
  device: Device
): Promise<{ success: boolean; error?: string }> {
  const devices = await loadDevices();
  const existingIndex = devices.findIndex((d) => d.idImouse === device.idImouse);

  if (existingIndex >= 0) {
    // Preserve existing label and coords if not provided
    const existing = devices[existingIndex];
    devices[existingIndex] = {
      ...device,
      label: device.label || existing.label,
      coords: { ...existing.coords, ...device.coords },
    };
  } else {
    devices.push(device);
  }

  return saveDevices(devices);
}

/**
 * Update multiple devices at once (from iMouseXP refresh)
 * Preserves labels and coords for existing devices
 */
export async function mergeDevices(
  newDevices: Omit<Device, 'coords'>[]
): Promise<{ success: boolean; error?: string }> {
  const existingDevices = await loadDevices();
  const existingMap = new Map(existingDevices.map((d) => [d.idImouse, d]));

  const mergedDevices: Device[] = newDevices.map((newDev) => {
    const existing = existingMap.get(newDev.idImouse);
    if (existing) {
      return {
        ...newDev,
        label: existing.label || newDev.label,
        coords: existing.coords,
      };
    }
    return {
      ...newDev,
      coords: {},
    };
  });

  return saveDevices(mergedDevices);
}

/**
 * Update coordinates for a specific device
 */
export async function updateDeviceCoords(
  idImouse: string,
  coords: Partial<DeviceCoords>
): Promise<{ success: boolean; error?: string }> {
  // Validate the coords
  const validated = DeviceCoordsSchema.partial().safeParse(coords);
  if (!validated.success) {
    return {
      success: false,
      error: `Invalid coordinates: ${validated.error.issues.map((e) => e.message).join(', ')}`,
    };
  }

  const devices = await loadDevices();
  const deviceIndex = devices.findIndex((d) => d.idImouse === idImouse);

  if (deviceIndex < 0) {
    return { success: false, error: `Device not found: ${idImouse}` };
  }

  devices[deviceIndex].coords = {
    ...devices[deviceIndex].coords,
    ...coords,
  };

  return saveDevices(devices);
}

/**
 * Update label for a specific device
 */
export async function updateDeviceLabel(
  idImouse: string,
  label: string
): Promise<{ success: boolean; error?: string }> {
  const devices = await loadDevices();
  const deviceIndex = devices.findIndex((d) => d.idImouse === idImouse);

  if (deviceIndex < 0) {
    return { success: false, error: `Device not found: ${idImouse}` };
  }

  devices[deviceIndex].label = label;
  return saveDevices(devices);
}

/**
 * Remove a device by ID
 */
export async function removeDevice(
  idImouse: string
): Promise<{ success: boolean; error?: string }> {
  const devices = await loadDevices();
  const filtered = devices.filter((d) => d.idImouse !== idImouse);

  if (filtered.length === devices.length) {
    return { success: false, error: `Device not found: ${idImouse}` };
  }

  return saveDevices(filtered);
}

/**
 * Check if a device has all required coordinates for an action
 */
export function deviceHasCoords(
  device: DeviceSchemaType,
  action: 'like' | 'comment' | 'save'
): boolean {
  return device.coords[action] !== undefined;
}
