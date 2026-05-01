import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TabNavigator from './src/navigation/TabNavigator';
import { colors } from './src/theme/colors';
export default function App() {
  return (

    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" backgroundColor={colors.background} />
        <TabNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}