'use client';

import { useState } from 'react';
import { Button } from '@/src/components/ui';
import { Trigger } from '@/src/lib/api/types';

interface TriggerListProps {
  triggers: Trigger[];
  onDelete: (triggerId: string) => Promise<void>;
  disabled?: boolean;
}

// Intensity-coded: Brightness = Importance
const actionStyles: Record<string, string> = {
  LIKE: 'bg-platinum text-carbon-black font-semibold',                    // HIGH - primary action
  COMMENT: 'bg-alabaster-grey text-carbon-black',                         // HIGH - engagement
  SAVE: 'bg-pale-slate text-carbon-black',                                // MEDIUM
  LIKE_AND_COMMENT: 'bg-bright-snow text-carbon-black font-semibold',     // BRIGHTEST - compound
  LIKE_AND_SAVE: 'bg-bright-snow text-carbon-black font-semibold',        // BRIGHTEST - compound
  NO_ACTION: 'bg-iron-grey text-pale-slate-dark',                         // LOW - passive
  SKIP: 'bg-carbon-black text-slate-grey border border-iron-grey',        // DARKEST - ignore
};

const actionLabels: Record<string, string> = {
  LIKE: 'Like',
  COMMENT: 'Comment',
  SAVE: 'Save',
  LIKE_AND_COMMENT: 'Like + Comment',
  LIKE_AND_SAVE: 'Like + Save',
  NO_ACTION: 'Watch Only',
  SKIP: 'Skip',
};

export function TriggerList({ triggers, onDelete, disabled }: TriggerListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (triggerId: string) => {
    try {
      setDeletingId(triggerId);
      await onDelete(triggerId);
    } finally {
      setDeletingId(null);
    }
  };

  if (triggers.length === 0) {
    return (
      <div className="py-8 text-center">
        <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-background-subtle flex items-center justify-center">
          <svg className="w-5 h-5 text-foreground-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <p className="text-sm text-foreground-muted">No triggers configured</p>
        <p className="text-xs text-foreground-subtle mt-1">Create one above to automate actions</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {triggers.map((trigger, index) => (
        <div
          key={trigger.id}
          className={`
            group flex items-center justify-between p-3 rounded-lg
            bg-background-subtle border border-border
            hover:border-border-hover hover:bg-background-card
            transition-all duration-200
          `}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-0.5 text-xs font-medium rounded ${actionStyles[trigger.action] || actionStyles.LIKE}`}>
                {actionLabels[trigger.action] || trigger.action}
              </span>

              {trigger.probability !== undefined && trigger.probability < 1 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-12 h-1.5 bg-carbon-black rounded-full overflow-hidden">
                    <div
                      className="h-full bg-pale-slate-dark rounded-full transition-all"
                      style={{ width: `${trigger.probability * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-foreground-muted">
                    {Math.round(trigger.probability * 100)}%
                  </span>
                </div>
              )}
            </div>

            <p className="mt-1.5 text-sm text-foreground truncate">
              {trigger.keywords.slice(0, 5).join(', ')}
              {trigger.keywords.length > 5 && (
                <span className="text-foreground-muted"> +{trigger.keywords.length - 5} more</span>
              )}
            </p>

            {trigger.commentTemplates && trigger.commentTemplates.length > 0 && (
              <p className="text-xs text-foreground-muted mt-1 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {trigger.commentTemplates.length} template{trigger.commentTemplates.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(trigger.id)}
            disabled={disabled}
            loading={deletingId === trigger.id}
            className="text-danger hover:text-danger-hover opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </Button>
        </div>
      ))}
    </div>
  );
}
