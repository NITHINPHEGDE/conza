// src/utils/batteryOptimization.js
import { NativeModules, Platform, Linking, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ASKED_KEY = 'battery_optimization_asked';

// Opens the battery optimization settings for this app directly
const openBatterySettings = () => {
  if (Platform.OS !== 'android') return;

  // Try direct intent first (works on most Android)
  Linking.sendIntent('android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS', [
    { key: 'android.provider.extra.APP_PACKAGE', value: 'com.conza.businesspartner' },
  ]).catch(() => {
    // Fallback: open general battery optimization list
    Linking.sendIntent('android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS').catch(() => {
      // Last resort: open app settings
      Linking.openSettings();
    });
  });
};

export const requestBatteryOptimizationExemption = async () => {
  if (Platform.OS !== 'android') return;

  // Only ask once
  const alreadyAsked = await AsyncStorage.getItem(ASKED_KEY);
  if (alreadyAsked) return;

  await AsyncStorage.setItem(ASKED_KEY, 'true');

  Alert.alert(
    '⚡ Allow Background Alerts',
    'To ring when a new job comes in — even when the app is closed — please tap "Allow" on the next screen and select "Unrestricted" or "Don\'t optimize".\n\nThis is required to never miss a job.',
    [
      {
        text: 'Not Now',
        style: 'cancel',
      },
      {
        text: 'Allow →',
        onPress: openBatterySettings,
      },
    ],
    { cancelable: false }
  );
};

// Call this on every launch to re-prompt if they skipped before
export const recheckBatteryOptimization = async () => {
  if (Platform.OS !== 'android') return;

  const alreadyAsked = await AsyncStorage.getItem(ASKED_KEY);

  // Re-ask after 3 days if they previously said "Not Now"
  const lastAskedRaw = await AsyncStorage.getItem('battery_asked_at');
  if (alreadyAsked && lastAskedRaw) {
    const lastAsked = parseInt(lastAskedRaw, 10);
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    if (Date.now() - lastAsked < threeDays) return;
  }

  await AsyncStorage.setItem('battery_asked_at', String(Date.now()));

  Alert.alert(
    '⚡ Allow Background Alerts',
    'To ring when a new job comes in — even when the app is closed — please tap "Allow" on the next screen and select "Unrestricted" or "Don\'t optimize".\n\nThis is required to never miss a job.',
    [
      {
        text: 'Not Now',
        style: 'cancel',
      },
      {
        text: 'Allow →',
        onPress: openBatterySettings,
      },
    ],
    { cancelable: false }
  );
};