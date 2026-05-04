import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TabNavigator from './src/navigation/TabNavigator';
import useAppStore from './src/store/useAppStore';

const AppContent = () => {
  const initApp = useAppStore((state) => state.initApp);

  useEffect(() => {
    initApp();
  }, []);

  return (
    <>
      <StatusBar style="dark" backgroundColor="#FAFAF7" />
      <TabNavigator />
    </>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AppContent />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}