// src/components/VerificationBanner.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import usePartnerStore from '../store/usePartnerStore';
import { colors } from '../theme/colors';

// Small persistent strip shown at the very top of the app so a worker always
// knows whether the admin has verified their account yet.
const VerificationBanner = React.memo(() => {
  const isVerified = usePartnerStore((s) => !!s.worker?.isVerified);

  return (
    <SafeAreaView edges={['top']} style={isVerified ? styles.safeVerified : styles.safePending}>
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: isVerified ? colors.statusGreen : colors.statusYellow }]} />
        <Text style={[styles.text, { color: isVerified ? colors.statusGreen : colors.statusYellow }]}>
          {isVerified ? 'Verified Worker' : 'Verification Pending — under admin review'}
        </Text>
      </View>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  safeVerified: { backgroundColor: colors.statusGreenSoft },
  safePending:  { backgroundColor: colors.statusYellowSoft },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 6,
  },
  dot:  { width: 7, height: 7, borderRadius: 3.5 },
  text: { fontSize: 12, fontWeight: '700', letterSpacing: 0.2 },
});

export default VerificationBanner;
