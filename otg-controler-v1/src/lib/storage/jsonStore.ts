/**
 * Generic JSON file storage with basic locking and validation
 */

import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

// Simple in-memory lock map to prevent concurrent writes
const writeLocks = new Map<string, Promise<void>>();

/**
 * Ensures the directory exists for a file path
 */
async function ensureDir(filePath: string): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
}

/**
 * Read and parse a JSON file with validation
 * Returns default value if file doesn't exist or is invalid
 */
export async function readJsonFile<T>(
  filePath: string,
  schema: z.ZodType<T>,
  defaultValue: T
): Promise<T> {
  try {
    const absolutePath = path.resolve(process.cwd(), filePath);
    const content = await fs.readFile(absolutePath, 'utf-8');
    const parsed = JSON.parse(content);
    const validated = schema.safeParse(parsed);

    if (validated.success) {
      return validated.data;
    }

    console.warn(`[jsonStore] Validation failed for ${filePath}:`, validated.error.issues);
    return defaultValue;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // File doesn't exist, return default
      return defaultValue;
    }
    console.error(`[jsonStore] Error reading ${filePath}:`, error);
    return defaultValue;
  }
}

/**
 * Write data to a JSON file with validation and simple locking
 */
export async function writeJsonFile<T>(
  filePath: string,
  data: T,
  schema: z.ZodType<T>
): Promise<{ success: boolean; error?: string }> {
  const absolutePath = path.resolve(process.cwd(), filePath);

  // Validate data before writing
  const validated = schema.safeParse(data);
  if (!validated.success) {
    return {
      success: false,
      error: `Validation failed: ${validated.error.issues.map((e) => e.message).join(', ')}`,
    };
  }

  // Wait for any existing write to complete
  const existingLock = writeLocks.get(absolutePath);
  if (existingLock) {
    await existingLock;
  }

  // Create new lock
  const writePromise = (async () => {
    try {
      await ensureDir(absolutePath);
      const content = JSON.stringify(validated.data, null, 2);
      await fs.writeFile(absolutePath, content, 'utf-8');
    } finally {
      writeLocks.delete(absolutePath);
    }
  })();

  writeLocks.set(absolutePath, writePromise);

  try {
    await writePromise;
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `Write failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Check if a JSON file exists
 */
export async function jsonFileExists(filePath: string): Promise<boolean> {
  try {
    const absolutePath = path.resolve(process.cwd(), filePath);
    await fs.access(absolutePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Delete a JSON file
 */
export async function deleteJsonFile(filePath: string): Promise<boolean> {
  try {
    const absolutePath = path.resolve(process.cwd(), filePath);
    await fs.unlink(absolutePath);
    return true;
  } catch {
    return false;
  }
}
