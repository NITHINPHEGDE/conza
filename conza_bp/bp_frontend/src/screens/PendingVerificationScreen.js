// src/screens/PendingVerificationScreen.js
import React, { useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { logout, getMe } from '../services/authService';
import usePartnerStore from '../store/usePartnerStore';
import { stopLocationTracking } from '../services/locationService';
import { colors } from '../theme/colors';

const SUPPORT_EMAIL = 'nr.conza@gmail.com';

// Full-screen block shown in place of the entire app whenever the worker's
// account has NOT yet been verified by the admin. Unverified workers must
// not be able to reach Home/Earnings/Active/History or receive job requests
// — they only see this screen (with a manual refresh + logout) until the
// admin panel flips isVerified to true.
const PendingVerificationScreen = ({ navigation }) => {
  const clearWorker = usePartnerStore((s) => s.clearWorker);
  const setWorker   = usePartnerStore((s) => s.setWorker);
  const [checking, setChecking] = React.useState(false);

  // Poll in the background too, so the moment admin verifies, the worker is
  // dropped straight into the real app without needing to tap refresh.
  useEffect(() => {
    const interval = setInterval(() => {
      getMe().then((fresh) => { if (fresh) setWorker(fresh); });
    }, 15000);
    return () => clearInterval(interval);
  }, [setWorker]);

  const handleRefresh = useCallback(async () => {
    setChecking(true);
    try {
      const fresh = await getMe();
      if (fresh) setWorker(fresh);
    } finally {
      setChecking(false);
    }
  }, [setWorker]);

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
          <Text style={styles.icon}>⏳</Text>
        </View>
        <Text style={styles.title}>Verification Pending</Text>
        <Text style={styles.subtitle}>
          Your account is under admin review. You'll get full access to receive job
          requests, go online, and use the app as soon as your profile is verified.
        </Text>
        <Text style={styles.contactLabel}>Need help?</Text>
        <Text style={styles.contactEmail}>{SUPPORT_EMAIL}</Text>

        <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh} activeOpacity={0.85} disabled={checking}>
          {checking ? (
            <ActivityIndicator color={colors.textOnAccent || '#fff'} />
          ) : (
            <Text style={styles.refreshText}>Check Status</Text>
          )}
        </TouchableOpacity>

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
    backgroundColor: colors.statusYellowSoft || '#FFF6DA',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  icon:      { fontSize: 40 },
  title:     { fontSize: 22, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', marginBottom: 10 },
  subtitle:  { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  contactLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' },
  contactEmail: { fontSize: 16, fontWeight: '700', color: colors.accentAmber, marginTop: 6, marginBottom: 28 },
  refreshBtn: {
    backgroundColor: colors.accentAmber,
    borderRadius: 14, paddingVertical: 13, paddingHorizontal: 40,
    marginBottom: 14,
    minWidth: 180,
    alignItems: 'center',
  },
  refreshText: { fontSize: 14, fontWeight: '700', color: colors.white || '#fff' },
  logoutBtn: {
    borderWidth: 1.5, borderColor: colors.border,
    borderRadius: 14, paddingVertical: 13, paddingHorizontal: 32,
  },
  logoutText: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
});

export default PendingVerificationScreen;
