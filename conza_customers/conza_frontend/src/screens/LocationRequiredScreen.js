import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, AppState, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { colors } from '../theme/colors';
import useAppStore from '../store/useAppStore';

const COPY = {
  unknown:      { title: 'Location Required', body: 'Conzaa needs your location to show nearby workers and accurate distances.' },
  checking:     { title: 'Checking Location…', body: 'Please wait a moment.' },
  denied:       { title: 'Location Access Needed', body: "Please allow location access so we can find workers near you. If nothing happens when you tap below, enable it from your phone's Settings." },
  services_off: { title: 'Turn On Location Services', body: "Your device's GPS/location is switched off. Please turn it on to continue using Conzaa." },
};

export default function LocationRequiredScreen() {
  const locationStatus            = useAppStore((s) => s.locationStatus);
  const requestLocationPermission = useAppStore((s) => s.requestLocationPermission);
  const checkLocationPermission   = useAppStore((s) => s.checkLocationPermission);

  const copy = COPY[locationStatus] || COPY.unknown;

  // Auto re-check whenever the app returns to the foreground — e.g. after
  // the user turns on GPS or grants permission from the Settings app.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkLocationPermission();
    });
    return () => sub.remove();
  }, [checkLocationPermission]);

  const handleEnable = useCallback(async () => {
    if (locationStatus === 'services_off') {
      if (Platform.OS === 'android') {
        Linking.sendIntent?.('android.settings.LOCATION_SOURCE_SETTINGS');
      } else {
        Linking.openURL('App-Prefs:Privacy&path=LOCATION');
      }
      return;
    }
    if (locationStatus === 'denied') {
      const { canAskAgain } = await Location.getForegroundPermissionsAsync();
      if (!canAskAgain) {
        Linking.openSettings();
        return;
      }
    }
    await requestLocationPermission();
  }, [locationStatus, requestLocationPermission]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name="map-marker-alert" size={56} color={colors.accentAmber} />
      </View>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.body}>{copy.body}</Text>

      <TouchableOpacity style={styles.button} onPress={handleEnable} activeOpacity={0.85}>
        <Text style={styles.buttonText}>
          {locationStatus === 'services_off' ? 'Open Location Settings'
            : locationStatus === 'denied' ? 'Open App Settings'
            : 'Enable Location'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.retryButton} onPress={checkLocationPermission} activeOpacity={0.7}>
        <Text style={styles.retryText}>I've enabled it — Retry</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  iconWrap: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.accentYellowSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', marginBottom: 10 },
  body: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 32 },
  button: { backgroundColor: colors.textPrimary, borderRadius: 14, paddingVertical: 15, paddingHorizontal: 32, width: '100%', alignItems: 'center', marginBottom: 14 },
  buttonText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  retryButton: { paddingVertical: 8 },
  retryText: { color: colors.accentAmber, fontSize: 13, fontWeight: '700' },
});
