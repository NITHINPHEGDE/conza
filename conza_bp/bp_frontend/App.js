import './src/utils/backgroundTask';
import { registerBackgroundNotificationHandler } from './src/utils/callNotification';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';

// Must be registered at root level
registerBackgroundNotificationHandler();

export default function App() {
  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
}