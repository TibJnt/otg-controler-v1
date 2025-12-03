'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button, Select } from '@/src/components/ui';
import { CoordinateForm } from './CoordinateForm';
import { getDevices, getDeviceScreenshot, updateDeviceCoordsFromPixels } from '@/src/lib/api/devices';
import { Device } from '@/src/lib/api/types';

type ActionType = 'like' | 'comment' | 'save' | 'commentSendButton' | 'commentInputField' | 'commentBackButton';

const ACTION_OPTIONS = [
  { value: 'like', label: 'Like Button' },
  { value: 'comment', label: 'Comment Button' },
  { value: 'save', label: 'Save Button' },
  { value: 'commentSendButton', label: 'Send Comment Button' },
  { value: 'commentInputField', label: 'Comment Input Field' },
  { value: 'commentBackButton', label: 'Comment Back Button (to close)' },
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
      console.log('[CALIBRATOR] ========== LOADING DEVICES ==========');
      const response = await getDevices();
      console.log('[CALIBRATOR] Raw API response:', response);
      console.log('[CALIBRATOR] Number of devices:', response.devices?.length);
      response.devices?.forEach((d, i) => {
        console.log(`[CALIBRATOR] Device ${i}:`, {
          id: d.idImouse,
          label: d.label,
          width: d.width,
          height: d.height,
          screenWidth: d.screenWidth,
          screenHeight: d.screenHeight,
          hasScreenDimensions: !!(d.screenWidth && d.screenHeight),
        });
      });
      setDevices(response.devices);
      if (response.devices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(response.devices[0].idImouse);
      }
    } catch (err) {
      console.error('[CALIBRATOR] Error loading devices:', err);
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

    setError(null);

    if (!selectedDevice.screenWidth || !selectedDevice.screenHeight) {
      setError('Screen dimensions not loaded. Please refresh devices and try again.');
      console.warn('[CALIBRATION] Missing screen dimensions on selected device, aborting click.');
      return;
    }

    const rect = imageRef.current.getBoundingClientRect();
    const targetWidth = imageRef.current.naturalWidth;
    const targetHeight = imageRef.current.naturalHeight;

    if (!targetWidth || !targetHeight) {
      setError('Unable to read screenshot dimensions. Please retake the screenshot.');
      return;
    }

    const scaleX = targetWidth / rect.width;
    const scaleY = targetHeight / rect.height;

    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);

    console.log(`[CALIBRATION] Click detected:`);
    console.log(`[CALIBRATION]   Image display size: ${rect.width}x${rect.height}`);
    console.log(`[CALIBRATION]   Using image natural size: ${targetWidth}x${targetHeight}`);
    console.log(`[CALIBRATION]   Device logical: ${selectedDevice.width}x${selectedDevice.height}`);
    console.log(`[CALIBRATION]   Device screen: ${selectedDevice.screenWidth}x${selectedDevice.screenHeight}`);
    console.log(`[CALIBRATION]   Using target: ${targetWidth}x${targetHeight}`);
    console.log(`[CALIBRATION]   Scale: ${scaleX}x${scaleY}`);
    console.log(`[CALIBRATION]   Calculated coords: (${x}, ${y})`);

    setClickCoords({ x, y });
  };

  const handleSaveClickCoords = async () => {
    if (!selectedDeviceId || !clickCoords) return;

    console.log('[CALIBRATOR] ========== SAVING COORDINATES ==========');
    console.log('[CALIBRATOR] Device ID:', selectedDeviceId);
    console.log('[CALIBRATOR] Action:', selectedAction);
    console.log('[CALIBRATOR] Pixel coords to save:', clickCoords);
    console.log('[CALIBRATOR] Selected device state:', selectedDevice);
    console.log('[CALIBRATOR] Image natural dimensions:', {
      width: imageRef.current?.naturalWidth,
      height: imageRef.current?.naturalHeight,
    });

    try {
      setError(null);
      console.log('[CALIBRATOR] Calling updateDeviceCoordsFromPixels...');
      await updateDeviceCoordsFromPixels(selectedDeviceId, selectedAction, clickCoords.x, clickCoords.y);
      console.log('[CALIBRATOR] Save successful, refreshing devices...');
      // Refresh devices to show updated coords
      await loadDevices();
      setClickCoords(null);
    } catch (err) {
      console.error('[CALIBRATOR] Error saving coordinates:', err);
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
                left: `${(clickCoords.x / (imageRef.current?.naturalWidth || selectedDevice.screenWidth || selectedDevice.width)) * 100}%`,
                top: `${(clickCoords.y / (imageRef.current?.naturalHeight || selectedDevice.screenHeight || selectedDevice.height)) * 100 + 28}px`, // Account for header
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
            deviceWidth={imageRef.current?.naturalWidth || selectedDevice.screenWidth || selectedDevice.width}
            deviceHeight={imageRef.current?.naturalHeight || selectedDevice.screenHeight || selectedDevice.height}
            onSave={handleManualSave}
          />
        </div>
      )}

      {selectedDevice && (
        <div className="pt-4 border-t border-card-border">
          <h3 className="text-sm font-medium mb-2">Current Coordinates (Screen: {selectedDevice.screenWidth || selectedDevice.width}x{selectedDevice.screenHeight || selectedDevice.height})</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {ACTION_OPTIONS.map((action) => {
              const coords = selectedDevice.coords[action.value as ActionType];
              const w = selectedDevice.screenWidth || selectedDevice.width;
              const h = selectedDevice.screenHeight || selectedDevice.height;
              return (
                <div key={action.value} className="flex justify-between">
                  <span className="text-muted">{action.label}:</span>
                  <span>
                    {coords
                      ? `(${Math.round(coords.xNorm * w)}, ${Math.round(coords.yNorm * h)})`
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
