'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/src/components/ui';
import { getDevices, refreshDevices } from '@/src/lib/api/devices';
import { Device } from '@/src/lib/api/types';

interface DeviceSelectorProps {
  selectedDeviceIds: string[];
  onSelectionChange: (deviceIds: string[]) => void;
}

export function DeviceSelector({ selectedDeviceIds, onSelectionChange }: DeviceSelectorProps) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDevices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getDevices();
      setDevices(response.devices);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load devices');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const response = await refreshDevices();
      setDevices(response.devices);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh devices');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCheckboxChange = (deviceId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedDeviceIds, deviceId]);
    } else {
      onSelectionChange(selectedDeviceIds.filter((id) => id !== deviceId));
    }
  };

  const handleSelectAll = () => {
    onSelectionChange(devices.map((d) => d.idImouse));
  };

  const handleDeselectAll = () => {
    onSelectionChange([]);
  };

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-6 w-6 border-2 border-pale-slate-dark border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-foreground-secondary">
            {devices.length} device{devices.length !== 1 ? 's' : ''}
          </span>
          {selectedDeviceIds.length > 0 && (
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-platinum text-carbon-black">
              {selectedDeviceIds.length} selected
            </span>
          )}
        </div>
        <Button variant="secondary" size="sm" onClick={handleRefresh} loading={refreshing}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 p-3 glass-alert glass-alert-danger rounded-lg text-sm text-danger">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Empty State */}
      {devices.length === 0 ? (
        <div className="py-10 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-background-subtle flex items-center justify-center">
            <svg className="w-6 h-6 text-foreground-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-foreground-secondary font-medium">No devices found</p>
          <p className="text-sm text-foreground-muted mt-1">Click "Refresh" to scan for connected iPhones</p>
        </div>
      ) : (
        <>
          {/* Quick Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleSelectAll}
              className="text-xs text-pale-slate-dark hover:text-pale-slate transition-colors"
            >
              Select all
            </button>
            <span className="text-foreground-subtle">·</span>
            <button
              onClick={handleDeselectAll}
              className="text-xs text-foreground-muted hover:text-foreground-secondary transition-colors"
            >
              Deselect all
            </button>
          </div>

          {/* Device List */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {devices.map((device, index) => {
              const isSelected = selectedDeviceIds.includes(device.idImouse);
              const hasLike = device.coords.tiktok?.like || device.coords.instagram?.like;
              const hasComment = device.coords.tiktok?.comment || device.coords.instagram?.comment;
              const hasSave = device.coords.tiktok?.save || device.coords.instagram?.share;

              return (
                <div
                  key={device.idImouse}
                  onClick={() => handleCheckboxChange(device.idImouse, !isSelected)}
                  className={`
                    group flex items-center justify-between p-3 rounded-lg cursor-pointer
                    transition-all duration-200
                    ${isSelected
                      ? 'glass border border-pale-slate-dark shadow-md'
                      : 'glass-item'
                    }
                  `}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-3">
                    {/* Connection LED */}
                    <div className={`led ${isSelected ? 'led-success animate-pulse' : 'led-muted'}`} />

                    {/* Device Info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${isSelected ? 'text-foreground' : 'text-foreground-secondary'}`}>
                          {device.label}
                        </span>
                      </div>
                      <span className="text-xs text-foreground-muted">
                        {device.width}×{device.height}
                      </span>
                    </div>
                  </div>

                  {/* Calibration Status */}
                  <div className="flex items-center gap-2">
                    {hasLike && (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-iron-grey text-platinum">
                        Like
                      </span>
                    )}
                    {hasComment && (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-iron-grey text-pale-slate">
                        Comment
                      </span>
                    )}
                    {hasSave && (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-iron-grey text-alabaster-grey">
                        Save
                      </span>
                    )}

                    {/* Checkbox Indicator - Bright when selected */}
                    <div className={`
                      w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200
                      ${isSelected
                        ? 'bg-bright-snow border-bright-snow shadow-[0_0_8px_rgba(248,249,250,0.4)]'
                        : 'border-slate-grey group-hover:border-pale-slate-dark'
                      }
                    `}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-carbon-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
