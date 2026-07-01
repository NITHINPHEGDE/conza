// src/screens/SuspendedScreen.js
import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { logout } from '../services/authService';
import usePartnerStore from '../store/usePartnerStore';
import { stopLocationTracking } from '../services/locationService';
import { colors } from '../theme/colors';

const SUPPORT_EMAIL = 'nr.conza@gmail.com';

// Full-screen block shown in place of the entire app whenever the worker's
// account has been suspended by the admin. No booking/profile/earnings
// screens are reachable from here.
const SuspendedScreen = ({ navigation }) => {
  const clearWorker = usePartnerStore((s) => s.clearWorker);

  const handleLogout = useCallback(async () => {
    stopLocationTracking();
    clearWorker();
    await logout();
    navigation.replace('Auth');
  }, [navigation, clearWorker]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>⛔</Text>
        </View>
        <Text style={styles.title}>You have been suspended</Text>
        <Text style={styles.subtitle}>
          Your account has been temporarily suspended by the Conza team.
        </Text>
        <Text style={styles.contactLabel}>Contact</Text>
        <Text style={styles.contactEmail}>{SUPPORT_EMAIL}</Text>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content:   { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  iconCircle: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  icon:      { fontSize: 40 },
  title:     { fontSize: 22, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', marginBottom: 10 },
  subtitle:  { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  contactLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' },
  contactEmail: { fontSize: 16, fontWeight: '700', color: colors.accentAmber, marginTop: 6, marginBottom: 36 },
  logoutBtn: {
    borderWidth: 1.5, borderColor: colors.border,
    borderRadius: 14, paddingVertical: 13, paddingHorizontal: 32,
  },
  logoutText: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
});

export default SuspendedScreen;
