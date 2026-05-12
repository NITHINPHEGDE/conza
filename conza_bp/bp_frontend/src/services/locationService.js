import { Alert, Linking, Platform } from 'react-native';
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

  const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
  
  let finalStatus = status;
  if (status !== 'granted' && canAskAgain) {
    const { status: askStatus } = await Location.requestForegroundPermissionsAsync();
    finalStatus = askStatus;
  }

  if (finalStatus !== 'granted') {
    Alert.alert(
      'Location Required',
      'Please enable location permissions in settings to receive job requests nearby.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Platform.OS === 'ios' ? Linking.openURL('app-settings:') : Linking.openSettings() }
      ]
    );
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
