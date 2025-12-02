/**
 * Zod schemas for validation and defaults for JSON files
 */

import { z } from 'zod';

// Action type enum
export const ActionTypeSchema = z.enum(['LIKE', 'COMMENT', 'SAVE', 'LIKE_AND_COMMENT', 'SKIP']);

// Automation status enum
export const AutomationStatusSchema = z.enum(['stopped', 'running']);

// Normalized coordinates (must be between 0 and 1)
export const NormalizedCoordsSchema = z.object({
  xNorm: z.number().min(0).max(1),
  yNorm: z.number().min(0).max(1),
});

// Device coordinates for actions
export const DeviceCoordsSchema = z.object({
  like: NormalizedCoordsSchema.optional(),
  comment: NormalizedCoordsSchema.optional(),
  save: NormalizedCoordsSchema.optional(),
  commentSendButton: NormalizedCoordsSchema.optional(),
  commentInputField: NormalizedCoordsSchema.optional(),
});

// Single device schema
export const DeviceSchema = z.object({
  idImouse: z.string().min(1),
  label: z.string(),
  width: z.number().positive(),
  height: z.number().positive(),
  coords: DeviceCoordsSchema,
  state: z.string().optional(),
  gname: z.string().optional(),
});

// Devices file schema (array of devices)
export const DevicesFileSchema = z.array(DeviceSchema);

// Trigger schema
export const TriggerSchema = z.object({
  id: z.string().min(1),
  action: ActionTypeSchema,
  keywords: z.array(z.string()).min(1),
  deviceIds: z.array(z.string()).optional(),
  commentTemplates: z.array(z.string()).optional(),
  commentLanguage: z.enum(['fr', 'en']).optional(),
  probability: z.number().min(0).max(1).optional().default(1),
});

// Automation config schema
export const AutomationConfigSchema = z.object({
  name: z.string(),
  deviceIds: z.array(z.string()),
  postIntervalSeconds: z.number().positive(),
  scrollDelaySeconds: z.number().positive(),
  triggers: z.array(TriggerSchema),
  running: AutomationStatusSchema,
});

// Type inference from schemas
export type DeviceSchemaType = z.infer<typeof DeviceSchema>;
export type DevicesFileSchemaType = z.infer<typeof DevicesFileSchema>;
export type TriggerSchemaType = z.infer<typeof TriggerSchema>;
export type AutomationConfigSchemaType = z.infer<typeof AutomationConfigSchema>;

// Default values for new files
export const DEFAULT_DEVICES: DevicesFileSchemaType = [];

export const DEFAULT_AUTOMATION_CONFIG: AutomationConfigSchemaType = {
  name: 'New Automation',
  deviceIds: [],
  postIntervalSeconds: 10,
  scrollDelaySeconds: 3,
  triggers: [],
  running: 'stopped',
};
