# Bug Report: Coordinate Mismatch Between Calibration and Automation

## Summary
Clicks during automation land in the wrong location (e.g., "+" button or volume buttons instead of the Like heart). The root cause is a mismatch between the coordinate space used during calibration vs. execution.

---

## Environment
- **Device**: iPhone SE 2
- **iMouseXP dimensions**:
  - Logical (CSS points): `375x667`
  - Screen (actual touch coordinates): `608x1080`
- **App**: OTG Controller v1 (Next.js)

---

## The Problem

### Two Different Coordinate Spaces

iMouseXP reports two sets of dimensions for each device:

| Field | Value | Purpose |
|-------|-------|---------|
| `width` / `height` | 375 x 667 | Logical iOS points (CSS) |
| `imgw` / `imgh` | 608 x 1080 | Actual screen/touch coordinates |

**The click coordinates sent to iMouseXP must be in the 608x1080 space.**

### What Happens Currently

#### During Calibration (CoordinateCalibrator.tsx)
```
[CALIBRATION]   Image display size: 611.33x1085.91
[CALIBRATION]   Device logical: 375x667
[CALIBRATION]   Device screen: undefinedxundefined   ← BUG: screenWidth/Height not loaded
[CALIBRATION]   Using target: 375x667                ← WRONG: should be 608x1080
[CALIBRATION]   Calculated coords: (341, 276)
```

The calibrator:
1. Doesn't receive `screenWidth`/`screenHeight` (they're `undefined`)
2. Falls back to `width`/`height` (375x667)
3. Calculates normalized coords based on 375x667
4. Stores: `xNorm = 341/375 = 0.909`, `yNorm = 276/667 = 0.414`

#### During Automation (actions.ts)
```
[LIKE ACTION DEBUG] Device logical: 375x667
[LIKE ACTION DEBUG] Device screen: 608x1080
[LIKE ACTION DEBUG] Using for click: 608x1080
[LIKE ACTION DEBUG] Stored normalized coords: xNorm=0.909, yNorm=0.414
[LIKE ACTION DEBUG] Calculated absolute coords: x=553, y=447  ← WRONG POSITION
```

The automation:
1. Has `screenWidth`/`screenHeight` correctly (608x1080)
2. Denormalizes using 608x1080
3. Calculates: `x = 0.909 * 608 = 553`, `y = 0.414 * 1080 = 447`

### The Math Problem

| Step | Calibration | Automation |
|------|-------------|------------|
| Click position | (341, 276) on image | — |
| Reference space | 375 x 667 | 608 x 1080 |
| Normalized | xNorm=0.909, yNorm=0.414 | — |
| Denormalized | — | x=553, y=447 |

**Result**: The click goes to (553, 447) instead of the intended position.

---

## Root Cause

The `CoordinateCalibrator` component receives `selectedDevice` but `selectedDevice.screenWidth` and `selectedDevice.screenHeight` are `undefined`.

### Code Location
**File**: `src/components/CoordinateCalibrator.tsx`

```typescript
const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
  // ...
  const targetWidth = selectedDevice.screenWidth || selectedDevice.width;   // Falls back to 375
  const targetHeight = selectedDevice.screenHeight || selectedDevice.height; // Falls back to 667
  // ...
};
```

### Why `screenWidth`/`screenHeight` are undefined

Despite the backend storing these values correctly in `devices.json`:
```json
{
  "screenWidth": 608,
  "screenHeight": 1080
}
```

And the API returning them:
```json
{
  "screenWidth": 608,
  "screenHeight": 1080
}
```

The frontend component doesn't receive them. Possible causes:
1. **Browser cache** - Old device data cached without screenWidth/screenHeight
2. **React state not updating** - The devices state in the component is stale
3. **Data not propagating** - The parent component passes device data without screenWidth/screenHeight

---

## Required Fix

### Option A: Force fresh data in CoordinateCalibrator

Ensure `loadDevices()` in the component fetches fresh data and the state updates:

```typescript
// In CoordinateCalibrator.tsx
const loadDevices = useCallback(async () => {
  try {
    setLoading(true);
    const response = await getDevices();
    console.log('[DEBUG] Loaded devices:', JSON.stringify(response.devices, null, 2));
    setDevices(response.devices);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to load devices');
  } finally {
    setLoading(false);
  }
}, []);
```

### Option B: Validate screenWidth/screenHeight exist before calibration

```typescript
const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
  if (!selectedDevice.screenWidth || !selectedDevice.screenHeight) {
    setError('Screen dimensions not loaded. Please refresh devices.');
    return;
  }
  // ... rest of the code
};
```

### Option C: Always use image natural dimensions

Since the screenshot comes directly from iMouseXP at the correct resolution:

```typescript
const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
  if (!imageRef.current) return;
  
  // Use the actual image dimensions (which match iMouseXP's imgw/imgh)
  const targetWidth = imageRef.current.naturalWidth;
  const targetHeight = imageRef.current.naturalHeight;
  
  const rect = imageRef.current.getBoundingClientRect();
  const scaleX = targetWidth / rect.width;
  const scaleY = targetHeight / rect.height;
  
  const x = Math.round((e.clientX - rect.left) * scaleX);
  const y = Math.round((e.clientY - rect.top) * scaleY);
  
  console.log(`[CALIBRATION] Using image natural size: ${targetWidth}x${targetHeight}`);
  setClickCoords({ x, y });
};
```

**This is the most reliable fix** because it uses the actual screenshot dimensions directly.

---

## Files to Modify

1. **`src/components/CoordinateCalibrator.tsx`**
   - Use `imageRef.current.naturalWidth` / `naturalHeight` instead of device dimensions
   - Add validation that screenWidth/screenHeight exist

2. **`src/lib/services/devices.ts`**
   - Ensure `setCoordsFromPixels()` uses consistent dimensions

3. **`src/lib/automation/actions.ts`**
   - Already correct (uses screenWidth/screenHeight)

---

## Test Plan

1. Apply the fix
2. Hard refresh browser (`Ctrl+Shift+R`)
3. Click "Refresh Devices"
4. Take new screenshot
5. Verify console shows:
   ```
   [CALIBRATION] Using image natural size: 608x1080
   ```
6. Click on Like button in screenshot
7. Save coordinates
8. Run automation
9. Verify the click lands on the heart button

---

## Current Status

- [x] Backend stores screenWidth/screenHeight correctly
- [x] API returns screenWidth/screenHeight correctly
- [ ] Frontend CoordinateCalibrator receives screenWidth/screenHeight
- [ ] Calibration uses correct coordinate space (608x1080)
- [ ] Clicks land on correct position

