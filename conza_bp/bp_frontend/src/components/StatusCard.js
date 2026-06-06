// src/components/StatusCard.js
import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

const GRAD_START = { x: 0, y: 0 };
const GRAD_END   = { x: 1, y: 0 };

// ── Animated action button ────────────────────────────────────────────────────
const ActionButton = React.memo(({ label, onPress }) => {
  const [loading, setLoading] = useState(false);

  // native-driver: transform + opacity only
  const scaleAnim   = useRef(new Animated.Value(1)).current;
  const spinAnim    = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  // Spinner loop — starts/stops with loading
  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 650,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinAnim.stopAnimation();
      spinAnim.setValue(0);
    }
  }, [loading]);

  const handlePress = useCallback(async () => {
    if (loading) return;

    // Press-down scale
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();

    setLoading(true);

    try {
      await onPress();

      // Success pop — scale up then settle
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.06,
          useNativeDriver: true,
          speed: 40,
          bounciness: 8,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 30,
          bounciness: 4,
        }),
      ]).start();

      // Checkmark flash
      Animated.sequence([
        Animated.timing(successOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(successScale,   { toValue: 1, duration: 200, easing: Easing.out(Easing.back(2)), useNativeDriver: true }),
        Animated.delay(400),
        Animated.timing(successOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();

    } catch (_) {
      // Snap back on error
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 40,
        bounciness: 6,
      }).start();
    } finally {
      setLoading(false);
    }
  }, [loading, onPress, scaleAnim, successOpacity, successScale]);

  const spin = spinAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[styles.btnWrap, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={1}
        disabled={loading}
        style={styles.btnTouchable}
      >
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={GRAD_START}
          end={GRAD_END}
          style={styles.actionBtn}
        >
          {/* Spinner */}
          {loading && (
            <Animated.View style={[styles.spinnerWrap, { transform: [{ rotate: spin }] }]}>
              <View style={styles.spinnerArc} />
            </Animated.View>
          )}

          {/* Success checkmark flash */}
          <Animated.Text style={[
            styles.successCheck,
            { opacity: successOpacity, transform: [{ scale: successScale }] },
          ]}>
            ✓
          </Animated.Text>

          {/* Label — fades out while loading */}
          <Text style={[styles.actionBtnText, loading && { opacity: 0 }]}>
            {label}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
});

// ── StatusCard ────────────────────────────────────────────────────────────────
const StatusCard = React.memo(({ step, title, description, status, buttonLabel, onPress, isLast }) => {
  const isDone    = status === 'done';
  const isActive  = status === 'active';
  const isPending = status === 'pending';

  // Dot entrance animation when becoming active
  const dotScale = useRef(new Animated.Value(isDone ? 1 : 0.6)).current;
  useEffect(() => {
    if (isActive || isDone) {
      Animated.spring(dotScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 10,
      }).start();
    }
  }, [isActive, isDone]);

  const dotColor  = isDone ? colors.statusGreen : isActive ? colors.accentAmber : colors.statusGray;
  const lineColor = isDone ? colors.statusGreen : colors.border;

  const dotStyle   = useMemo(() => [styles.dot, { backgroundColor: dotColor, borderColor: dotColor }], [dotColor]);
  const lineStyle  = useMemo(() => [styles.line, { backgroundColor: lineColor }], [lineColor]);
  const cardStyle  = useMemo(() => [
    styles.card,
    isDone    && styles.cardDone,
    isActive  && styles.cardActive,
    isPending && styles.cardPending,
  ], [isDone, isActive, isPending]);
  const titleStyle = useMemo(() => [
    styles.title,
    isDone   && styles.titleDone,
    isActive && styles.titleActive,
  ], [isDone, isActive]);

  return (
    <View style={styles.container}>
      <View style={styles.leftCol}>
        <Animated.View style={[dotStyle, { transform: [{ scale: dotScale }] }]}>
          {isDone
            ? <Text style={styles.checkmark}>✓</Text>
            : <Text style={styles.stepNum}>{step}</Text>
          }
        </Animated.View>
        {!isLast && <View style={lineStyle} />}
      </View>

      <View style={cardStyle}>
        <Text style={titleStyle}>{title}</Text>
        <Text style={styles.description}>{description}</Text>

        {isActive && buttonLabel && (
          <ActionButton label={buttonLabel} onPress={onPress} />
        )}

        {isDone && (
          <View style={styles.doneBadge}>
            <Text style={styles.doneBadgeText}>Completed</Text>
          </View>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container:      { flexDirection: 'row', marginHorizontal: 20, marginBottom: 6 },
  leftCol:        { alignItems: 'center', marginRight: 14, width: 28 },
  dot:            { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  checkmark:      { fontSize: 13, fontWeight: '800', color: colors.white },
  stepNum:        { fontSize: 12, fontWeight: '700', color: colors.white },
  line:           { width: 2, flex: 1, marginVertical: 4, borderRadius: 1 },
  card:           { flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  cardActive:     { borderColor: colors.accentYellow, backgroundColor: colors.accentYellowSoft },
  cardDone:       { borderColor: colors.statusGreen, backgroundColor: colors.statusGreenSoft },
  cardPending:    { opacity: 0.5 },
  title:          { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  titleActive:    { color: colors.accentAmber },
  titleDone:      { color: colors.statusGreen },
  description:    { fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
  btnWrap:        { marginTop: 12 },
  btnTouchable:   { borderRadius: 10, overflow: 'hidden' },
  actionBtn:      { borderRadius: 10, paddingVertical: 11, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', minHeight: 42 },
  actionBtnText:  { fontSize: 13, fontWeight: '700', color: colors.textPrimary, letterSpacing: 0.3 },
  spinnerWrap:    { position: 'absolute', width: 18, height: 18 },
  spinnerArc:     { width: 18, height: 18, borderRadius: 9, borderWidth: 2.5, borderColor: colors.textPrimary, borderTopColor: 'transparent', borderRightColor: 'transparent' },
  successCheck:   { position: 'absolute', fontSize: 18, fontWeight: '900', color: colors.textPrimary },
  doneBadge:      { marginTop: 8, alignSelf: 'flex-start', backgroundColor: colors.statusGreenSoft, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: colors.statusGreen },
  doneBadgeText:  { fontSize: 11, fontWeight: '700', color: colors.statusGreen },
});

export default StatusCard;