// src/services/locationService.js
import * as Location from 'expo-location';
import { updateLocationAPI } from './workerService';

let _intervalId = null;

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

export const startLocationTracking = async () => {
  if (_intervalId) return;  // already running

  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    console.warn('[LocationService] Permission denied');
    return;
  }

  // Send immediately, then every 12 seconds
  await sendLocation();
  _intervalId = setInterval(sendLocation, 12000);
  console.log('[LocationService] Started');
};

export const stopLocationTracking = () => {
  if (_intervalId) {
    clearInterval(_intervalId);
    _intervalId = null;
    console.log('[LocationService] Stopped');
  }
};
