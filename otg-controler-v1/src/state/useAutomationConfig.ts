'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAutomation, updateAutomation } from '@/src/lib/api/automation';
import { AutomationConfig } from '@/src/lib/api/types';

interface UseAutomationConfigResult {
  config: AutomationConfig | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  update: (updates: Partial<AutomationConfig>) => Promise<boolean>;
  setSelectedDevices: (deviceIds: string[]) => Promise<boolean>;
}

export function useAutomationConfig(): UseAutomationConfigResult {
  const [config, setConfig] = useState<AutomationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAutomation();
      setConfig(response.config);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load automation config');
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(async (updates: Partial<AutomationConfig>): Promise<boolean> => {
    try {
      setError(null);
      const response = await updateAutomation(updates);
      setConfig(response.config);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update automation config');
      return false;
    }
  }, []);

  const setSelectedDevices = useCallback(
    async (deviceIds: string[]): Promise<boolean> => {
      return update({ deviceIds });
    },
    [update]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    config,
    loading,
    error,
    refresh,
    update,
    setSelectedDevices,
  };
}
