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
import { CollapsibleSection, Button } from '@/src/components/ui';
import {
  getAutomation,
  updateAutomation,
  getTriggers,
  createTrigger,
  deleteTrigger,
  startAutomation,
  stopAutomation,
} from '@/src/lib/api/automation';
import { getDevices } from '@/src/lib/api/devices';
import { AutomationConfig, Trigger, Device, ActionType, Platform } from '@/src/lib/api/types';
import { useAccentColor, AccentColor } from '@/src/lib/hooks/useAccentColor';

export default function Home() {
  const [config, setConfig] = useState<AutomationConfig | null>(null);
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const { accent, setAccent } = useAccentColor();

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
      if (triggersRes.success) setTriggers(triggersRes.triggers);
      if (devicesRes.success) setDevices(devicesRes.devices);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDeviceSelectionChange = async (deviceIds: string[]) => {
    try {
      const response = await updateAutomation({ deviceIds });
      if (response.success) setConfig(response.config);
    } catch (err) {
      console.error('Failed to update device selection:', err);
    }
  };

  const handleConfigUpdate = async (updates: Partial<AutomationConfig>): Promise<boolean> => {
    try {
      const response = await updateAutomation(updates);
      if (response.success) { setConfig(response.config); return true; }
      return false;
    } catch (err) {
      console.error('Failed to update config:', err);
      return false;
    }
  };

  const handleCreateTrigger = async (triggerData: {
    action: ActionType;
    keywordsInput: string;
    deviceIds?: string[];
    commentTemplates?: string[];
    probability?: number;
  }) => {
    const response = await createTrigger(triggerData);
    if (response.success) setTriggers(response.triggers);
    else throw new Error(response.error || 'Failed to create trigger');
  };

  const handleDeleteTrigger = async (triggerId: string) => {
    const response = await deleteTrigger(triggerId);
    if (response.success) setTriggers(response.triggers);
    else throw new Error(response.error || 'Failed to delete trigger');
  };

  const handleStatusChange = (running: boolean) => setIsRunning(running);
  const handleScenarioApplied = async () => { await loadData(); };

  const handleStart = async () => {
    try {
      setStarting(true);
      await startAutomation();
      await loadData();
    } catch (err) {
      console.error('Failed to start automation:', err);
    } finally {
      setStarting(false);
    }
  };

  const handleStop = async () => {
    try {
      setStopping(true);
      await stopAutomation();
      await loadData();
    } catch (err) {
      console.error('Failed to stop automation:', err);
    } finally {
      setStopping(false);
    }
  };

  const handlePlatformChange = async (platform: Platform) => {
    try {
      const response = await updateAutomation({ platform });
      if (response.success) setConfig(response.config);
    } catch (err) {
      console.error('Failed to update platform:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-2xl bg-pale-slate-dark/20 animate-ping" />
            <div className="relative w-16 h-16 rounded-2xl bg-background-card border border-border flex items-center justify-center">
              <div className="animate-spin h-6 w-6 border-2 border-pale-slate-dark border-t-transparent rounded-full" />
            </div>
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-1">OTG Controller</h2>
          <p className="text-sm text-foreground-muted">Loading your automation dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-strong border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-grey to-iron-grey flex items-center justify-center shadow-lg shadow-slate-grey/20">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">OTG Controller</h1>
                <p className="text-xs text-foreground-muted">iPhone Automation</p>
              </div>
            </div>

            {/* Platform Switcher & Status */}
            <div className="flex items-center gap-4">
              {/* Color Switcher */}
              <div className="relative">
                <button
                  onClick={() => setColorMenuOpen(!colorMenuOpen)}
                  className="p-2 rounded-lg bg-background-subtle border border-border hover:border-border-hover transition-colors"
                  title="Accent Color"
                >
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: `var(--accent-${accent})` }}
                  />
                </button>
                {colorMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setColorMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 p-2 rounded-lg glass-strong border border-border shadow-lg z-50 min-w-[140px]">
                      {(['emerald', 'blue', 'violet'] as AccentColor[]).map((color) => (
                        <button
                          key={color}
                          onClick={() => { setAccent(color); setColorMenuOpen(false); }}
                          className={`
                            w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors
                            ${accent === color ? 'bg-iron-grey text-foreground' : 'text-foreground-muted hover:bg-iron-grey/50'}
                          `}
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: `var(--accent-${color})` }}
                          />
                          <span className="capitalize">{color}</span>
                          {accent === color && (
                            <svg className="w-3 h-3 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Platform Tabs */}
              <div className="flex p-1 rounded-lg glass-tabs">
                <button
                  onClick={() => !isRunning && handlePlatformChange('tiktok')}
                  disabled={isRunning}
                  className={`
                    px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200
                    ${config?.platform === 'tiktok'
                      ? 'glass text-foreground shadow-sm'
                      : 'text-foreground-muted hover:text-foreground'
                    }
                    ${isRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  TikTok
                </button>
                <button
                  onClick={() => !isRunning && handlePlatformChange('instagram')}
                  disabled={isRunning}
                  className={`
                    px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200
                    ${config?.platform === 'instagram'
                      ? 'glass text-foreground shadow-sm'
                      : 'text-foreground-muted hover:text-foreground'
                    }
                    ${isRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  Instagram
                </button>
              </div>

              {/* Status Pill - Accent color when running */}
              <div className={`
                flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-300
                ${isRunning
                  ? 'bg-[var(--accent)] text-white shadow-[0_0_16px_var(--accent-glow)]'
                  : 'bg-gunmetal text-slate-grey'
                }
              `}>
                <div className={`led ${isRunning ? 'led-accent' : 'led-muted'}`} />
                {isRunning ? 'Running' : 'Idle'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8 space-y-6">
        {/* PRIMARY: Setup Workflow - 3 Column Grid */}
        <div className="grid gap-5 lg:grid-cols-3">
          {/* Step 1: Devices */}
          <section className="card card-elevated">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-6 rounded-full bg-pale-slate-dark text-carbon-black flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <h2 className="text-base font-semibold text-foreground">Devices</h2>
              </div>
              <DeviceSelector
                selectedDeviceIds={config?.deviceIds ?? []}
                onSelectionChange={handleDeviceSelectionChange}
              />
            </div>
          </section>

          {/* Step 2: Calibration */}
          <section className="card card-elevated">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-6 rounded-full bg-pale-slate-dark text-carbon-black flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <h2 className="text-base font-semibold text-foreground">Calibration</h2>
              </div>
              <CoordinateCalibrator platform={config?.platform ?? 'tiktok'} />
            </div>
          </section>

          {/* Step 3: Scenarios */}
          <section className="card card-elevated">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-6 rounded-full bg-pale-slate-dark text-carbon-black flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <h2 className="text-base font-semibold text-foreground">Scenarios</h2>
              </div>
              <ScenarioSelector
                platform={config?.platform ?? 'tiktok'}
                deviceIds={config?.deviceIds ?? []}
                onScenarioApplied={handleScenarioApplied}
                disabled={isRunning}
              />
            </div>
          </section>
        </div>

        {/* ACTION BAR: Start/Stop Automation */}
        <div className={`
          card transition-all duration-300
          ${isRunning ? 'card-accent' : 'card-float'}
        `}>
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`
                relative w-10 h-10 rounded-xl flex items-center justify-center
                ${isRunning ? 'bg-[var(--accent)]/20' : 'bg-iron-grey'}
              `}>
                {isRunning && (
                  <div className="absolute inset-0 rounded-xl bg-[var(--accent)]/30 animate-ping" />
                )}
                <div className={`led ${isRunning ? 'led-accent animate-pulse-accent' : 'led-muted'}`} style={{ width: '12px', height: '12px' }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${isRunning ? 'text-bright-snow' : 'text-foreground-muted'}`}>
                    {isRunning ? 'Automation Running' : 'Ready to Start'}
                  </span>
                  {isRunning && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-[var(--accent)] text-white">
                      LIVE
                    </span>
                  )}
                </div>
                <p className="text-xs text-foreground-muted mt-0.5">
                  {isRunning
                    ? 'Automation is actively processing devices'
                    : `${config?.deviceIds?.length ?? 0} device(s) selected`
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!isRunning ? (
                <Button
                  variant="success"
                  size="lg"
                  onClick={handleStart}
                  loading={starting}
                  disabled={!config?.deviceIds?.length}
                  glow
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Start Automation
                </Button>
              ) : (
                <Button
                  variant="danger"
                  size="lg"
                  onClick={handleStop}
                  loading={stopping}
                  glow
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                  </svg>
                  Stop Automation
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* SECONDARY: Collapsible Advanced Section */}
        <CollapsibleSection title="Advanced Options">
          <div className="grid gap-5 lg:grid-cols-3">
            {/* Controls */}
            <div className={`
              card card-float transition-all duration-300
              ${isRunning ? 'card-accent' : ''}
            `}>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isRunning ? 'bg-[var(--accent)]' : 'bg-iron-grey'}`}>
                    <svg className={`w-3.5 h-3.5 ${isRunning ? 'text-white' : 'text-platinum'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">Controls</h3>
                </div>
                <AutomationControls onStatusChange={handleStatusChange} />
              </div>
            </div>

            {/* Settings */}
            <div className="card card-float">
              <div className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-iron-grey flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-platinum" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">Settings</h3>
                </div>
                <AutomationSettings
                  config={config}
                  onUpdate={handleConfigUpdate}
                  disabled={isRunning}
                />
              </div>
            </div>

            {/* Triggers */}
            <div className="card card-float">
              <div className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-iron-grey flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-bright-snow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">Triggers</h3>
                  {triggers.length > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-platinum text-carbon-black">
                      {triggers.length}
                    </span>
                  )}
                </div>
                <div className="space-y-4">
                  <TriggerForm
                    devices={devices}
                    onSubmit={handleCreateTrigger}
                    disabled={isRunning}
                  />
                  <div className="pt-4 border-t border-border">
                    <TriggerList
                      triggers={triggers}
                      onDelete={handleDeleteTrigger}
                      disabled={isRunning}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Activity Log - Compact */}
        <section className="card card-float">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-iron-grey flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-pale-slate" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-sm font-semibold text-foreground">Activity Log</h2>
            </div>
            <LogViewer autoRefresh={true} refreshInterval={2000} maxHeight="max-h-32" />
          </div>
        </section>
      </main>
    </div>
  );
}
