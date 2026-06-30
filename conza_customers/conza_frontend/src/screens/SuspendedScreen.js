import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Linking, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useAuth } from '../hooks/useAuth';

const SUPPORT_EMAIL = 'nr.conza@gmail.com';

export default function SuspendedScreen() {
  const { logout } = useAuth();

  const contactSupport = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Account Suspended - Support Request`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="lock-closed" size={36} color={colors.danger} />
        </View>
        <Text style={styles.title}>Account Suspended</Text>
        <Text style={styles.message}>
          You have been suspended for further actions. Please contact{' '}
          <Text style={styles.email} onPress={contactSupport}>{SUPPORT_EMAIL}</Text>
        </Text>

        <TouchableOpacity style={styles.button} onPress={contactSupport}>
          <Text style={styles.buttonText}>Contact Support</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(224,59,59,0.10)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginBottom: 12, textAlign: 'center' },
  message: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  email: { color: colors.accentAmber, fontWeight: '600' },
  button: {
    marginTop: 28, backgroundColor: colors.accentAmber,
    paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12,
  },
  buttonText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  logoutButton: { marginTop: 16, paddingVertical: 10 },
  logoutText: { color: colors.textMuted, fontWeight: '600', fontSize: 14 },
});