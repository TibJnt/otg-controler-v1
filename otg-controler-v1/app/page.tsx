'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DeviceSelector,
  CoordinateCalibrator,
  AutomationSettings,
  TriggerForm,
  TriggerList,
  AutomationControls,
  LogViewer,
} from '@/src/components';
import ScenarioSelector from '@/src/components/ScenarioSelector';
import {
  getAutomation,
  updateAutomation,
  getTriggers,
  createTrigger,
  deleteTrigger,
} from '@/src/lib/api/automation';
import { getDevices } from '@/src/lib/api/devices';
import { AutomationConfig, Trigger, Device, ActionType } from '@/src/lib/api/types';

export default function Home() {
  const [config, setConfig] = useState<AutomationConfig | null>(null);
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      const [automationRes, triggersRes, devicesRes] = await Promise.all([
        getAutomation(),
        getTriggers(),
        getDevices(),
      ]);

      if (automationRes.success) {
        setConfig(automationRes.config);
        setIsRunning(automationRes.config.running === 'running');
      }
      if (triggersRes.success) {
        setTriggers(triggersRes.triggers);
      }
      if (devicesRes.success) {
        setDevices(devicesRes.devices);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle device selection changes
  const handleDeviceSelectionChange = async (deviceIds: string[]) => {
    try {
      const response = await updateAutomation({ deviceIds });
      if (response.success) {
        setConfig(response.config);
      }
    } catch (err) {
      console.error('Failed to update device selection:', err);
    }
  };

  // Handle automation config updates
  const handleConfigUpdate = async (updates: Partial<AutomationConfig>): Promise<boolean> => {
    try {
      const response = await updateAutomation(updates);
      if (response.success) {
        setConfig(response.config);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to update config:', err);
      return false;
    }
  };

  // Handle trigger creation
  const handleCreateTrigger = async (triggerData: {
    action: ActionType;
    keywordsInput: string;
    deviceIds?: string[];
    commentTemplates?: string[];
    probability?: number;
  }) => {
    const response = await createTrigger(triggerData);
    if (response.success) {
      setTriggers(response.triggers);
    } else {
      throw new Error(response.error || 'Failed to create trigger');
    }
  };

  // Handle trigger deletion
  const handleDeleteTrigger = async (triggerId: string) => {
    const response = await deleteTrigger(triggerId);
    if (response.success) {
      setTriggers(response.triggers);
    } else {
      throw new Error(response.error || 'Failed to delete trigger');
    }
  };

  // Handle automation status change
  const handleStatusChange = (running: boolean) => {
    setIsRunning(running);
  };

  // Handle scenario applied
  const handleScenarioApplied = async () => {
    // Reload all data after scenario is applied
    await loadData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-3 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted">Loading OTG Controller...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-card-border bg-card px-6 py-4">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">OTG Controller</h1>
          <div className="flex items-center gap-4">
            <span className={`text-sm font-medium ${isRunning ? 'text-success' : 'text-muted'}`}>
              Status: {isRunning ? '● Running' : 'Idle'}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Select Devices Section */}
            <section className="rounded-lg border border-card-border bg-card p-6">
              <h2 className="text-lg font-medium mb-4">Select Devices</h2>
              <DeviceSelector
                selectedDeviceIds={config?.deviceIds ?? []}
                onSelectionChange={handleDeviceSelectionChange}
              />
            </section>

            {/* Device Coordinates Section */}
            <section className="rounded-lg border border-card-border bg-card p-6">
              <h2 className="text-lg font-medium mb-4">Device Action Coordinates</h2>
              <CoordinateCalibrator />
            </section>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Scenario Preset Section */}
            <section className="rounded-lg border border-card-border bg-card p-6">
              <ScenarioSelector
                deviceIds={config?.deviceIds ?? []}
                onScenarioApplied={handleScenarioApplied}
                disabled={isRunning}
              />
            </section>

            {/* Automation Settings Section */}
            <section className="rounded-lg border border-card-border bg-card p-6">
              <h2 className="text-lg font-medium mb-4">Automation Settings</h2>
              <AutomationSettings
                config={config}
                onUpdate={handleConfigUpdate}
                disabled={isRunning}
              />
            </section>

            {/* Automation Actions Section */}
            <section className="rounded-lg border border-card-border bg-card p-6">
              <h2 className="text-lg font-medium mb-4">Automation Actions (Triggers)</h2>
              <div className="space-y-4">
                <TriggerForm
                  devices={devices}
                  onSubmit={handleCreateTrigger}
                  disabled={isRunning}
                />
                <div className="pt-4 border-t border-card-border">
                  <TriggerList
                    triggers={triggers}
                    onDelete={handleDeleteTrigger}
                    disabled={isRunning}
                  />
                </div>
              </div>
            </section>

            {/* Controls Section */}
            <section className="rounded-lg border border-card-border bg-card p-6">
              <h2 className="text-lg font-medium mb-4">Controls</h2>
              <AutomationControls onStatusChange={handleStatusChange} />
            </section>
          </div>
        </div>

        {/* Logs Section */}
        <section className="mt-6 rounded-lg border border-card-border bg-card p-6">
          <h2 className="text-lg font-medium mb-4">Logs</h2>
          <LogViewer autoRefresh={true} refreshInterval={2000} />
        </section>
      </main>
    </div>
  );
}
