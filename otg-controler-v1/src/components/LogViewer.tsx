'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/src/components/ui';
import { getLogs, clearLogs } from '@/src/lib/api/automation';
import { LogEntry } from '@/src/lib/api/types';

interface LogViewerProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
  maxHeight?: string;
}

export function LogViewer({ autoRefresh = true, refreshInterval = 2000, maxHeight = 'h-56' }: LogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      const response = await getLogs(100);
      setLogs(response.logs);
      if (autoScroll && containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  }, [autoScroll]);

  useEffect(() => {
    fetchLogs();
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchLogs, autoRefresh, refreshInterval]);

  const handleClear = async () => {
    try {
      setClearing(true);
      await clearLogs();
      setLogs([]);
    } catch (err) {
      console.error('Failed to clear logs:', err);
    } finally {
      setClearing(false);
    }
  };

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      setAutoScroll(scrollTop + clientHeight >= scrollHeight - 50);
    }
  };

  // Log levels: Brightness indicates severity (errors brightest)
  const getLevelStyles = (level: string) => {
    switch (level) {
      case 'error':
        return { text: 'text-bright-snow', badge: 'bg-pale-slate text-carbon-black font-semibold' };
      case 'warn':
        return { text: 'text-platinum', badge: 'bg-alabaster-grey text-carbon-black' };
      case 'info':
        return { text: 'text-foreground', badge: 'bg-iron-grey text-platinum' };
      case 'debug':
        return { text: 'text-foreground-muted', badge: 'bg-gunmetal text-slate-grey' };
      default:
        return { text: 'text-foreground', badge: 'bg-iron-grey text-pale-slate' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-6 w-6 border-2 border-pale-slate-dark border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-foreground-secondary">{logs.length} entries</span>
          {autoScroll && (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-platinum text-carbon-black">
              LIVE
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-foreground-muted cursor-pointer select-none">
            <div className={`
              w-4 h-4 rounded border-2 flex items-center justify-center transition-all
              ${autoScroll ? 'bg-bright-snow border-bright-snow' : 'border-slate-grey'}
            `}>
              {autoScroll && (
                <svg className="w-2.5 h-2.5 text-carbon-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="sr-only"
            />
            Auto-scroll
          </label>
          <Button variant="ghost" size="sm" onClick={handleClear} loading={clearing}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear
          </Button>
        </div>
      </div>

      {/* Log Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className={`
          relative rounded-xl border border-border bg-background
          ${maxHeight} overflow-y-auto font-mono text-xs
        `}
      >
        {/* Gradient Fade Top */}
        <div className="sticky top-0 left-0 right-0 h-4 bg-gradient-to-b from-background to-transparent pointer-events-none z-10" />

        <div className="px-3 pb-3 space-y-1">
          {logs.length === 0 ? (
            <div className="py-8 text-center">
              <svg className="w-8 h-8 mx-auto mb-2 text-foreground-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-foreground-muted">No logs yet</p>
              <p className="text-foreground-subtle text-[10px] mt-0.5">Logs will appear here when automation runs</p>
            </div>
          ) : (
            logs.map((log, i) => {
              const styles = getLevelStyles(log.level);
              return (
                <div
                  key={i}
                  className={`
                    flex items-start gap-2 py-1.5 px-2 rounded-lg
                    hover:bg-background-subtle transition-colors
                    ${styles.text}
                  `}
                >
                  <span className="text-foreground-subtle shrink-0 w-16">
                    {formatTime(log.timestamp)}
                  </span>
                  {log.deviceId && (
                    <span className="px-1.5 py-0.5 text-[10px] rounded bg-gunmetal text-pale-slate shrink-0">
                      {log.deviceId.slice(-6)}
                    </span>
                  )}
                  <span className="break-all">{log.message}</span>
                </div>
              );
            })
          )}
        </div>

        {/* Gradient Fade Bottom */}
        <div className="sticky bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </div>
    </div>
  );
}

function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return isoString;
  }
}
