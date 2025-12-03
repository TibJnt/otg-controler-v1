/**
 * Zod schemas for validation and defaults for JSON files
 */

import { z } from 'zod';

// Action type enum
export const ActionTypeSchema = z.enum(['LIKE', 'COMMENT', 'SAVE', 'LIKE_AND_COMMENT', 'LIKE_AND_SAVE', 'NO_ACTION', 'SKIP']);

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
  commentBackButton: NormalizedCoordsSchema.optional(),
});

// Single device schema
export const DeviceSchema = z.object({
  idImouse: z.string().min(1),
  label: z.string(),
  width: z.number().positive(),
  height: z.number().positive(),
  screenWidth: z.number().positive().optional(),   // Actual touch width (imgw)
  screenHeight: z.number().positive().optional(),  // Actual touch height (imgh)
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

// Viewing time schema
export const ViewingTimeSchema = z.object({
  minSeconds: z.number().positive(),
  maxSeconds: z.number().positive(),
});

// Viewing time config schema
export const ViewingTimeConfigSchema = z.object({
  relevant: ViewingTimeSchema,
  nonRelevant: ViewingTimeSchema,
});

// Automation config schema
export const AutomationConfigSchema = z.object({
  name: z.string(),
  deviceIds: z.array(z.string()),
  postIntervalSeconds: z.number().positive(),
  scrollDelaySeconds: z.number().positive(),
  viewingTime: ViewingTimeConfigSchema.optional(),
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

// Scenario trigger template schema (no ID, for presets)
export const ScenarioTriggerTemplateSchema = z.object({
  action: ActionTypeSchema,
  keywords: z.array(z.string()).min(1),
  probability: z.number().min(0).max(1),
  commentTemplates: z.array(z.string()).optional(),
  commentLanguage: z.enum(['fr', 'en']).optional(),
});

// Scenario preset schema
export const ScenarioPresetSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  config: z.object({
    postIntervalSeconds: z.number().positive(),
    scrollDelaySeconds: z.number().positive(),
    viewingTime: ViewingTimeConfigSchema,
  }),
  triggers: z.array(ScenarioTriggerTemplateSchema).min(1),
});

// Scenarios file schema (container)
export const ScenariosFileSchema = z.object({
  scenarios: z.array(ScenarioPresetSchema),
});

// Type inference for scenarios
export type ScenarioTriggerTemplateType = z.infer<typeof ScenarioTriggerTemplateSchema>;
export type ScenarioPresetType = z.infer<typeof ScenarioPresetSchema>;
export type ScenariosFileType = z.infer<typeof ScenariosFileSchema>;

// Default scenarios file
export const DEFAULT_SCENARIOS: ScenariosFileType = {
  scenarios: [],
};
