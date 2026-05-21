// src/utils/backgroundTask.js
import * as TaskManager from 'expo-task-manager';
import * as BackgroundTask from 'expo-background-task';
import { startAlertSound, showJobNotification } from './notificationService';

export const BACKGROUND_FETCH_TASK = 'background-job-check';

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;

    const token = await AsyncStorage.getItem('conza_token');
    if (!token) return BackgroundTask.BackgroundTaskResult.Failed;

    const storedIds = await AsyncStorage.getItem('known_request_ids');
    const knownIds  = storedIds ? JSON.parse(storedIds) : [];

    const { BASE_URL } = require('../services/apiClient');
    const url = `${BASE_URL}/bookings/requests`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) return BackgroundTask.BackgroundTaskResult.Failed;

    const data = await response.json();
    if (!data.success) return BackgroundTask.BackgroundTaskResult.Failed;

    const requests   = data.requests || [];
    const currentIds = requests.map(r => r._id?.toString());
    const newRequests = requests.filter(r => !knownIds.includes(r._id?.toString()));

    if (newRequests.length > 0) {
      for (const req of newRequests) {
        await showJobNotification({
          id:              req._id,
          userName:        req.user?.fullName || 'Client',
          service:         req.category      || 'Service',
          location:        req.city          || 'Nearby',
          estimatedAmount: req.total         || 0,
        });

        if (req.isImmediate !== false) {
          await startAlertSound();
        }
      }
    }

    await AsyncStorage.setItem('known_request_ids', JSON.stringify(currentIds));

    return newRequests.length > 0
      ? BackgroundTask.BackgroundTaskResult.Success
      : BackgroundTask.BackgroundTaskResult.NoData;

  } catch (err) {
    console.error('[BG Task] Error:', err.message);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export const registerBackgroundFetch = async () => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    if (!isRegistered) {
      await BackgroundTask.registerTaskAsync(BACKGROUND_FETCH_TASK, {
        minimumInterval: 15 * 60, // 15 min — Android OS minimum, don't go lower
        stopOnTerminate: false,
        startOnBoot:     true,
      });
    }
    console.log('[BG Task] Background fetch registered');
  } catch (err) {
    console.warn('[BG Task] Could not register:', err.message);
  }
};

export const unregisterBackgroundFetch = async () => {
  try {
    await BackgroundTask.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
  } catch (err) {
    console.warn('[BG Task] Could not unregister:', err.message);
  }
};