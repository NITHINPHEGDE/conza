import React, { useEffect, useRef } from 'react';
import {
  Animated, PanResponder, Text, StyleSheet, View, TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import useAppStore from '../store/useAppStore';

/**
 * Global popup that appears on ANY screen when a worker marks their work as
 * finished.  Tapping "View & Confirm" navigates the customer straight to the
 * BookingTrackingScreen confirmation modal.
 *
 * Behaviour mirrors AutoBookPopup — slides in from the top, can be swiped up
 * to collapse into a small pill, and swiped down / tapped to expand again.
 * Does NOT auto-dismiss — the customer must act on it.
 */
const WorkCompletionPopup = () => {
  const navigation = useNavigation();
  const pending    = useAppStore((s) => s.pendingWorkCompletion);
  const dismiss    = useAppStore((s) => s.dismissWorkCompletion);
  const activeBookingId   = useAppStore((s) => s.activeBookingId);
  const setActiveBookingId = useAppStore((s) => s.setActiveBookingId);

  const slideY = useRef(new Animated.Value(-200)).current;
  const panY   = useRef(new Animated.Value(0)).current;
  const collapsedRef = useRef(false);
  const [collapsed, setCollapsed] = React.useState(false);

  // ── Slide in when a work-completion event arrives ──────────────────────
  useEffect(() => {
    if (pending) {
      setCollapsed(false);
      collapsedRef.current = false;
      Animated.spring(slideY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 18,
        stiffness: 200,
      }).start();
    }
  }, [pending?.bookingId]);

  // ── Swipe-to-collapse / swipe-to-expand ────────────────────────────────
  const collapse = () => {
    Animated.spring(panY, { toValue: 0, useNativeDriver: true }).start();
    setCollapsed(true);
    collapsedRef.current = true;
  };

  const expand = () => {
    Animated.spring(panY, { toValue: 0, useNativeDriver: true }).start();
    setCollapsed(false);
    collapsedRef.current = false;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 8,
      onPanResponderMove: (_, g) => {
        if (!collapsedRef.current) {
          if (g.dy < 0) panY.setValue(g.dy);
        } else {
          if (g.dy > 0) panY.setValue(g.dy);
        }
      },
      onPanResponderRelease: (_, g) => {
        if (!collapsedRef.current && g.dy < -40) {
          collapse();
        } else if (collapsedRef.current && g.dy > 40) {
          expand();
        } else {
          Animated.spring(panY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  // ── Navigate to the booking detail screen ──────────────────────────────
  const handleViewBooking = async () => {
    if (!pending?.bookingId) return;
    await setActiveBookingId(pending.bookingId);
    dismiss();
    // Navigate to the Status tab stack, then push BookingDetail
    navigation.navigate('Status');
    navigation.navigate('StatusList');
    navigation.navigate('BookingDetail');
  };

  const handleDismiss = () => {
    Animated.spring(slideY, { toValue: -200, useNativeDriver: true }).start(() => {
      dismiss();
    });
  };

  if (!pending) return null;

  const { workerName, category } = pending;

  // ── Collapsed pill ─────────────────────────────────────────────────────
  if (collapsed) {
    return (
      <Animated.View
        style={[styles.collapsedContainer, { transform: [{ translateY: slideY }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity style={styles.collapsedPill} onPress={expand} activeOpacity={0.8}>
          <View style={styles.pulseDot} />
          <MaterialCommunityIcons name="clipboard-check" size={14} color="#F97316" />
          <Text style={styles.collapsedText}>Work finished — tap to confirm</Text>
          <MaterialCommunityIcons name="chevron-down" size={14} color="#94A3B8" />
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // ── Expanded card ──────────────────────────────────────────────────────
  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateY: Animated.add(slideY, panY) }] }]}
      {...panResponder.panHandlers}
    >
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="clipboard-check" size={22} color="#FFF" />
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.title}>Work Finished!</Text>
          <Text style={styles.subtitle}>
            {workerName} has marked the {category} job as completed. Please review and confirm.
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={handleViewBooking}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="check-circle" size={18} color="#FFF" />
          <Text style={styles.confirmBtnText}>View & Confirm</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dismissBtn} onPress={handleDismiss} activeOpacity={0.7}>
          <Text style={styles.dismissBtnText}>Later</Text>
        </TouchableOpacity>
      </View>

      {/* Swipe-up hint */}
      <TouchableOpacity onPress={collapse} style={styles.collapseHint} activeOpacity={0.6}>
        <MaterialCommunityIcons name="chevron-up" size={16} color="#94A3B8" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // Expanded card
  container: {
    position: 'absolute',
    top: 110,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    alignItems: 'flex-start',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#B45309',
    lineHeight: 17,
  },

  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  confirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F97316',
    paddingVertical: 11,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  confirmBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  dismissBtn: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dismissBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },

  collapseHint: {
    alignItems: 'center',
    paddingTop: 4,
  },

  // Collapsed pill
  collapsedContainer: {
    position: 'absolute',
    top: 90,
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  collapsedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    elevation: 5,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  collapsedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#F97316',
  },
});

export default WorkCompletionPopup;
