import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TabNavigator, { AuthStack } from './src/navigation/TabNavigator';
import SplashScreen from './src/screens/SplashScreen';
import './src/hooks/useAuth';
import { useAuth } from './src/hooks/useAuth';
import useAppStore from './src/store/useAppStore';

const Stack = createNativeStackNavigator();

export default function App() {
  const { restoreSession } = useAuth();
  const initApp = useAppStore((s) => s.initApp);
  const userProfile = useAppStore((s) => s.userProfile);
  const initialized = useAppStore((s) => s.initialized);

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

  if (!initialized && userProfile === null) {
    return (
      <SafeAreaProvider>
        <SplashScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor="#FAFAF7" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {userProfile ? (
            <Stack.Screen name="Main" component={TabNavigator} />
          ) : (
            <Stack.Screen name="Auth" component={AuthStack} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}