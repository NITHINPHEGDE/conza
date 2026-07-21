import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Animated, PanResponder, Text, StyleSheet, View, TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useAppStore from '../store/useAppStore';

/**
 * Auto-book progress popup — persistent overlay that shows how many workers
 * have accepted / declined the customer's auto-book request.
 *
 * Behaviour:
 *  - Slides in from the top when progress events arrive.
 *  - Stays visible until the quota is fully met, then shows a success state
 *    with a manual close button.
 *  - User can swipe UP at any time to collapse it into a small pill at the
 *    top edge; tap the pill (or swipe down) to expand it back.
 *  - NEVER auto-dismisses — the user is always in control.
 */
const AutoBookPopup = () => {
  const autoBookProgress = useAppStore((s) => s.autoBookProgress);
  const dismissProgress  = useAppStore((s) => s.dismissAutoBookProgress);

  const [collapsed, setCollapsed] = useState(false);

  // slideY controls the main card position (0 = visible, -200 = hidden above)
  const slideY     = useRef(new Animated.Value(-200)).current;
  const isExpanded = !collapsed;

  // ── Slide in when a new progress arrives ─────────────────────────────────
  useEffect(() => {
    if (autoBookProgress) {
      setCollapsed(false);
      Animated.spring(slideY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 18,
        stiffness: 200,
      }).start();
    }
  }, [autoBookProgress?.bookingId, autoBookProgress?.acceptedCount]);

  // ── Swipe-to-collapse / swipe-to-expand ──────────────────────────────────
  const panY = useRef(new Animated.Value(0)).current;

  // We store collapsed in a ref so the PanResponder closure always reads the
  // latest value without needing to be recreated.
  const collapsedRef = useRef(collapsed);
  collapsedRef.current = collapsed;

  const collapse = useCallback(() => {
    Animated.spring(panY, { toValue: 0, useNativeDriver: true }).start();
    setCollapsed(true);
  }, [panY]);

  const expand = useCallback(() => {
    Animated.spring(panY, { toValue: 0, useNativeDriver: true }).start();
    setCollapsed(false);
  }, [panY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 8,
      onPanResponderMove: (_, g) => {
        if (!collapsedRef.current) {
          // Expanded — only track upward swipes
          if (g.dy < 0) panY.setValue(g.dy);
        } else {
          // Collapsed — only track downward swipes
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

  if (!autoBookProgress) return null;

  const {
    acceptedCount,
    requiredWorkers,
    isFinal,
    category = 'workers',
  } = autoBookProgress;

  const allAccepted  = isFinal && requiredWorkers > 0 && acceptedCount >= requiredWorkers;
  const noneAccepted = isFinal && acceptedCount === 0;
  const inProgress   = !isFinal;

  const icon      = allAccepted ? 'check-circle' : noneAccepted ? 'close-circle' : isFinal ? 'alert-circle' : 'account-check';
  const iconColor = allAccepted ? '#10B981' : noneAccepted ? '#EF4444' : isFinal ? '#F59E0B' : '#6366F1';
  const bgColor   = allAccepted ? '#ECFDF5' : noneAccepted ? '#FEF2F2' : isFinal ? '#FFFBEB' : '#EEF2FF';

  const message = noneAccepted
    ? `No ${category} accepted your request`
    : allAccepted
      ? `All ${acceptedCount} ${category} accepted!`
      : isFinal
        ? `Only ${acceptedCount} of ${requiredWorkers} ${category} accepted`
        : `${acceptedCount}/${requiredWorkers} ${category} accepted`;

  // ── Collapsed pill — sits at the top edge, tap or swipe down to restore ──
  if (collapsed) {
    return (
      <Animated.View
        style={[styles.collapsedContainer, { transform: [{ translateY: slideY }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.collapsedPill}
          onPress={expand}
          activeOpacity={0.8}
        >
          {inProgress && (
            <View style={[styles.miniProgressDot, { backgroundColor: iconColor }]} />
          )}
          <MaterialCommunityIcons name={icon} size={14} color={iconColor} />
          <Text style={[styles.collapsedText, { color: iconColor }]}>{message}</Text>
          <MaterialCommunityIcons name="chevron-down" size={14} color="#94A3B8" />
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // ── Expanded card — full popup ───────────────────────────────────────────
  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: Animated.add(slideY, panY) }] },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={[styles.content, { backgroundColor: bgColor }]}>
        <MaterialCommunityIcons name={icon} size={22} color={iconColor} />
        <Text style={[styles.text, { color: iconColor }]}>{message}</Text>

        {/* Swipe-up hint chevron — hidden when quota met or partial-failed */}
        {!allAccepted && !noneAccepted && (
          <TouchableOpacity onPress={collapse} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialCommunityIcons name="chevron-up" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}

        {/* Close button — only when result is final (success / fail / partial) */}
        {(allAccepted || noneAccepted || isFinal) && (
          <TouchableOpacity onPress={dismissProgress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialCommunityIcons name="close" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Progress bar — shows visual fill while waiting */}
      {inProgress && requiredWorkers > 0 && (
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min((acceptedCount / requiredWorkers) * 100, 100)}%`,
                backgroundColor: iconColor,
              },
            ]}
          />
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // Expanded popup
  container: {
    position: 'absolute',
    top: 110,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 8,
    borderRadius: 14,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  text: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },

  // Thin progress bar beneath the card
  progressTrack: {
    height: 3,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Collapsed tab
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
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  collapsedText: {
    fontSize: 11,
    fontWeight: '700',
  },
  miniProgressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

export default AutoBookPopup;
