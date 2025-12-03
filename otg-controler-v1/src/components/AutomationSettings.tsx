'use client';

import { useState, useEffect } from 'react';
import { Input, Button } from '@/src/components/ui';
import { AutomationConfig } from '@/src/lib/api/types';

interface AutomationSettingsProps {
  config: AutomationConfig | null;
  onUpdate: (updates: Partial<AutomationConfig>) => Promise<boolean>;
  disabled?: boolean;
}

export function AutomationSettings({ config, onUpdate, disabled }: AutomationSettingsProps) {
  const [name, setName] = useState('');
  const [postInterval, setPostInterval] = useState('');
  const [scrollDelay, setScrollDelay] = useState('');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (config) {
      setName(config.name);
      setPostInterval(config.postIntervalSeconds.toString());
      setScrollDelay(config.scrollDelaySeconds.toString());
      setHasChanges(false);
    }
  }, [config]);

  const handleChange = (field: string, value: string) => {
    setHasChanges(true);
    switch (field) {
      case 'name': setName(value); break;
      case 'postInterval': setPostInterval(value); break;
      case 'scrollDelay': setScrollDelay(value); break;
    }
  };

  const handleSave = async () => {
    const postIntervalNum = parseInt(postInterval, 10);
    const scrollDelayNum = parseInt(scrollDelay, 10);
    if (isNaN(postIntervalNum) || isNaN(scrollDelayNum)) return;
    try {
      setSaving(true);
      const success = await onUpdate({ name, postIntervalSeconds: postIntervalNum, scrollDelaySeconds: scrollDelayNum });
      if (success) setHasChanges(false);
    } finally {
      setSaving(false);
    }
  };

  if (!config) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-6 w-6 border-2 border-pale-slate-dark border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Input
        label="Automation Name"
        value={name}
        onChange={(e) => handleChange('name', e.target.value)}
        placeholder="e.g., Dancing Videos"
        disabled={disabled}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Post Interval (seconds)"
          type="number"
          min={1}
          value={postInterval}
          onChange={(e) => handleChange('postInterval', e.target.value)}
          disabled={disabled}
          hint="Delay between videos"
        />
        <Input
          label="Scroll Delay (seconds)"
          type="number"
          min={1}
          value={scrollDelay}
          onChange={(e) => handleChange('scrollDelay', e.target.value)}
          disabled={disabled}
          hint="Wait after scrolling"
        />
      </div>

      {config.viewingTime && (
        <div className="p-4 bg-background-subtle rounded-xl border border-border">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-pale-slate-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h4 className="text-sm font-semibold text-foreground">Viewing Time</h4>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-lg bg-background-card">
              <span className="text-foreground-muted text-xs">Relevant content</span>
              <p className="text-foreground font-medium mt-1">
                {config.viewingTime.relevant.minSeconds}–{config.viewingTime.relevant.maxSeconds}s
              </p>
            </div>
            <div className="p-3 rounded-lg bg-background-card">
              <span className="text-foreground-muted text-xs">Non-relevant content</span>
              <p className="text-foreground font-medium mt-1">
                {config.viewingTime.nonRelevant.minSeconds}–{config.viewingTime.nonRelevant.maxSeconds}s
              </p>
            </div>
          </div>
          <p className="text-xs text-foreground-muted mt-3">
            Simulates natural viewing behavior before taking action
          </p>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <div className={`led ${config.deviceIds.length > 0 ? 'led-success' : 'led-muted'}`} />
          <span className="text-sm text-foreground-secondary">
            {config.deviceIds.length} device{config.deviceIds.length !== 1 ? 's' : ''} selected
          </span>
        </div>
        <Button variant="primary" onClick={handleSave} disabled={disabled || !hasChanges} loading={saving} size="sm">
          {hasChanges ? 'Save Changes' : 'Saved'}
        </Button>
      </div>
    </div>
  );
}
