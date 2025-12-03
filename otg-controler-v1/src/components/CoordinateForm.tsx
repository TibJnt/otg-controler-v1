'use client';

import { useState } from 'react';
import { Button, Input } from '@/src/components/ui';
import { NormalizedCoords } from '@/src/lib/api/types';

type ActionType =
  | 'like' | 'comment' | 'save' | 'commentInputField' | 'commentSendButton' | 'commentBackButton'
  | 'share' | 'commentCloseButton';

interface CoordinateFormProps {
  action: ActionType;
  currentCoords?: NormalizedCoords;
  deviceWidth: number;
  deviceHeight: number;
  onSave: (coords: { x: number; y: number }) => Promise<void>;
  disabled?: boolean;
}

export function CoordinateForm({
  action,
  currentCoords,
  deviceWidth,
  deviceHeight,
  onSave,
  disabled,
}: CoordinateFormProps) {
  const [x, setX] = useState<string>(
    currentCoords ? Math.round(currentCoords.xNorm * deviceWidth).toString() : ''
  );
  const [y, setY] = useState<string>(
    currentCoords ? Math.round(currentCoords.yNorm * deviceHeight).toString() : ''
  );
  const [saving, setSaving] = useState(false);

  const actionLabels: Record<string, string> = {
    like: 'Like',
    comment: 'Comment',
    save: 'Save',
    share: 'Share',
    commentSendButton: 'Send',
    commentInputField: 'Input',
    commentBackButton: 'Back',
    commentCloseButton: 'Close',
  };

  const handleSave = async () => {
    const xNum = parseInt(x, 10);
    const yNum = parseInt(y, 10);
    if (isNaN(xNum) || isNaN(yNum)) return;
    try {
      setSaving(true);
      await onSave({ x: xNum, y: yNum });
    } finally {
      setSaving(false);
    }
  };

  const isValid = x !== '' && y !== '' && !isNaN(parseInt(x, 10)) && !isNaN(parseInt(y, 10));

  return (
    <div className="flex items-end gap-3">
      <div className="w-20">
        <label className="block text-xs font-medium text-foreground-muted mb-1.5">
          {actionLabels[action] || action}
        </label>
        <input
          type="number"
          placeholder="X"
          min={0}
          max={deviceWidth}
          value={x}
          onChange={(e) => setX(e.target.value)}
          disabled={disabled}
          className={`
            w-full px-3 py-2 rounded-lg text-sm font-mono
            bg-background-input text-foreground
            border border-border transition-all duration-200
            placeholder:text-foreground-subtle
            focus:outline-none focus:ring-2 focus:ring-pale-slate-dark/20 focus:border-pale-slate-dark
            disabled:opacity-40 disabled:cursor-not-allowed
          `}
        />
      </div>
      <div className="w-20">
        <label className="block text-xs font-medium text-foreground-muted mb-1.5">
          &nbsp;
        </label>
        <input
          type="number"
          placeholder="Y"
          min={0}
          max={deviceHeight}
          value={y}
          onChange={(e) => setY(e.target.value)}
          disabled={disabled}
          className={`
            w-full px-3 py-2 rounded-lg text-sm font-mono
            bg-background-input text-foreground
            border border-border transition-all duration-200
            placeholder:text-foreground-subtle
            focus:outline-none focus:ring-2 focus:ring-pale-slate-dark/20 focus:border-pale-slate-dark
            disabled:opacity-40 disabled:cursor-not-allowed
          `}
        />
      </div>
      <Button
        variant="primary"
        size="sm"
        onClick={handleSave}
        disabled={disabled || !isValid}
        loading={saving}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Save
      </Button>
    </div>
  );
}
