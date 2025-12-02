/**
 * Simple timestamped logger for automation events
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  deviceId?: string;
  data?: unknown;
}

// In-memory log buffer for recent entries
const LOG_BUFFER_SIZE = 100;
const logBuffer: LogEntry[] = [];

function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function addToBuffer(entry: LogEntry): void {
  logBuffer.push(entry);
  if (logBuffer.length > LOG_BUFFER_SIZE) {
    logBuffer.shift();
  }
}

function formatLogMessage(entry: LogEntry): string {
  const timestamp = formatTimestamp(entry.timestamp);
  const devicePrefix = entry.deviceId ? ` [${entry.deviceId}]` : '';
  return `[${timestamp}]${devicePrefix} ${entry.message}`;
}

/**
 * Log an info message
 */
export function logInfo(message: string, deviceId?: string, data?: unknown): void {
  const entry: LogEntry = {
    timestamp: new Date(),
    level: 'info',
    message,
    deviceId,
    data,
  };
  addToBuffer(entry);
  console.log(formatLogMessage(entry));
}

/**
 * Log a warning message
 */
export function logWarn(message: string, deviceId?: string, data?: unknown): void {
  const entry: LogEntry = {
    timestamp: new Date(),
    level: 'warn',
    message,
    deviceId,
    data,
  };
  addToBuffer(entry);
  console.warn(formatLogMessage(entry));
}

/**
 * Log an error message
 */
export function logError(message: string, deviceId?: string, data?: unknown): void {
  const entry: LogEntry = {
    timestamp: new Date(),
    level: 'error',
    message,
    deviceId,
    data,
  };
  addToBuffer(entry);
  console.error(formatLogMessage(entry));
}

/**
 * Log a debug message
 */
export function logDebug(message: string, deviceId?: string, data?: unknown): void {
  const entry: LogEntry = {
    timestamp: new Date(),
    level: 'debug',
    message,
    deviceId,
    data,
  };
  addToBuffer(entry);
  if (process.env.NODE_ENV === 'development') {
    console.debug(formatLogMessage(entry));
  }
}

/**
 * Get recent log entries
 */
export function getRecentLogs(count: number = 50): LogEntry[] {
  return logBuffer.slice(-count);
}

/**
 * Clear the log buffer
 */
export function clearLogs(): void {
  logBuffer.length = 0;
}

/**
 * Format a log entry for display
 */
export function formatLogEntry(entry: LogEntry): string {
  return formatLogMessage(entry);
}
