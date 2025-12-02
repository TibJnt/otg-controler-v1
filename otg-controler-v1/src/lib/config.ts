/**
 * Configuration loader for environment variables and defaults
 */

// Environment configuration with defaults
export interface AppConfig {
  // iMouseXP settings
  imouseBaseUrl: string;
  imousePort: number;

  // OpenAI settings
  openaiApiKey: string;
  openaiModel: string;

  // Timing defaults
  defaultPostIntervalSeconds: number;
  defaultScrollDelaySeconds: number;

  // Humanization settings
  delayJitterMin: number; // Multiplier for minimum delay (e.g., 0.8)
  delayJitterMax: number; // Multiplier for maximum delay (e.g., 1.2)
  skipProbability: number; // Probability to skip even if trigger matches (0-1)

  // Data paths
  dataDir: string;
  devicesFilePath: string;
  automationFilePath: string;
}

function getEnvString(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

export function loadConfig(): AppConfig {
  const dataDir = getEnvString('DATA_DIR', './data');

  return {
    // iMouseXP settings
    imouseBaseUrl: getEnvString('IMOUSE_BASE_URL', 'http://localhost'),
    imousePort: getEnvNumber('IMOUSE_PORT', 9911),

    // OpenAI settings
    openaiApiKey: getEnvString('OPENAI_API_KEY', ''),
    openaiModel: getEnvString('OPENAI_MODEL', 'gpt-4o'),

    // Timing defaults
    defaultPostIntervalSeconds: getEnvNumber('DEFAULT_POST_INTERVAL_SECONDS', 10),
    defaultScrollDelaySeconds: getEnvNumber('DEFAULT_SCROLL_DELAY_SECONDS', 3),

    // Humanization settings
    delayJitterMin: getEnvNumber('DELAY_JITTER_MIN', 0.8),
    delayJitterMax: getEnvNumber('DELAY_JITTER_MAX', 1.2),
    skipProbability: getEnvNumber('SKIP_PROBABILITY', 0.1), // 10% chance to skip

    // Data paths
    dataDir,
    devicesFilePath: `${dataDir}/devices.json`,
    automationFilePath: `${dataDir}/automation.json`,
  };
}

// Singleton config instance
let configInstance: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (!configInstance) {
    configInstance = loadConfig();
  }
  return configInstance;
}

// Helper to apply jitter to a delay value
export function applyJitter(baseDelay: number, config?: AppConfig): number {
  const cfg = config ?? getConfig();
  const jitterRange = cfg.delayJitterMax - cfg.delayJitterMin;
  const jitter = cfg.delayJitterMin + Math.random() * jitterRange;
  return baseDelay * jitter;
}
