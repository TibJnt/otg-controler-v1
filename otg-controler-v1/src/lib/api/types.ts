/**
 * Frontend API types - mirrors backend domain types
 */

export type ActionType = 'LIKE' | 'COMMENT' | 'SAVE' | 'LIKE_AND_COMMENT' | 'SKIP';

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
}

export interface Device {
  idImouse: string;
  label: string;
  width: number;
  height: number;
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

export interface AutomationConfig {
  name: string;
  deviceIds: string[];
  postIntervalSeconds: number;
  scrollDelaySeconds: number;
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
