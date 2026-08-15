import React, { useEffect, useRef } from 'react';
import { Animated, Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Global bottom banner: fires no matter what screen the customer is on
// when a worker marks a job "Work Completed" (autobook or manual booking).
// Tapping it takes the customer to the Status tab → that booking's detail
// screen, where the existing "Confirm Work Completion" modal (driven by
// activeBooking.status === 'awaiting_customer_confirmation') takes over.
const WorkCompletionToast = ({ visible, workerName, onPress, onDismiss }) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(160)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : 160,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [visible]);

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        styles.wrap,
        { bottom: insets.bottom + 84, transform: [{ translateY }] },
      ]}
    >
      <TouchableOpacity style={styles.pill} activeOpacity={0.9} onPress={onPress}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="clipboard-check" size={22} color="#FFF" />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>Work Completed</Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {workerName ? `${workerName} has ` : 'Your worker has '}
            marked the job as done. Tap to confirm.
          </Text>
        </View>
        <TouchableOpacity
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={onDismiss}
          style={styles.closeBtn}
        >
          <MaterialCommunityIcons name="close" size={18} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 20,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F97316',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textWrap: { flex: 1 },
  title:    { color: '#FFF', fontWeight: '800', fontSize: 14, marginBottom: 2 },
  subtitle: { color: 'rgba(255,255,255,0.9)', fontWeight: '500', fontSize: 12, lineHeight: 16 },
  closeBtn: { paddingLeft: 10 },
});

export default WorkCompletionToast;
