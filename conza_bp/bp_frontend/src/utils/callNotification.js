import notifee, {
  AndroidImportance,
  AndroidVisibility,
  AndroidCategory,
  EventType,
} from '@notifee/react-native';

// ── Create high-priority channel for job alerts ───────────────────────────
export const setupCallChannel = async () => {
  await notifee.createChannel({
    id:         'job-alert',
    name:       'Job Alerts',
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    sound:      'alert',
    vibration:  true,
    vibrationPattern: [300, 500],
  });
};

// ── Show full-screen incoming job notification ────────────────────────────
export const showIncomingJobAlert = async (request) => {
  await notifee.displayNotification({
    title: '🔧 New Job Request!',
    body:  `${request.userName || 'Client'} needs ${request.service || 'service'} — ₹${request.estimatedAmount || 0}`,
    data:  { requestId: String(request.id || request._id), type: 'new_request' },
    android: {
      channelId:   'job-alert',
      importance:  AndroidImportance.HIGH,
      visibility:  AndroidVisibility.PUBLIC,
      category:    AndroidCategory.CALL,
      sound:       'alert',
      loopSound:   true,
      fullScreenAction: {
        id: 'default',
      },
      pressAction: {
        id:           'default',
        launchActivity: 'default',
      },
      actions: [
        {
          title:         '✅ Accept',
          pressAction: { id: 'accept' },
        },
        {
          title:         '❌ Decline',
          pressAction: { id: 'decline' },
        },
      ],
    },
  });
};

// ── Cancel the job alert notification ────────────────────────────────────
export const cancelJobAlert = async () => {
  await notifee.cancelAllNotifications();
};

// ── Handle background notification events ────────────────────────────────
export const registerBackgroundNotificationHandler = () => {
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    const { notification, pressAction } = detail;

    if (type === EventType.ACTION_PRESS && pressAction.id === 'accept') {
      console.log('[Notifee] Worker accepted job:', notification.data?.requestId);
      await notifee.cancelNotification(notification.id);
      // Store accepted job ID so app can handle it when it opens
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('pending_accept_id', notification.data?.requestId);
    }

    if (type === EventType.ACTION_PRESS && pressAction.id === 'decline') {
      console.log('[Notifee] Worker declined job:', notification.data?.requestId);
      await notifee.cancelNotification(notification.id);
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('pending_decline_id', notification.data?.requestId);
    }
  });
};
