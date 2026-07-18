// src/services/locationService.js
import { Alert, Linking, Platform } from 'react-native';
import * as Location from 'expo-location';
import { updateLocationAPI } from './workerService';

// ── Intervals ──────────────────────────────────────────────────────────────
export const TRACKING_MODE = {
  IDLE:    'idle',    // waiting for a job   → ping every 5 min
  ACTIVE:  'active',  // en-route / on-job   → ping every 25 sec
};

const INTERVAL_MS = {
  [TRACKING_MODE.IDLE]:   60 * 1000,  // 60 000 ms — 1 min
  [TRACKING_MODE.ACTIVE]: 25 * 1000,  //  25 000 ms
};

// ── Module state ───────────────────────────────────────────────────────────
let _intervalId   = null;
let _currentMode  = null;

// ── Core send ──────────────────────────────────────────────────────────────
const sendLocation = async () => {
  try {
    const { coords } = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    await updateLocationAPI(coords.latitude, coords.longitude);
  } catch (err) {
    console.warn('[LocationService] Failed to send location:', err.message);
  }
};

// ── Permission helper (called once on first start) ─────────────────────────
const ensurePermission = async () => {
  const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
  if (status === 'granted') return true;

  if (canAskAgain) {
    const { status: asked } = await Location.requestForegroundPermissionsAsync();
    if (asked === 'granted') return true;
  }

  Alert.alert(
    'Location Required',
    'Please enable location permissions in settings to receive job requests nearby.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Open Settings',
        onPress: () =>
          Platform.OS === 'ios'
            ? Linking.openURL('app-settings:')
            : Linking.openSettings(),
      },
    ]
  );
  return false;
};

// ── Internal: (re)schedule the interval for a given mode ──────────────────
const _schedule = (mode) => {
  if (_intervalId) {
    clearInterval(_intervalId);
    _intervalId = null;
  }
  _currentMode = mode;
  _intervalId  = setInterval(sendLocation, INTERVAL_MS[mode]);
  console.log(`[LocationService] Mode → ${mode} (every ${INTERVAL_MS[mode] / 1000}s)`);
};

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * startLocationTracking
 * Called when worker goes online. Starts in IDLE mode.
 * Permission check is done here so callers don't need to worry about it.
 */
export const startLocationTracking = async () => {
  if (_intervalId) return; // already running

  const granted = await ensurePermission();
  if (!granted) return;

  // Send one ping immediately, then begin idle polling
  await sendLocation();
  _schedule(TRACKING_MODE.IDLE);
  console.log('[LocationService] Started in IDLE mode');
};

/**
 * setTrackingMode
 * Switch between IDLE and ACTIVE without restarting.
 * Safe to call even if tracking is not running (no-op).
 */
export const setTrackingMode = (mode) => {
  if (!_intervalId) return;          // not tracking, nothing to switch
  if (_currentMode === mode) return;  // already in this mode, no-op

  // Send one immediate ping on upgrade to ACTIVE so the customer
  // sees the worker move right away without waiting 25 sec.
  if (mode === TRACKING_MODE.ACTIVE) {
    sendLocation();
  }

  _schedule(mode);
};

/**
 * stopLocationTracking
 * Called when worker goes offline.
 */
export const stopLocationTracking = () => {
  if (_intervalId) {
    clearInterval(_intervalId);
    _intervalId  = null;
    _currentMode = null;
    console.log('[LocationService] Stopped');
  }
};

/**
 * getCurrentMode — utility for debugging/display
 */
export const getCurrentTrackingMode = () => _currentMode;

// ── Geo helpers ──────────────────────────────────────────────────────────────

/**
 * getDistanceInMeters
 * Haversine formula — straight-line distance between two lat/lng points, in meters.
 */
export const getDistanceInMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * getCurrentCoords
 * Fetches a fresh, high-accuracy GPS fix for one-off checks (e.g. "Mark as Arrived").
 * Returns null if permission isn't granted.
 */
export const getCurrentCoords = async () => {
  const granted = await ensurePermission();
  if (!granted) return null;
  const { coords } = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
  return { latitude: coords.latitude, longitude: coords.longitude };
};