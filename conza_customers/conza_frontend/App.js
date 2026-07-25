import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
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

  // Quick Auto Book: when a worker marks their part of the job done, pop up
  // a confirmation that jumps straight to that worker's status card —
  // instead of Status tab → tap booking → find the right card.
  useEffect(() => {
    if (!pendingWorkerCompletion) return;
    const { bookingId, workerId, workerName } = pendingWorkerCompletion;
    Alert.alert(
      'Work Completed ✅',
      `${workerName || 'A worker'} has marked their work as done. Confirm to release payment.`,
      [
        {
          text: 'View & Confirm',
          onPress: async () => {
            await setActiveBookingId(bookingId);
            if (navigationRef.isReady()) {
              navigationRef.navigate('Main', {
                screen: 'Status',
                params: { screen: 'BookingDetail', params: { focusWorkerId: workerId } },
              });
            }
            clearPendingWorkerCompletion();
          },
        },
        { text: 'Later', style: 'cancel', onPress: () => clearPendingWorkerCompletion() },
      ]
    );
  }, [pendingWorkerCompletion]);

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
    </SafeAreaProvider>
  );
}