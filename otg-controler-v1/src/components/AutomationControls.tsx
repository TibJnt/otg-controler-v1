'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/src/components/ui';
import { startAutomation, stopAutomation, getHealth } from '@/src/lib/api/automation';
import { HealthStatus } from '@/src/lib/api/types';

interface AutomationControlsProps {
  onStatusChange?: (running: boolean) => void;
}

export function AutomationControls({ onStatusChange }: AutomationControlsProps) {
  const [status, setStatus] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await getHealth();
      setStatus(response.status);
      onStatusChange?.(response.status.engine.running);
    } catch (err) {
      console.error('Failed to fetch status:', err);
    } finally {
      setLoading(false);
    }
  }, [onStatusChange]);

  useEffect(() => {
    fetchStatus();

    // Poll status every 2 seconds
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleStart = async () => {
    try {
      setStarting(true);
      setError(null);
      setWarnings([]);
      const response = await startAutomation();
      if (response.warnings) {
        setWarnings(response.warnings);
      }
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start automation');
    } finally {
      setStarting(false);
    }
  };

  const handleStop = async (emergency = false) => {
    try {
      setStopping(true);
      setError(null);
      await stopAutomation(emergency);
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop automation');
    } finally {
      setStopping(false);
    }
  };

  const isRunning = status?.engine.running ?? false;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-danger/10 border border-danger/20 rounded-md text-sm text-danger">
          {error}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="p-3 bg-warning/10 border border-warning/20 rounded-md text-sm text-warning">
          <ul className="list-disc list-inside">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Status Display */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted">Status:</span>{' '}
          <span
            className={`font-medium ${
              isRunning ? 'text-success' : 'text-muted'
            }`}
          >
            {status?.engine.status ?? 'Unknown'}
          </span>
        </div>
        <div>
          <span className="text-muted">Cycles:</span>{' '}
          <span className="font-medium">{status?.engine.cycleCount ?? 0}</span>
        </div>
        {status?.engine.currentDevice && (
          <div className="col-span-2">
            <span className="text-muted">Current Device:</span>{' '}
            <span className="font-medium">{status.engine.currentDevice}</span>
          </div>
        )}
        {status?.engine.uptime !== null && status?.engine.uptime !== undefined && (
          <div>
            <span className="text-muted">Uptime:</span>{' '}
            <span className="font-medium">{formatUptime(status.engine.uptime)}</span>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex gap-3">
        {!isRunning ? (
          <Button
            variant="primary"
            onClick={handleStart}
            loading={starting}
            disabled={stopping}
          >
            Start Automation
          </Button>
        ) : (
          <>
            <Button
              variant="secondary"
              onClick={() => handleStop(false)}
              loading={stopping}
            >
              Stop
            </Button>
            <Button
              variant="danger"
              onClick={() => handleStop(true)}
              disabled={stopping}
            >
              Emergency Stop
            </Button>
          </>
        )}
      </div>

      {/* Recent Errors */}
      {status?.engine.recentErrors && status.engine.recentErrors.length > 0 && (
        <div className="pt-3 border-t border-card-border">
          <h4 className="text-sm font-medium text-danger mb-2">Recent Errors</h4>
          <ul className="text-xs text-danger/80 space-y-1">
            {status.engine.recentErrors.slice(-3).map((err, i) => (
              <li key={i} className="truncate">
                {err}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}
