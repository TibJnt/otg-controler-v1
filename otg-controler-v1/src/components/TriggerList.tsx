'use client';

import { useState } from 'react';
import { Button } from '@/src/components/ui';
import { Trigger } from '@/src/lib/api/types';

interface TriggerListProps {
  triggers: Trigger[];
  onDelete: (triggerId: string) => Promise<void>;
  disabled?: boolean;
}

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
      <div className="py-6 text-center text-muted text-sm">
        No triggers configured yet. Create one above.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {triggers.map((trigger) => (
        <div
          key={trigger.id}
          className="flex items-center justify-between p-3 rounded-md border border-card-border hover:bg-background transition-colors"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded ${
                  trigger.action === 'LIKE'
                    ? 'bg-primary/20 text-primary'
                    : trigger.action === 'COMMENT'
                      ? 'bg-success/20 text-success'
                      : trigger.action === 'SAVE'
                        ? 'bg-warning/20 text-warning'
                        : trigger.action === 'SKIP'
                          ? 'bg-muted/20 text-muted'
                          : 'bg-primary/20 text-primary'
                }`}
              >
                {trigger.action}
              </span>
              {trigger.probability !== undefined && trigger.probability < 1 && (
                <span className="text-xs text-muted">
                  {Math.round(trigger.probability * 100)}% chance
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-foreground truncate">
              Keywords: {trigger.keywords.join(', ')}
            </p>
            {trigger.commentTemplates && trigger.commentTemplates.length > 0 && (
              <p className="text-xs text-muted truncate">
                {trigger.commentTemplates.length} comment template(s)
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(trigger.id)}
            disabled={disabled}
            loading={deletingId === trigger.id}
            className="text-danger hover:text-danger-hover"
          >
            Delete
          </Button>
        </div>
      ))}
    </div>
  );
}
