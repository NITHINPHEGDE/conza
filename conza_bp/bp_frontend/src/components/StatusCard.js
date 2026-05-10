// src/components/StatusCard.js
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

const GRAD_START = { x: 0, y: 0 };
const GRAD_END   = { x: 1, y: 0 };

const StatusCard = React.memo(({ step, title, description, status, buttonLabel, onPress, isLast }) => {
  const isDone    = status === 'done';
  const isActive  = status === 'active';
  const isPending = status === 'pending';

  const dotColor  = isDone ? colors.statusGreen : isActive ? colors.accentAmber : colors.statusGray;
  const lineColor = isDone ? colors.statusGreen : colors.border;

  const dotStyle  = useMemo(() => [styles.dot, { backgroundColor: dotColor, borderColor: dotColor }], [dotColor]);
  const lineStyle = useMemo(() => [styles.line, { backgroundColor: lineColor }], [lineColor]);
  const cardStyle = useMemo(() => [
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
        <View style={dotStyle}>
          {isDone
            ? <Text style={styles.checkmark}>✓</Text>
            : <Text style={styles.stepNum}>{step}</Text>
          }
        </View>
        {!isLast && <View style={lineStyle} />}
      </View>

      <View style={cardStyle}>
        <Text style={titleStyle}>{title}</Text>
        <Text style={styles.description}>{description}</Text>

        {isActive && buttonLabel && (
          <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.btnWrap}>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={GRAD_START} end={GRAD_END}
              style={styles.actionBtn}
            >
              <Text style={styles.actionBtnText}>{buttonLabel}</Text>
            </LinearGradient>
          </TouchableOpacity>
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
  container:     { flexDirection: 'row', marginHorizontal: 20, marginBottom: 6 },
  leftCol:       { alignItems: 'center', marginRight: 14, width: 28 },
  dot:           { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  checkmark:     { fontSize: 13, fontWeight: '800', color: colors.white },
  stepNum:       { fontSize: 12, fontWeight: '700', color: colors.white },
  line:          { width: 2, flex: 1, marginVertical: 4, borderRadius: 1 },
  card:          { flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  cardActive:    { borderColor: colors.accentYellow, backgroundColor: colors.accentYellowSoft },
  cardDone:      { borderColor: colors.statusGreen, backgroundColor: colors.statusGreenSoft },
  cardPending:   { opacity: 0.5 },
  title:         { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  titleActive:   { color: colors.accentAmber },
  titleDone:     { color: colors.statusGreen },
  description:   { fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
  btnWrap:       { marginTop: 12 },
  actionBtn:     { borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  actionBtnText: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, letterSpacing: 0.3 },
  doneBadge:     { marginTop: 8, alignSelf: 'flex-start', backgroundColor: colors.statusGreenSoft, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: colors.statusGreen },
  doneBadgeText: { fontSize: 11, fontWeight: '700', color: colors.statusGreen },
});

export default StatusCard;