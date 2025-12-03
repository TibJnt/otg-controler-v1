'use client';

import { useState } from 'react';
import { Input, Select, Button } from '@/src/components/ui';
import { ActionType, Device } from '@/src/lib/api/types';

const ACTION_OPTIONS = [
  { value: 'LIKE', label: 'Like' },
  { value: 'COMMENT', label: 'Comment' },
  { value: 'SAVE', label: 'Save' },
  { value: 'LIKE_AND_COMMENT', label: 'Like & Comment' },
  { value: 'LIKE_AND_SAVE', label: 'Like & Save' },
  { value: 'NO_ACTION', label: 'No Action (Watch Only)' },
  { value: 'SKIP', label: 'Skip' },
];

interface TriggerFormProps {
  devices: Device[];
  onSubmit: (trigger: {
    action: ActionType;
    keywordsInput: string;
    deviceIds?: string[];
    commentTemplates?: string[];
    probability?: number;
  }) => Promise<void>;
  disabled?: boolean;
}

export function TriggerForm({ devices, onSubmit, disabled }: TriggerFormProps) {
  const [action, setAction] = useState<ActionType>('LIKE');
  const [keywords, setKeywords] = useState('');
  const [commentTemplates, setCommentTemplates] = useState('');
  const [probability, setProbability] = useState('1');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!keywords.trim()) {
      setError('Keywords are required');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const triggerData: Parameters<typeof onSubmit>[0] = {
        action,
        keywordsInput: keywords,
        probability: parseFloat(probability) || 1,
      };

      // Add comment templates if action involves commenting
      if ((action === 'COMMENT' || action === 'LIKE_AND_COMMENT') && commentTemplates.trim()) {
        triggerData.commentTemplates = commentTemplates
          .split('\n')
          .map((t) => t.trim())
          .filter((t) => t.length > 0);
      }

      await onSubmit(triggerData);

      // Reset form
      setKeywords('');
      setCommentTemplates('');
      setProbability('1');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create trigger');
    } finally {
      setSubmitting(false);
    }
  };

  const showCommentTemplates = action === 'COMMENT' || action === 'LIKE_AND_COMMENT';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-danger/10 border border-danger/20 rounded-md text-sm text-danger">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Action"
          options={ACTION_OPTIONS}
          value={action}
          onChange={(e) => setAction(e.target.value as ActionType)}
          disabled={disabled}
        />
        <Input
          label="Probability (0-1)"
          type="number"
          min={0}
          max={1}
          step={0.1}
          value={probability}
          onChange={(e) => setProbability(e.target.value)}
          disabled={disabled}
        />
      </div>

      <Input
        label="Keywords (comma-separated)"
        value={keywords}
        onChange={(e) => setKeywords(e.target.value)}
        placeholder="e.g., dance, dancing, girl, music"
        disabled={disabled}
      />

      {showCommentTemplates && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Comment Templates (one per line)
          </label>
          <textarea
            className="w-full px-3 py-2 rounded-md border border-card-border bg-background text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            rows={3}
            value={commentTemplates}
            onChange={(e) => setCommentTemplates(e.target.value)}
            placeholder="Great video!&#10;Love this!&#10;Amazing content"
            disabled={disabled}
          />
        </div>
      )}

      <Button type="submit" variant="primary" disabled={disabled} loading={submitting}>
        Create Trigger
      </Button>
    </form>
  );
}
