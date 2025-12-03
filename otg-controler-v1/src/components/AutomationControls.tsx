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
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleStart = async () => {
    try {
      setStarting(true);
      setError(null);
      setWarnings([]);
      const response = await startAutomation();
      if (response.warnings) setWarnings(response.warnings);
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
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-6 w-6 border-2 border-pale-slate-dark border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Status Indicator - Accent color when running */}
      <div className={`
        flex items-center gap-4 p-4 rounded-xl border transition-all duration-300
        ${isRunning
          ? 'bg-iron-grey border-[var(--accent)]/30 shadow-lg shadow-[var(--accent-muted)]'
          : 'bg-background-subtle border-border'
        }
      `}>
        <div className={`
          relative w-12 h-12 rounded-xl flex items-center justify-center
          ${isRunning ? 'bg-gunmetal' : 'bg-gunmetal'}
        `}>
          {isRunning && (
            <div className="absolute inset-0 rounded-xl bg-[var(--accent)]/20 animate-ping" />
          )}
          <div className={`led ${isRunning ? 'led-accent animate-pulse-accent' : 'led-muted'}`} style={{ width: '14px', height: '14px' }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${isRunning ? 'text-bright-snow' : 'text-foreground-muted'}`}>
              {status?.engine.status ?? 'Unknown'}
            </span>
            {isRunning && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-[var(--accent)] text-white shadow-[0_0_12px_var(--accent-glow)]">
                LIVE
              </span>
            )}
          </div>
          <div className={`flex items-center gap-4 mt-1 text-xs ${isRunning ? 'text-platinum' : 'text-foreground-muted'}`}>
            <span>{status?.engine.cycleCount ?? 0} cycles</span>
            {status?.engine.uptime !== null && status?.engine.uptime !== undefined && (
              <span>{formatUptime(status.engine.uptime)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Current Device */}
      {status?.engine.currentDevice && (
        <div className="flex items-center gap-2 text-sm">
          <svg className="w-4 h-4 text-foreground-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span className="text-foreground-secondary">Current:</span>
          <span className="text-foreground font-medium">{status.engine.currentDevice}</span>
        </div>
      )}

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-danger-muted border border-danger/20 rounded-lg text-sm text-danger">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="p-3 bg-warning-muted border border-warning/20 rounded-lg text-sm text-warning">
          <ul className="space-y-1">
            {warnings.map((w, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="shrink-0 mt-0.5">•</span>
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex gap-3">
        {!isRunning ? (
          <Button
            variant="success"
            onClick={handleStart}
            loading={starting}
            disabled={stopping}
            className="flex-1"
            glow
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            Start Automation
          </Button>
        ) : (
          <>
            <Button
              variant="secondary"
              onClick={() => handleStop(false)}
              loading={stopping}
              className="flex-1"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
              </svg>
              Stop
            </Button>
            <Button
              variant="danger"
              onClick={() => handleStop(true)}
              disabled={stopping}
              glow
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Emergency
            </Button>
          </>
        )}
      </div>

      {/* Recent Errors */}
      {status?.engine.recentErrors && status.engine.recentErrors.length > 0 && (
        <div className="pt-4 border-t border-border">
          <h4 className="text-xs font-medium text-danger mb-2 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Recent Errors
          </h4>
          <ul className="text-xs text-danger/80 space-y-1 font-mono">
            {status.engine.recentErrors.slice(-3).map((err, i) => (
              <li key={i} className="truncate p-1.5 rounded bg-danger-muted">
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
