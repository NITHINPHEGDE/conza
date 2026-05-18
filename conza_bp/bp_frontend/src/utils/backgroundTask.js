// src/utils/backgroundTask.js
import * as TaskManager from 'expo-task-manager';
import * as BackgroundTask from 'expo-background-task';
import { startAlertSound, showJobNotification } from './notificationService';

export const BACKGROUND_FETCH_TASK = 'background-job-check';

// ── Define the task (must be at ROOT level, outside any component) ─────────
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    
    // Get stored token
    const token = await AsyncStorage.getItem('conza_token');
    if (!token) return BackgroundTask.BackgroundTaskResult.Failed;

    // Get stored previous request IDs
    const storedIds = await AsyncStorage.getItem('known_request_ids');
    const knownIds  = storedIds ? JSON.parse(storedIds) : [];

    // Fetch current requests from backend
    const BASE_URL = require('../services/apiClient').BASE_URL || 'http://10.247.177.155:5005/api';
    const response = await fetch(`${BASE_URL}/bookings/requests`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) return BackgroundFetch.BackgroundFetchResult.Failed;

    const data = await response.json();
    if (!data.success) return BackgroundTask.BackgroundTaskResult.Failed;

    const requests   = data.requests || [];
    const currentIds = requests.map(r => r._id?.toString());

    // Find new requests not seen before
    const newRequests = requests.filter(r => !knownIds.includes(r._id?.toString()));

    if (newRequests.length > 0) {
      for (const req of newRequests) {
        // Show notification
        await showJobNotification({
          id:              req._id,
          userName:        req.user?.fullName || 'Client',
          service:         req.category      || 'Service',
          location:        req.city          || 'Nearby',
          estimatedAmount: req.total         || 0,
        });

        // Play sound if immediate
        if (req.isImmediate !== false) {
          await startAlertSound();
        }
      }
    }

    // Save current IDs so next check knows what's new
    await AsyncStorage.setItem('known_request_ids', JSON.stringify(currentIds));

    return newRequests.length > 0
  ? BackgroundTask.BackgroundTaskResult.Success
  : BackgroundTask.BackgroundTaskResult.NoData;

  } catch (err) {
    console.error('[BG Task] Error:', err.message);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// ── Register the background fetch task ────────────────────────────────────
export const registerBackgroundFetch = async () => {
  try {
    await BackgroundTask.registerTaskAsync(BACKGROUND_FETCH_TASK, {
  minimumInterval: 60,
  stopOnTerminate: false,
  startOnBoot:     true,
});
    console.log('[BG Task] Background fetch registered');
  } catch (err) {
    console.warn('[BG Task] Could not register:', err.message);
  }
};

// ── Unregister (call on logout) ───────────────────────────────────────────
export const unregisterBackgroundFetch = async () => {
  try {
    await BackgroundTask.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
  } catch (err) {
    console.warn('[BG Task] Could not unregister:', err.message);
  }
};