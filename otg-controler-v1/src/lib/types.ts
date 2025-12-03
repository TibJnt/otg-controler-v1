/**
 * Domain types for the OTG Controller automation system
 */

// Supported platforms
export type Platform = 'tiktok' | 'instagram';

// Action types that can be triggered on a video
export type ActionType = 'LIKE' | 'COMMENT' | 'SAVE' | 'LIKE_AND_COMMENT' | 'LIKE_AND_SAVE' | 'NO_ACTION' | 'SKIP';

// Automation running status
export type AutomationStatus = 'stopped' | 'running';

// Normalized coordinates (0-1 range)
export interface NormalizedCoords {
  xNorm: number;
  yNorm: number;
}

// TikTok-specific action coordinates
export interface TikTokCoords {
  like?: NormalizedCoords;
  comment?: NormalizedCoords;
  save?: NormalizedCoords;
  commentInputField?: NormalizedCoords;
  commentSendButton?: NormalizedCoords;
  commentBackButton?: NormalizedCoords;
}

// Instagram-specific action coordinates
export interface InstagramCoords {
  like?: NormalizedCoords;
  comment?: NormalizedCoords;
  share?: NormalizedCoords;  // Instagram uses share instead of save
  commentInputField?: NormalizedCoords;
  commentSendButton?: NormalizedCoords;
  commentCloseButton?: NormalizedCoords;
}

// Device action coordinates (nested by platform)
export interface DeviceCoords {
  tiktok?: TikTokCoords;
  instagram?: InstagramCoords;
}

// Device information from iMouseXP
export interface Device {
  idImouse: string;
  label: string;
  width: number;         // Logical width (CSS points) - for display
  height: number;        // Logical height (CSS points) - for display
  screenWidth?: number;  // Actual touch/screen width (imgw from iMouseXP) - for clicks
  screenHeight?: number; // Actual touch/screen height (imgh from iMouseXP) - for clicks
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

// Viewing time range
export interface ViewingTime {
  minSeconds: number;
  maxSeconds: number;
}

// Viewing time configuration for relevant vs non-relevant content
export interface ViewingTimeConfig {
  relevant: ViewingTime;
  nonRelevant: ViewingTime;
}

// Automation configuration
export interface AutomationConfig {
  name: string;
  platform: Platform;  // Target platform for automation
  deviceIds: string[];
  postIntervalSeconds: number;
  scrollDelaySeconds: number;
  viewingTime?: ViewingTimeConfig;
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

// Scenario trigger template (for presets, before ID generation)
export interface ScenarioTriggerTemplate {
  action: ActionType;
  keywords: string[];
  probability: number;
  commentTemplates?: string[];
  commentLanguage?: 'fr' | 'en';
}

// Scenario preset definition
export interface ScenarioPreset {
  id: string;
  name: string;
  description: string;
  platform: Platform;  // Target platform for this scenario
  config: {
    postIntervalSeconds: number;
    scrollDelaySeconds: number;
    viewingTime: ViewingTimeConfig;
  };
  triggers: ScenarioTriggerTemplate[];
}
