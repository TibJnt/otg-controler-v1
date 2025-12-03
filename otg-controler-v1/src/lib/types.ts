/**
 * Domain types for the OTG Controller automation system
 */

// Action types that can be triggered on a video
export type ActionType = 'LIKE' | 'COMMENT' | 'SAVE' | 'LIKE_AND_COMMENT' | 'LIKE_AND_SAVE' | 'NO_ACTION' | 'SKIP';

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
  commentBackButton?: NormalizedCoords;
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
  config: {
    postIntervalSeconds: number;
    scrollDelaySeconds: number;
    viewingTime: ViewingTimeConfig;
  };
  triggers: ScenarioTriggerTemplate[];
}
