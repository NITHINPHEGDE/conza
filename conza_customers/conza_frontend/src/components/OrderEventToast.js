import React, { useEffect, useRef } from 'react';
import { Animated, Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Global bottom banner for material/rental seller-order accepted,
// dispatched, and rejected events. Same behaviour and visual language as
// WorkCompletionToast / LabourEventToast (App.js): appears no matter what
// screen the customer is on, and stays on screen until they tap the close
// button — it does NOT auto-dismiss on a timer. Multiple events are queued
// by the store (orderPopupQueue) and this component just renders whichever
// one is currently at the front of that queue.
const VARIANT_STYLES = {
  order_accepted:   { icon: 'check-decagram', color: '#16A34A' },
  order_dispatched: { icon: 'truck-fast',      color: '#2563EB' },
  order_rejected:   { icon: 'close-octagon',   color: '#DC2626' },
};

const OrderEventToast = ({ visible, title, message, variant, onPress, onDismiss, stackIndex = 0 }) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(160)).current;
  const { icon, color } = VARIANT_STYLES[variant] || VARIANT_STYLES.order_accepted;

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
        { bottom: insets.bottom + 84 + stackIndex * 90, transform: [{ translateY }] },
      ]}
    >
      <TouchableOpacity
        style={[styles.pill, { backgroundColor: color }]}
        activeOpacity={0.9}
        onPress={onPress}
      >
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name={icon} size={22} color="#FFF" />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle} numberOfLines={3}>
            {message}
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
    zIndex: 9997,
    elevation: 18,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
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

export default OrderEventToast;
