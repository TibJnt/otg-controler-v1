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
      case 'name':
        setName(value);
        break;
      case 'postInterval':
        setPostInterval(value);
        break;
      case 'scrollDelay':
        setScrollDelay(value);
        break;
    }
  };

  const handleSave = async () => {
    const postIntervalNum = parseInt(postInterval, 10);
    const scrollDelayNum = parseInt(scrollDelay, 10);

    if (isNaN(postIntervalNum) || isNaN(scrollDelayNum)) {
      return;
    }

    try {
      setSaving(true);
      const success = await onUpdate({
        name,
        postIntervalSeconds: postIntervalNum,
        scrollDelaySeconds: scrollDelayNum,
      });
      if (success) {
        setHasChanges(false);
      }
    } finally {
      setSaving(false);
    }
  };

  if (!config) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
        />
        <Input
          label="Scroll Delay (seconds)"
          type="number"
          min={1}
          value={scrollDelay}
          onChange={(e) => handleChange('scrollDelay', e.target.value)}
          disabled={disabled}
        />
      </div>

      {config.viewingTime && (
        <div className="p-3 bg-blue-50 rounded border border-blue-200">
          <h4 className="text-sm font-semibold mb-2">Viewing Time Configuration</h4>
          <div className="text-sm text-gray-700 space-y-1">
            <p>
              <span className="font-medium">Relevant content:</span>{' '}
              {config.viewingTime.relevant.minSeconds}-{config.viewingTime.relevant.maxSeconds}s
            </p>
            <p>
              <span className="font-medium">Non-relevant content:</span>{' '}
              {config.viewingTime.nonRelevant.minSeconds}-{config.viewingTime.nonRelevant.maxSeconds}s
            </p>
            <p className="text-xs text-gray-600 mt-2">
              Simulates watching videos before taking action. Relevant content is watched longer.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <span className="text-sm text-muted">
          {config.deviceIds.length} device(s) selected
        </span>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={disabled || !hasChanges}
          loading={saving}
        >
          Save Settings
        </Button>
      </div>
    </div>
  );
}
