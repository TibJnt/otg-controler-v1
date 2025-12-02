'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button, Select } from '@/src/components/ui';
import { CoordinateForm } from './CoordinateForm';
import { getDevices, getDeviceScreenshot, updateDeviceCoordsFromPixels } from '@/src/lib/api/devices';
import { Device } from '@/src/lib/api/types';

type ActionType = 'like' | 'comment' | 'save' | 'commentSendButton' | 'commentInputField';

const ACTION_OPTIONS = [
  { value: 'like', label: 'Like Button' },
  { value: 'comment', label: 'Comment Button' },
  { value: 'save', label: 'Save Button' },
  { value: 'commentSendButton', label: 'Send Comment Button' },
  { value: 'commentInputField', label: 'Comment Input Field' },
];

export function CoordinateCalibrator() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<ActionType>('like');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingScreenshot, setLoadingScreenshot] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clickCoords, setClickCoords] = useState<{ x: number; y: number } | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const selectedDevice = devices.find((d) => d.idImouse === selectedDeviceId);

  const loadDevices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getDevices();
      setDevices(response.devices);
      if (response.devices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(response.devices[0].idImouse);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load devices');
    } finally {
      setLoading(false);
    }
  }, [selectedDeviceId]);

  const handleCaptureScreenshot = async () => {
    if (!selectedDeviceId) return;

    try {
      setLoadingScreenshot(true);
      setError(null);
      setClickCoords(null);
      const response = await getDeviceScreenshot(selectedDeviceId);
      if (response.dataUrl) {
        setScreenshot(response.dataUrl);
      } else {
        setError('No screenshot data received');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to capture screenshot');
    } finally {
      setLoadingScreenshot(false);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imageRef.current || !selectedDevice) return;

    const rect = imageRef.current.getBoundingClientRect();
    const scaleX = selectedDevice.width / rect.width;
    const scaleY = selectedDevice.height / rect.height;

    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);

    setClickCoords({ x, y });
  };

  const handleSaveClickCoords = async () => {
    if (!selectedDeviceId || !clickCoords) return;

    try {
      setError(null);
      await updateDeviceCoordsFromPixels(selectedDeviceId, selectedAction, clickCoords.x, clickCoords.y);
      // Refresh devices to show updated coords
      await loadDevices();
      setClickCoords(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save coordinates');
    }
  };

  const handleManualSave = async (coords: { x: number; y: number }) => {
    if (!selectedDeviceId) return;

    try {
      setError(null);
      await updateDeviceCoordsFromPixels(selectedDeviceId, selectedAction, coords.x, coords.y);
      await loadDevices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save coordinates');
    }
  };

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="py-8 text-center text-muted">
        <p>No devices available for calibration.</p>
        <p className="text-sm mt-1">Add devices first using the "Select Devices" panel.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-danger/10 border border-danger/20 rounded-md text-sm text-danger">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Device"
          options={devices.map((d) => ({ value: d.idImouse, label: d.label }))}
          value={selectedDeviceId}
          onChange={(e) => {
            setSelectedDeviceId(e.target.value);
            setScreenshot(null);
            setClickCoords(null);
          }}
        />
        <Select
          label="Action to Calibrate"
          options={ACTION_OPTIONS}
          value={selectedAction}
          onChange={(e) => {
            setSelectedAction(e.target.value as ActionType);
            setClickCoords(null);
          }}
        />
      </div>

      <div className="flex gap-2">
        <Button
          variant="secondary"
          onClick={handleCaptureScreenshot}
          loading={loadingScreenshot}
          disabled={!selectedDeviceId}
        >
          Capture Screenshot
        </Button>
        {clickCoords && (
          <Button variant="primary" onClick={handleSaveClickCoords}>
            Save Clicked Position ({clickCoords.x}, {clickCoords.y})
          </Button>
        )}
      </div>

      {screenshot && (
        <div className="relative border border-card-border rounded-md overflow-hidden">
          <p className="text-xs text-muted p-2 bg-background">
            Click on the {ACTION_OPTIONS.find((a) => a.value === selectedAction)?.label} position
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imageRef}
            src={screenshot}
            alt="Device screenshot"
            className="w-full cursor-crosshair"
            onClick={handleImageClick}
          />
          {clickCoords && selectedDevice && (
            <div
              className="absolute w-4 h-4 bg-primary rounded-full border-2 border-white transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                left: `${(clickCoords.x / selectedDevice.width) * 100}%`,
                top: `${(clickCoords.y / selectedDevice.height) * 100 + 28}px`, // Account for header
              }}
            />
          )}
        </div>
      )}

      {selectedDevice && (
        <div className="pt-4 border-t border-card-border">
          <h3 className="text-sm font-medium mb-3">Manual Coordinate Entry</h3>
          <CoordinateForm
            action={selectedAction}
            currentCoords={selectedDevice.coords[selectedAction]}
            deviceWidth={selectedDevice.width}
            deviceHeight={selectedDevice.height}
            onSave={handleManualSave}
          />
        </div>
      )}

      {selectedDevice && (
        <div className="pt-4 border-t border-card-border">
          <h3 className="text-sm font-medium mb-2">Current Coordinates</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {ACTION_OPTIONS.map((action) => {
              const coords = selectedDevice.coords[action.value as ActionType];
              return (
                <div key={action.value} className="flex justify-between">
                  <span className="text-muted">{action.label}:</span>
                  <span>
                    {coords
                      ? `(${Math.round(coords.xNorm * selectedDevice.width)}, ${Math.round(coords.yNorm * selectedDevice.height)})`
                      : 'Not set'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
