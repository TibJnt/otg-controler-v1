/**
 * Runtime types for automation engine
 */

import { ActionType, Trigger, VisionAnalysisResult } from '../types';

// Engine status
export type EngineStatus = 'idle' | 'running' | 'stopping';

// Result of a single device cycle
export interface CycleResult {
  deviceId: string;
  deviceLabel: string;
  timestamp: Date;
  success: boolean;

  // Scroll result
  scrolled: boolean;

  // Analysis result
  analyzed: boolean;
  visionResult?: VisionAnalysisResult;
  analysisText?: string;

  // Trigger matching
  matchedTrigger?: Trigger;
  skippedByProbability: boolean;
  skippedByHumanization: boolean;

  // Action execution
  actionExecuted?: ActionType;
  actionSuccess?: boolean;

  // Error if any
  error?: string;
}

// Engine runtime state
export interface EngineState {
  status: EngineStatus;
  currentDeviceId?: string;
  currentDeviceLabel?: string;
  cycleCount: number;
  lastCycleResult?: CycleResult;
  startedAt?: Date;
  errors: string[];
}

// Callback for cycle completion
export type CycleCallback = (result: CycleResult) => void;

// Engine configuration (runtime)
export interface EngineConfig {
  postIntervalSeconds: number;
  scrollDelaySeconds: number;
  delayJitterMin: number;
  delayJitterMax: number;
  skipProbability: number;
}
