'use client';

import { useState, useEffect, useMemo } from 'react';
import { ScenarioPreset, Platform } from '@/src/lib/types';
import { getScenarios, applyScenario } from '@/src/lib/api/scenarios';
import { Button, Select } from '@/src/components/ui';

interface ScenarioSelectorProps {
  platform: Platform;
  deviceIds: string[];
  onScenarioApplied: () => void;
  disabled?: boolean;
}

export default function ScenarioSelector({
  platform,
  deviceIds,
  onScenarioApplied,
  disabled = false,
}: ScenarioSelectorProps) {
  const [allScenarios, setAllScenarios] = useState<ScenarioPreset[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const scenarios = useMemo(() => {
    return allScenarios.filter((s) => (s.platform || 'tiktok') === platform);
  }, [allScenarios, platform]);

  useEffect(() => {
    if (selectedScenarioId) {
      const selectedExists = scenarios.some((s) => s.id === selectedScenarioId);
      if (!selectedExists) setSelectedScenarioId('');
    }
  }, [platform, scenarios, selectedScenarioId]);

  useEffect(() => { loadScenarios(); }, []);

  const loadScenarios = async () => {
    try {
      const response = await getScenarios();
      setAllScenarios(response.scenarios);
    } catch (err) {
      console.error('Failed to load scenarios:', err);
      setError('Failed to load scenarios');
    }
  };

  const handleApply = async () => {
    if (!selectedScenarioId) return;
    if (deviceIds.length === 0) {
      setError('Please select at least one device first');
      setSuccess(null);
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await applyScenario(selectedScenarioId, deviceIds);
      const scenarioName = scenarios.find(s => s.id === selectedScenarioId)?.name || 'Scenario';
      setSuccess(`${scenarioName} loaded successfully!`);
      onScenarioApplied();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply scenario');
    } finally {
      setLoading(false);
    }
  };

  const selectedScenario = scenarios.find(s => s.id === selectedScenarioId);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-pale-slate-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <h3 className="text-base font-semibold text-foreground">Scenario Presets</h3>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 glass-alert glass-alert-danger rounded-lg text-sm text-danger">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 glass-alert glass-alert-success rounded-lg text-sm text-success">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {success}
        </div>
      )}

      <Select
        label="Select Scenario"
        value={selectedScenarioId}
        onChange={(e) => { setSelectedScenarioId(e.target.value); setError(null); setSuccess(null); }}
        disabled={disabled || loading}
        placeholder="Choose a preset..."
        options={scenarios.map((scenario) => ({ value: scenario.id, label: scenario.name }))}
      />

      {selectedScenario && (
        <div className="p-4 glass rounded-xl space-y-3">
          <div>
            <h4 className="text-sm font-semibold text-foreground">{selectedScenario.name}</h4>
            <p className="text-sm text-foreground-muted mt-0.5">{selectedScenario.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2 rounded-lg glass-item">
              <span className="text-foreground-muted">Timing</span>
              <p className="text-foreground font-medium mt-0.5">
                {selectedScenario.config.postIntervalSeconds}s interval, {selectedScenario.config.scrollDelaySeconds}s scroll
              </p>
            </div>
            <div className="p-2 rounded-lg glass-item">
              <span className="text-foreground-muted">Triggers</span>
              <p className="text-foreground font-medium mt-0.5">
                {selectedScenario.triggers.length} action{selectedScenario.triggers.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="col-span-2 p-2 rounded-lg glass-item">
              <span className="text-foreground-muted">Viewing Time</span>
              <p className="text-foreground font-medium mt-0.5">
                Relevant: {selectedScenario.config.viewingTime.relevant.minSeconds}-{selectedScenario.config.viewingTime.relevant.maxSeconds}s
                <span className="text-foreground-muted mx-2">•</span>
                Non-relevant: {selectedScenario.config.viewingTime.nonRelevant.minSeconds}-{selectedScenario.config.viewingTime.nonRelevant.maxSeconds}s
              </p>
            </div>
          </div>
        </div>
      )}

      {deviceIds.length === 0 && (
        <div className="flex items-center gap-2 p-3 glass-alert glass-alert-warning rounded-lg text-sm text-warning">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Select devices in "Select Devices" before loading
        </div>
      )}

      <Button onClick={handleApply} disabled={disabled || loading || !selectedScenarioId || deviceIds.length === 0} loading={loading} className="w-full" glow>
        {loading ? 'Loading Scenario...' : 'Load Scenario'}
      </Button>
    </div>
  );
}
