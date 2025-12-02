'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Checkbox } from '@/src/components/ui';
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
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">
          All Devices ({devices.length}) - {selectedDeviceIds.length} selected
        </span>
        <Button variant="secondary" size="sm" onClick={handleRefresh} loading={refreshing}>
          Refresh Devices
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-danger/10 border border-danger/20 rounded-md text-sm text-danger">
          {error}
        </div>
      )}

      {devices.length === 0 ? (
        <div className="py-8 text-center text-muted">
          <p>No devices found.</p>
          <p className="text-sm mt-1">Click "Refresh Devices" to scan for connected iPhones.</p>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleSelectAll}>
              Select All
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDeselectAll}>
              Deselect All
            </Button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {devices.map((device) => (
              <div
                key={device.idImouse}
                className="flex items-center justify-between p-3 rounded-md border border-card-border hover:bg-background transition-colors"
              >
                <Checkbox
                  label={device.label}
                  checked={selectedDeviceIds.includes(device.idImouse)}
                  onChange={(e) => handleCheckboxChange(device.idImouse, e.target.checked)}
                />
                <div className="flex items-center gap-3 text-xs text-muted">
                  <span>{device.width}x{device.height}</span>
                  {device.coords.like && (
                    <span className="text-success" title="Like coordinates configured">
                      Like
                    </span>
                  )}
                  {device.coords.comment && (
                    <span className="text-success" title="Comment coordinates configured">
                      Comment
                    </span>
                  )}
                  {device.coords.save && (
                    <span className="text-success" title="Save coordinates configured">
                      Save
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
