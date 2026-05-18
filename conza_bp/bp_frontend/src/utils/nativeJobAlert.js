// src/utils/nativeJobAlert.js
import { NativeModules, Platform } from 'react-native';

const { JobAlertModule } = NativeModules;

export const startNativeAlert = (request) => {
  if (Platform.OS !== 'android' || !JobAlertModule) {
    console.warn('[NativeAlert] JobAlertModule not available');
    return;
  }
  JobAlertModule.startAlert(
    '🔧 New Job Request!',
    `${request.userName || 'Client'} needs ${request.service || 'service'} — ₹${request.estimatedAmount || 0}`,
    String(request.id || request._id || '')
  );
};

export const stopNativeAlert = () => {
  if (Platform.OS !== 'android' || !JobAlertModule) return;
  JobAlertModule.stopAlert();
};