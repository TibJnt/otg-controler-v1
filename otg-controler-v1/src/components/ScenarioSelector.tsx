/**
 * Scenario Selector Component
 * Allows users to select and load preset automation scenarios
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ScenarioPreset } from '@/src/lib/types';
import { getScenarios, applyScenario } from '@/src/lib/api/scenarios';

interface ScenarioSelectorProps {
  deviceIds: string[];
  onScenarioApplied: () => void;
  disabled?: boolean;
}

export default function ScenarioSelector({
  deviceIds,
  onScenarioApplied,
  disabled = false,
}: ScenarioSelectorProps) {
  const [scenarios, setScenarios] = useState<ScenarioPreset[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load scenarios on mount
  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = async () => {
    try {
      const response = await getScenarios();
      setScenarios(response.scenarios);
    } catch (err) {
      console.error('Failed to load scenarios:', err);
      setError('Failed to load scenarios');
    }
  };

  const handleApply = async () => {
    if (!selectedScenarioId) return;

    // Validate devices selected
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
      setSuccess(`✓ ${scenarioName} loaded successfully!`);
      setError(null);
      onScenarioApplied();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to apply scenario:', err);
      setError(err instanceof Error ? err.message : 'Failed to apply scenario');
      setSuccess(null);
    } finally {
      setLoading(false);
    }
  };

  const selectedScenario = scenarios.find(s => s.id === selectedScenarioId);

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <h3 className="text-lg font-semibold mb-3">Scenario Presets</h3>

      {error && (
        <div className="mb-3 p-2 bg-red-100 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-3 p-2 bg-green-100 text-green-700 rounded text-sm font-medium">
          {success}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">
            Select Scenario
          </label>
          <select
            value={selectedScenarioId}
            onChange={(e) => {
              setSelectedScenarioId(e.target.value);
              setError(null);
              setSuccess(null);
            }}
            disabled={disabled || loading}
            className="w-full p-2 border rounded bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">-- Choose a preset --</option>
            {scenarios.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.name}
              </option>
            ))}
          </select>
        </div>

        {selectedScenario && (
          <div className="p-3 bg-blue-50 rounded text-sm">
            <p className="font-medium mb-1">{selectedScenario.name}</p>
            <p className="text-gray-700 mb-2">{selectedScenario.description}</p>
            <div className="text-xs text-gray-600 space-y-1">
              <p>
                <span className="font-medium">Timing:</span>{' '}
                Post interval {selectedScenario.config.postIntervalSeconds}s,
                Scroll delay {selectedScenario.config.scrollDelaySeconds}s
              </p>
              <p>
                <span className="font-medium">Viewing Time:</span>{' '}
                Relevant {selectedScenario.config.viewingTime.relevant.minSeconds}-
                {selectedScenario.config.viewingTime.relevant.maxSeconds}s,
                Non-relevant {selectedScenario.config.viewingTime.nonRelevant.minSeconds}-
                {selectedScenario.config.viewingTime.nonRelevant.maxSeconds}s
              </p>
              <p>
                <span className="font-medium">Triggers:</span>{' '}
                {selectedScenario.triggers.length} action(s) configured
              </p>
            </div>
          </div>
        )}

        {deviceIds.length === 0 && (
          <div className="p-2 bg-yellow-50 text-yellow-800 rounded text-sm">
            ⚠️ Select devices in Automation Settings below before loading a scenario
          </div>
        )}

        <button
          onClick={handleApply}
          disabled={disabled || loading || !selectedScenarioId || deviceIds.length === 0}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded font-medium
                   hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed
                   transition-colors"
        >
          {loading ? 'Loading Scenario...' : 'Load Scenario'}
        </button>
      </div>
    </div>
  );
}
