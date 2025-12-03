'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button, Select } from '@/src/components/ui';
import { CoordinateForm } from './CoordinateForm';
import { getDevices, getDeviceScreenshot, updateDeviceCoordsFromPixels } from '@/src/lib/api/devices';
import { Device, Platform, TikTokCoords, InstagramCoords, NormalizedCoords } from '@/src/lib/api/types';

type TikTokActionType = 'like' | 'comment' | 'save' | 'commentInputField' | 'commentSendButton' | 'commentBackButton';
type InstagramActionType = 'like' | 'comment' | 'share' | 'commentInputField' | 'commentSendButton' | 'commentCloseButton';
type ActionType = TikTokActionType | InstagramActionType;

const TIKTOK_ACTION_OPTIONS = [
  { value: 'like', label: 'Like Button' },
  { value: 'comment', label: 'Comment Button' },
  { value: 'save', label: 'Save Button' },
  { value: 'commentInputField', label: 'Comment Input Field' },
  { value: 'commentSendButton', label: 'Send Comment Button' },
  { value: 'commentBackButton', label: 'Comment Back Button' },
];

const INSTAGRAM_ACTION_OPTIONS = [
  { value: 'like', label: 'Like Button' },
  { value: 'comment', label: 'Comment Button' },
  { value: 'share', label: 'Share Button' },
  { value: 'commentInputField', label: 'Comment Input Field' },
  { value: 'commentSendButton', label: 'Send Comment Button' },
  { value: 'commentCloseButton', label: 'Comment Close Button' },
];

interface CoordinateCalibratorProps {
  platform: Platform;
}

type TabType = 'capture' | 'manual' | 'reference';

export function CoordinateCalibrator({ platform }: CoordinateCalibratorProps) {
  const ACTION_OPTIONS = platform === 'tiktok' ? TIKTOK_ACTION_OPTIONS : INSTAGRAM_ACTION_OPTIONS;
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<ActionType>('like');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingScreenshot, setLoadingScreenshot] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clickCoords, setClickCoords] = useState<{ x: number; y: number } | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('capture');
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
    setError(null);
    if (!selectedDevice.screenWidth || !selectedDevice.screenHeight) {
      setError('Screen dimensions not loaded. Please refresh devices.');
      return;
    }
    const rect = imageRef.current.getBoundingClientRect();
    const targetWidth = imageRef.current.naturalWidth;
    const targetHeight = imageRef.current.naturalHeight;
    if (!targetWidth || !targetHeight) {
      setError('Unable to read screenshot dimensions.');
      return;
    }
    const scaleX = targetWidth / rect.width;
    const scaleY = targetHeight / rect.height;
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);
    setClickCoords({ x, y });
  };

  const handleSaveClickCoords = async () => {
    if (!selectedDeviceId || !clickCoords) return;
    try {
      setError(null);
      await updateDeviceCoordsFromPixels(selectedDeviceId, platform, selectedAction, clickCoords.x, clickCoords.y);
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
      await updateDeviceCoordsFromPixels(selectedDeviceId, platform, selectedAction, coords.x, coords.y);
      await loadDevices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save coordinates');
    }
  };

  const getPlatformCoords = (device: Device): TikTokCoords | InstagramCoords | undefined => device.coords[platform];
  const getActionCoords = (device: Device, action: string): NormalizedCoords | undefined => {
    const platformCoords = getPlatformCoords(device);
    if (!platformCoords) return undefined;
    return (platformCoords as Record<string, NormalizedCoords | undefined>)[action];
  };

  useEffect(() => { loadDevices(); }, [loadDevices]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-6 w-6 border-2 border-pale-slate-dark border-t-transparent rounded-full" />
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="py-10 text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-background-subtle flex items-center justify-center">
          <svg className="w-6 h-6 text-foreground-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
        </div>
        <p className="text-foreground-secondary font-medium">No devices available</p>
        <p className="text-sm text-foreground-muted mt-1">Add devices using "Select Devices" panel</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-center gap-2 p-3 glass-alert glass-alert-danger rounded-lg text-sm text-danger">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Device"
          options={devices.map((d) => ({ value: d.idImouse, label: d.label }))}
          value={selectedDeviceId}
          onChange={(e) => { setSelectedDeviceId(e.target.value); setScreenshot(null); setClickCoords(null); }}
        />
        <Select
          label="Action to Calibrate"
          options={ACTION_OPTIONS}
          value={selectedAction}
          onChange={(e) => { setSelectedAction(e.target.value as ActionType); setClickCoords(null); }}
        />
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 p-1 rounded-lg glass-tabs">
        {(['capture', 'manual', 'reference'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all
              ${activeTab === tab
                ? 'glass text-foreground shadow-sm'
                : 'text-foreground-muted hover:text-foreground'
              }
            `}
          >
            {tab === 'capture' ? 'Capture' : tab === 'manual' ? 'Manual' : 'Reference'}
          </button>
        ))}
      </div>

      {/* Capture Tab */}
      {activeTab === 'capture' && (
        <>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleCaptureScreenshot} loading={loadingScreenshot} disabled={!selectedDeviceId}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Capture Screenshot
        </Button>
        {clickCoords && (
          <Button variant="primary" onClick={handleSaveClickCoords} glow>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Save ({clickCoords.x}, {clickCoords.y})
          </Button>
        )}
      </div>

      {screenshot && (
        <div className="relative rounded-xl border border-border overflow-hidden bg-background">
          <div className="px-3 py-2 border-b border-border bg-background-subtle">
            <p className="text-xs text-foreground-secondary">
              Click on the <span className="text-platinum font-medium">{ACTION_OPTIONS.find((a) => a.value === selectedAction)?.label}</span> position
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={imageRef} src={screenshot} alt="Device screenshot" className="w-full cursor-crosshair" onClick={handleImageClick} />
          {clickCoords && selectedDevice && (
            <div
              className="absolute w-6 h-6 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(173,181,189,1) 0%, rgba(173,181,189,0.6) 100%)',
                boxShadow: '0 0 12px rgba(173,181,189,0.6)',
                left: `${(clickCoords.x / (imageRef.current?.naturalWidth || selectedDevice.screenWidth || selectedDevice.width)) * 100}%`,
                top: `calc(${(clickCoords.y / (imageRef.current?.naturalHeight || selectedDevice.screenHeight || selectedDevice.height)) * 100}% + 36px)`,
              }}
            />
          )}
        </div>
      )}
        </>
      )}

      {/* Manual Tab */}
      {activeTab === 'manual' && selectedDevice && (
        <div>
          <CoordinateForm
            action={selectedAction}
            currentCoords={getActionCoords(selectedDevice, selectedAction)}
            deviceWidth={imageRef.current?.naturalWidth || selectedDevice.screenWidth || selectedDevice.width}
            deviceHeight={imageRef.current?.naturalHeight || selectedDevice.screenHeight || selectedDevice.height}
            onSave={handleManualSave}
          />
        </div>
      )}

      {/* Reference Tab */}
      {activeTab === 'reference' && selectedDevice && (
        <div>
          <h3 className="text-sm font-medium text-foreground-secondary mb-3">
            {platform === 'tiktok' ? 'TikTok' : 'Instagram'} Coordinates
            <span className="text-foreground-muted font-normal ml-2">
              ({selectedDevice.screenWidth || selectedDevice.width}×{selectedDevice.screenHeight || selectedDevice.height})
            </span>
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {ACTION_OPTIONS.map((action) => {
              const coords = getActionCoords(selectedDevice, action.value);
              const w = selectedDevice.screenWidth || selectedDevice.width;
              const h = selectedDevice.screenHeight || selectedDevice.height;
              return (
                <div key={action.value} className="flex justify-between text-sm py-1.5 px-2 rounded bg-background-subtle">
                  <span className="text-foreground-muted">{action.label}</span>
                  <span className={coords ? 'text-foreground font-mono' : 'text-foreground-subtle'}>
                    {coords ? `(${Math.round(coords.xNorm * w)}, ${Math.round(coords.yNorm * h)})` : '—'}
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
