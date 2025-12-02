'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/src/components/ui';
import { getLogs, clearLogs } from '@/src/lib/api/automation';
import { LogEntry } from '@/src/lib/api/types';

interface LogViewerProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function LogViewer({ autoRefresh = true, refreshInterval = 2000 }: LogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      const response = await getLogs(100);
      setLogs(response.logs);

      // Auto-scroll to bottom if enabled
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
      // Disable auto-scroll if user scrolled up
      setAutoScroll(scrollTop + clientHeight >= scrollHeight - 50);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-danger';
      case 'warn':
        return 'text-warning';
      case 'info':
        return 'text-foreground';
      case 'debug':
        return 'text-muted';
      default:
        return 'text-foreground';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">{logs.length} log entries</span>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-sm text-muted cursor-pointer">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="h-3 w-3"
            />
            Auto-scroll
          </label>
          <Button variant="ghost" size="sm" onClick={handleClear} loading={clearing}>
            Clear
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="bg-background rounded-md p-3 h-48 overflow-y-auto font-mono text-xs space-y-0.5"
      >
        {logs.length === 0 ? (
          <p className="text-muted">No logs yet...</p>
        ) : (
          logs.map((log, i) => (
            <div key={i} className={`${getLevelColor(log.level)} whitespace-pre-wrap break-all`}>
              <span className="text-muted">[{formatTime(log.timestamp)}]</span>
              {log.deviceId && <span className="text-primary"> [{log.deviceId}]</span>}
              {' '}{log.message}
            </div>
          ))
        )}
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
