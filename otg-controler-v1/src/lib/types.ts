/**
 * Domain types for the OTG Controller automation system
 */

// Action types that can be triggered on a video
export type ActionType = 'LIKE' | 'COMMENT' | 'SAVE' | 'LIKE_AND_COMMENT' | 'SKIP';

// Automation running status
export type AutomationStatus = 'stopped' | 'running';

// Normalized coordinates (0-1 range)
export interface NormalizedCoords {
  xNorm: number;
  yNorm: number;
}

// Device action coordinates
export interface DeviceCoords {
  like?: NormalizedCoords;
  comment?: NormalizedCoords;
  save?: NormalizedCoords;
  commentSendButton?: NormalizedCoords;
  commentInputField?: NormalizedCoords;
}

// Device information from iMouseXP
export interface Device {
  idImouse: string;
  label: string;
  width: number;
  height: number;
  coords: DeviceCoords;
  state?: string;
  gname?: string;
}

// Trigger definition for automation rules
export interface Trigger {
  id: string;
  action: ActionType;
  keywords: string[];
  deviceIds?: string[]; // Optional: if empty, applies to all automation devices
  commentTemplates?: string[];
  commentLanguage?: 'fr' | 'en';
  probability?: number; // 0-1, defaults to 1
}

// Automation configuration
export interface AutomationConfig {
  name: string;
  deviceIds: string[];
  postIntervalSeconds: number;
  scrollDelaySeconds: number;
  triggers: Trigger[];
  running: AutomationStatus;
}

// Vision analysis result from OpenAI
export interface VisionAnalysisResult {
  caption: string;
  topics: string[];
  shouldComment?: boolean;
  commentStyle?: string;
}

// Cycle execution result for logging
export interface CycleResult {
  deviceId: string;
  timestamp: Date;
  description?: string;
  matchedTrigger?: Trigger;
  actionExecuted?: ActionType;
  error?: string;
}
