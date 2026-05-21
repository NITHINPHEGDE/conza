// src/utils/notificationService.js
import * as Notifications from 'expo-notifications';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList:   true,
    shouldPlaySound:  true,
    shouldSetBadge:   true,
  }),
});

let player = null;

export const requestNotificationPermissions = async () => {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

export const registerPushToken = async () => {
  try {
    const granted = await requestNotificationPermissions();
    if (!granted) {
      console.warn('[Push] Notification permission not granted');
      return null;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      console.warn('[Push] No projectId found in app.json');
      return null;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log('[Push] ✅ Expo push token:', token);
    return token;
  } catch (err) {
    console.warn('[Push] Could not get push token:', err.message);
    return null;
  }
};

export const setupNotificationChannel = async () => {
  if (Platform.OS === 'android') {
    // Main job-requests channel
    await Notifications.setNotificationChannelAsync('job-requests', {
      name:             'Job Requests',
      importance:       Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound:            'alert.mp3',
      lightColor:       '#F0A500',
      bypassDnd:        true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });

    // Alias channel used by CS backend push payload (channelId: 'job-alert')
    await Notifications.setNotificationChannelAsync('job-alert', {
      name:             'Job Alert',
      importance:       Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound:            'alert.mp3',
      lightColor:       '#F0A500',
      bypassDnd:        true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
};

export const showJobNotification = async (request) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔧 New Job Request!',
      body:  `${request.userName} needs ${request.service} at ${request.location}. ₹${request.estimatedAmount}`,
      data:  { requestId: request.id, type: 'new_request' },
      sound: 'alert.mp3',
      ...(Platform.OS === 'android' && { channelId: 'job-requests' }),
    },
    trigger: null,
  });
};

export const scheduleJobNotification = async (request) => {
  const scheduledDate = new Date(request.scheduledDate || request.scheduledTime);
  const fireAt = new Date(scheduledDate.getTime() - 45 * 60 * 1000);
  if (fireAt <= new Date()) return null;

  return Notifications.scheduleNotificationAsync({
    content: {
      title: '⏰ Upcoming Job in 45 mins!',
      body:  `${request.userName} — ${request.service} at ${request.location}. ₹${request.estimatedAmount}`,
      data:  { requestId: request.id, type: 'scheduled' },
      sound: 'alert.mp3',
      ...(Platform.OS === 'android' && { channelId: 'job-requests' }),
    },
    trigger: { date: fireAt },
  });
};

export const startAlertSound = async () => {
  try {
    await stopAlertSound();

    await setAudioModeAsync({
      playsInSilentModeIOS:    true,
      staysActiveInBackground: false,
      shouldDuckAndroid:       false,
    });

    player = createAudioPlayer(require('../../assets/alert.mp3'));
    player.loop = true;
    player.play();
  } catch (err) {
    console.warn('[Alert] Could not play sound:', err.message);
  }
};

export const stopAlertSound = async () => {
  try {
    if (player) {
      player.pause();
      player.release();
      player = null;
    }
  } catch (err) {
    console.warn('[Alert] Could not stop sound:', err.message);
  }
};