/**
 * Frontend API types - mirrors backend domain types
 */

export type ActionType = 'LIKE' | 'COMMENT' | 'SAVE' | 'LIKE_AND_COMMENT' | 'LIKE_AND_SAVE' | 'NO_ACTION' | 'SKIP';

export type AutomationStatus = 'stopped' | 'running';

export interface NormalizedCoords {
  xNorm: number;
  yNorm: number;
}

export interface DeviceCoords {
  like?: NormalizedCoords;
  comment?: NormalizedCoords;
  save?: NormalizedCoords;
  commentSendButton?: NormalizedCoords;
  commentInputField?: NormalizedCoords;
  commentBackButton?: NormalizedCoords;
}

export interface Device {
  idImouse: string;
  label: string;
  width: number;          // Logical width (CSS points)
  height: number;         // Logical height (CSS points)
  screenWidth?: number;   // Actual touch/screen width (for clicks)
  screenHeight?: number;  // Actual touch/screen height (for clicks)
  coords: DeviceCoords;
  state?: string;
  gname?: string;
}

export interface Trigger {
  id: string;
  action: ActionType;
  keywords: string[];
  deviceIds?: string[];
  commentTemplates?: string[];
  commentLanguage?: 'fr' | 'en';
  probability?: number;
}

export interface ViewingTime {
  minSeconds: number;
  maxSeconds: number;
}

export interface ViewingTimeConfig {
  relevant: ViewingTime;
  nonRelevant: ViewingTime;
}

export interface AutomationConfig {
  name: string;
  deviceIds: string[];
  postIntervalSeconds: number;
  scrollDelaySeconds: number;
  viewingTime?: ViewingTimeConfig;
  triggers: Trigger[];
  running: AutomationStatus;
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  deviceId?: string;
  formatted: string;
}

export interface HealthStatus {
  engine: {
    status: string;
    running: boolean;
    currentDevice: string | null;
    cycleCount: number;
    uptime: number | null;
    recentErrors: string[];
  };
  automation: {
    name: string;
    running: AutomationStatus;
    selectedDevices: number;
    triggers: number;
  };
  devices: {
    total: number;
    configured: number;
  };
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

export interface DevicesResponse {
  success: boolean;
  devices: Device[];
  error?: string;
}

export interface AutomationResponse {
  success: boolean;
  config: AutomationConfig;
  error?: string;
}

export interface TriggersResponse {
  success: boolean;
  triggers: Trigger[];
  trigger?: Trigger;
  error?: string;
}

export interface HealthResponse {
  success: boolean;
  status: HealthStatus;
  error?: string;
}

export interface LogsResponse {
  success: boolean;
  logs: LogEntry[];
  count: number;
  error?: string;
}

export interface ScreenshotResponse {
  success: boolean;
  dataUrl?: string;
  error?: string;
}

export interface StartStopResponse {
  success: boolean;
  message?: string;
  warnings?: string[];
  error?: string;
}
