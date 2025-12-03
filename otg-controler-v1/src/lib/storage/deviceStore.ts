/**
 * Device storage helpers for reading/writing devices.json
 */

import { getConfig } from '../config';
import {
  DevicesFileSchema,
  DevicesFileSchemaType,
  DeviceSchemaType,
  DEFAULT_DEVICES,
  TikTokCoordsSchema,
  InstagramCoordsSchema,
} from '../schema';
import { Device, DeviceCoords, Platform, TikTokCoords, NormalizedCoords } from '../types';
import { readJsonFile, writeJsonFile } from './jsonStore';

// Old flat coordinate format (for migration)
interface LegacyDeviceCoords {
  like?: NormalizedCoords;
  comment?: NormalizedCoords;
  save?: NormalizedCoords;
  commentInputField?: NormalizedCoords;
  commentSendButton?: NormalizedCoords;
  commentBackButton?: NormalizedCoords;
}

/**
 * Check if coords are in legacy flat format (not nested by platform)
 */
function isLegacyCoords(coords: unknown): coords is LegacyDeviceCoords {
  if (!coords || typeof coords !== 'object') return false;
  const c = coords as Record<string, unknown>;
  // If it has 'like' at top level (not nested under tiktok/instagram), it's legacy
  return ('like' in c && c.like !== undefined && typeof c.like === 'object' && 'xNorm' in (c.like as object)) ||
         ('comment' in c && c.comment !== undefined && typeof c.comment === 'object' && 'xNorm' in (c.comment as object)) ||
         ('save' in c && c.save !== undefined && typeof c.save === 'object' && 'xNorm' in (c.save as object));
}

/**
 * Migrate legacy flat coords to nested platform format
 */
function migrateLegacyCoords(legacyCoords: LegacyDeviceCoords): DeviceCoords {
  return {
    tiktok: {
      like: legacyCoords.like,
      comment: legacyCoords.comment,
      save: legacyCoords.save,
      commentInputField: legacyCoords.commentInputField,
      commentSendButton: legacyCoords.commentSendButton,
      commentBackButton: legacyCoords.commentBackButton,
    },
  };
}

/**
 * Load all devices from devices.json, migrating legacy format if needed
 */
export async function loadDevices(): Promise<Device[]> {
  const config = getConfig();

  // Read raw JSON to check for legacy format
  const fs = await import('fs/promises');
  let rawData: unknown[];
  try {
    const content = await fs.readFile(config.devicesFilePath, 'utf-8');
    rawData = JSON.parse(content);
  } catch {
    return DEFAULT_DEVICES;
  }

  // Check if migration is needed
  let needsMigration = false;
  const migratedData = rawData.map((device: unknown) => {
    const d = device as Record<string, unknown>;
    if (d.coords && isLegacyCoords(d.coords)) {
      needsMigration = true;
      return {
        ...d,
        coords: migrateLegacyCoords(d.coords as LegacyDeviceCoords),
      };
    }
    return d;
  });

  // If we migrated, save the new format
  if (needsMigration) {
    await fs.writeFile(config.devicesFilePath, JSON.stringify(migratedData, null, 2));
  }

  // Now parse with schema
  const parsed = DevicesFileSchema.safeParse(migratedData);
  if (!parsed.success) {
    console.error('Failed to parse devices.json:', parsed.error);
    return DEFAULT_DEVICES;
  }

  return parsed.data;
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
 * Update coordinates for a specific device and platform
 */
export async function updateDeviceCoords(
  idImouse: string,
  platform: Platform,
  coords: Partial<TikTokCoords> | Partial<import('../types').InstagramCoords>
): Promise<{ success: boolean; error?: string }> {
  // Validate the coords based on platform
  const schema = platform === 'tiktok' ? TikTokCoordsSchema : InstagramCoordsSchema;
  const validated = schema.partial().safeParse(coords);
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

  // Ensure platform key exists
  if (!devices[deviceIndex].coords[platform]) {
    devices[deviceIndex].coords[platform] = {};
  }

  // Merge the new coords into the platform-specific coords
  devices[deviceIndex].coords[platform] = {
    ...devices[deviceIndex].coords[platform],
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
 * Check if a device has a specific coordinate for a platform
 */
export function deviceHasCoords(
  device: DeviceSchemaType,
  platform: Platform,
  action: string
): boolean {
  const platformCoords = device.coords[platform];
  if (!platformCoords) return false;
  return (platformCoords as Record<string, unknown>)[action] !== undefined;
}
