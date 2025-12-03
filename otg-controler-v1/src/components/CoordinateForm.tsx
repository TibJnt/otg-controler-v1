'use client';

import { useState } from 'react';
import { Button, Input } from '@/src/components/ui';
import { NormalizedCoords } from '@/src/lib/api/types';

interface CoordinateFormProps {
  action: 'like' | 'comment' | 'save' | 'commentSendButton' | 'commentInputField' | 'commentBackButton';
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
    like: 'Like Button',
    comment: 'Comment Button',
    save: 'Save Button',
    commentSendButton: 'Send Comment Button',
    commentInputField: 'Comment Input Field',
  };

  const handleSave = async () => {
    const xNum = parseInt(x, 10);
    const yNum = parseInt(y, 10);

    if (isNaN(xNum) || isNaN(yNum)) {
      return;
    }

    try {
      setSaving(true);
      await onSave({ x: xNum, y: yNum });
    } finally {
      setSaving(false);
    }
  };

  const isValid = x !== '' && y !== '' && !isNaN(parseInt(x, 10)) && !isNaN(parseInt(y, 10));

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <Input
          label={actionLabels[action]}
          placeholder="X"
          type="number"
          min={0}
          max={deviceWidth}
          value={x}
          onChange={(e) => setX(e.target.value)}
          disabled={disabled}
        />
      </div>
      <div className="flex-1">
        <Input
          label="&nbsp;"
          placeholder="Y"
          type="number"
          min={0}
          max={deviceHeight}
          value={y}
          onChange={(e) => setY(e.target.value)}
          disabled={disabled}
        />
      </div>
      <Button
        variant="secondary"
        size="md"
        onClick={handleSave}
        disabled={disabled || !isValid}
        loading={saving}
      >
        Save
      </Button>
    </div>
  );
}
