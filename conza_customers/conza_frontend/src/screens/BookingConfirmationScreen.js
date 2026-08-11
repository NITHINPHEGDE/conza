import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import AddToProjectSheet from '../components/AddToProjectSheet';
import SlideToast from '../components/SlideToast';

// Shown right after a labour booking / material order / rental order is
// placed. Lets the customer optionally attach what they just booked to a
// project before heading to My Bookings (Status tab).
const BookingConfirmationScreen = ({ route, navigation }) => {
  const {
    attachment,
    title   = 'Booking Confirmed!',
    message = 'Your booking has been placed successfully.',
  } = route.params || {};

  const [showAddToProject, setShowAddToProject] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '' });

  const goToStatus = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'BookingHome' }],
    });
    navigation.navigate('Status');
  }, [navigation]);

  const handleAddToProjectSuccess = useCallback((project, successMessage) => {
    setToast({ visible: true, message: successMessage });
  }, []);

  const handleDismissToast = useCallback(() => setToast({ visible: false, message: '' }), []);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="check-decagram" size={64} color={colors.success} />
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>

        <TouchableOpacity
          style={styles.addToProjectBtn}
          onPress={() => setShowAddToProject(true)}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="briefcase-plus-outline" size={18} color={colors.textPrimary} />
          <Text style={styles.addToProjectBtnText}>Add to Project</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={goToStatus} activeOpacity={0.85}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.okBtn}
          >
            <Text style={styles.okBtnText}>Okay</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <AddToProjectSheet
        visible={showAddToProject}
        attachment={attachment}
        onClose={() => setShowAddToProject(false)}
        onSuccess={handleAddToProjectSuccess}
      />
      <SlideToast visible={toast.visible} message={toast.message} onDismiss={handleDismissToast} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconWrap: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: 'rgba(46,139,87,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    fontWeight: '500',
    marginBottom: 28,
  },
  addToProjectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accentYellow,
    borderRadius: 16,
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  addToProjectBtnText: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },

  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
  },
  okBtn: { borderRadius: 16, paddingVertical: 17, alignItems: 'center' },
  okBtnText: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.3 },
});

export default BookingConfirmationScreen;
