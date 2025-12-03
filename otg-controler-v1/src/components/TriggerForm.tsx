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

      if ((action === 'COMMENT' || action === 'LIKE_AND_COMMENT') && commentTemplates.trim()) {
        triggerData.commentTemplates = commentTemplates
          .split('\n')
          .map((t) => t.trim())
          .filter((t) => t.length > 0);
      }

      await onSubmit(triggerData);

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
        <div className="flex items-center gap-2 p-3 bg-danger-muted border border-danger/20 rounded-lg text-sm text-danger">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
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
          label="Probability"
          type="number"
          min={0}
          max={1}
          step={0.1}
          value={probability}
          onChange={(e) => setProbability(e.target.value)}
          disabled={disabled}
          hint="0 to 1 (e.g., 0.5 = 50%)"
        />
      </div>

      <Input
        label="Keywords"
        value={keywords}
        onChange={(e) => setKeywords(e.target.value)}
        placeholder="dance, dancing, girl, music"
        disabled={disabled}
        hint="Comma-separated keywords to match"
      />

      {showCommentTemplates && (
        <div>
          <label className="block text-sm font-medium text-foreground-secondary mb-2">
            Comment Templates
          </label>
          <textarea
            className={`
              w-full px-4 py-2.5 rounded-lg text-sm
              bg-background-input text-foreground
              border border-border transition-all duration-200
              placeholder:text-foreground-subtle
              focus:outline-none focus:ring-2 focus:ring-pale-slate-dark/20 focus:border-pale-slate-dark
              disabled:opacity-40 disabled:cursor-not-allowed
              resize-none
            `}
            rows={3}
            value={commentTemplates}
            onChange={(e) => setCommentTemplates(e.target.value)}
            placeholder="Great video!&#10;Love this!&#10;Amazing content"
            disabled={disabled}
          />
          <p className="mt-1.5 text-xs text-foreground-muted">One comment per line</p>
        </div>
      )}

      <Button type="submit" variant="primary" disabled={disabled} loading={submitting} className="w-full">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Create Trigger
      </Button>
    </form>
  );
}
