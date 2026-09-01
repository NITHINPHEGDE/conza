import React, { useEffect, useState, useCallback } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TabNavigator, { AuthStack } from './src/navigation/TabNavigator';
import SplashScreen from './src/screens/SplashScreen';
import SuspendedScreen from './src/screens/SuspendedScreen';
import LocationRequiredScreen from './src/screens/LocationRequiredScreen';
import './src/hooks/useAuth';
import { useAuth } from './src/hooks/useAuth';
import useAppStore from './src/store/useAppStore';
import BookingTrackingScreen from './src/screens/BookingTrackingScreen';
import WorkCompletionToast from './src/components/WorkCompletionToast';
import LabourEventToast from './src/components/LabourEventToast';

const Stack = createNativeStackNavigator();
export const navigationRef = createNavigationContainerRef();

export default function App() {
  const { restoreSession } = useAuth();
  const initApp = useAppStore((s) => s.initApp);
  const userProfile = useAppStore((s) => s.userProfile);
  const initialized = useAppStore((s) => s.initialized);
  const locationStatus = useAppStore((s) => s.locationStatus);
  const pendingWorkerCompletion = useAppStore((s) => s.pendingWorkerCompletion);
  const clearPendingWorkerCompletion = useAppStore((s) => s.clearPendingWorkerCompletion);
  const setActiveBookingId = useAppStore((s) => s.setActiveBookingId);
  const labourPopupQueue = useAppStore((s) => s.labourPopupQueue);
  const dismissLabourPopup = useAppStore((s) => s.dismissLabourPopup);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await restoreSession();
        await initApp();
      } catch (err) {
        console.error("Bootstrap error:", err);
      }
    };
    bootstrap();
  }, []);

  // When a worker marks a job (autobook or manual) as "Work Completed", a
  // bottom banner should appear no matter what screen the customer is on.
  // Tapping it jumps to Status tab → that booking's detail screen, where
  // the "Confirm Work Completion" modal (BookingTrackingScreen) takes over
  // — that modal stays scoped to the detail screen; this banner is just
  // the app-wide entry point into it.
  const handleWorkCompletionPress = useCallback(async () => {
    if (!pendingWorkerCompletion) return;
    const { bookingId, workerId } = pendingWorkerCompletion;
    await setActiveBookingId(bookingId);
    if (navigationRef.isReady()) {
      navigationRef.navigate('Main', {
        screen: 'Status',
        params: { screen: 'BookingDetail', params: { focusWorkerId: workerId } },
      });
    }
    clearPendingWorkerCompletion();
  }, [pendingWorkerCompletion]);

  // Manual-booking labour accepted/cancelled + Quick Auto Book "nobody
  // accepted" popups — same global, stays-until-closed pattern as the work
  // completion banner above. Queued in the store so if several arrive
  // before the customer dismisses one, they're shown one at a time.
  const currentLabourPopup = labourPopupQueue[0] || null;

  const handleLabourPopupPress = useCallback(async () => {
    if (!currentLabourPopup) return;
    await setActiveBookingId(currentLabourPopup.bookingId);
    if (navigationRef.isReady()) {
      navigationRef.navigate('Main', {
        screen: 'Status',
        params: { screen: 'BookingDetail' },
      });
    }
    dismissLabourPopup(currentLabourPopup.id);
  }, [currentLabourPopup]);

  const handleLabourPopupDismiss = useCallback(() => {
    if (currentLabourPopup) dismissLabourPopup(currentLabourPopup.id);
  }, [currentLabourPopup]);

  if (!initialized && userProfile === null) {
    return (
      <SafeAreaProvider>
        <SplashScreen />
      </SafeAreaProvider>
    );
  }

  // Location is mandatory — block every other screen until it's granted,
  // no matter what else has finished loading.
  if (userProfile && userProfile.status !== 'suspended' && locationStatus !== 'granted') {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" backgroundColor="#FAFAF7" />
        <LocationRequiredScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor="#FAFAF7" />
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {userProfile?.status === 'suspended' ? (
            <Stack.Screen name="Suspended" component={SuspendedScreen} />
          ) : userProfile ? (
            <>
              <Stack.Screen name="Main" component={TabNavigator} />
            </>
          ) : (
            <Stack.Screen name="Auth" component={AuthStack} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
      <WorkCompletionToast
        visible={!!pendingWorkerCompletion}
        workerName={pendingWorkerCompletion?.workerName}
        onPress={handleWorkCompletionPress}
        onDismiss={clearPendingWorkerCompletion}
      />
      <LabourEventToast
        visible={!!currentLabourPopup}
        title={currentLabourPopup?.title}
        message={currentLabourPopup?.message}
        variant={currentLabourPopup?.type}
        onPress={handleLabourPopupPress}
        onDismiss={handleLabourPopupDismiss}
        stacked={!!pendingWorkerCompletion}
      />
    </SafeAreaProvider>
  );
}