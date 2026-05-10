import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

// status: 'pending' | 'active' | 'done'
const StatusCard = React.memo(({ step, title, description, status, buttonLabel, onPress, isLast }) => {
  const isActive = status === 'active';
  const isDone = status === 'done';
  const isPending = status === 'pending';

  const dotColor = isDone
    ? colors.statusGreen
    : isActive
    ? colors.accentAmber
    : colors.statusGray;

  const lineColor = isDone ? colors.statusGreen : colors.border;

  return (
    <View style={styles.container}>
      {/* Step indicator + connector line */}
      <View style={styles.leftCol}>
        <View style={[styles.dot, { backgroundColor: dotColor, borderColor: dotColor }]}>
          {isDone ? (
            <Text style={styles.checkmark}>✓</Text>
          ) : (
            <Text style={styles.stepNum}>{step}</Text>
          )}
        </View>
        {!isLast && <View style={[styles.line, { backgroundColor: lineColor }]} />}
      </View>

      {/* Card content */}
      <View style={[
        styles.card,
        isDone && styles.cardDone,
        isActive && styles.cardActive,
        isPending && styles.cardPending,
      ]}>
        <Text style={[styles.title, isDone && styles.titleDone, isActive && styles.titleActive]}>
          {title}
        </Text>
        <Text style={styles.description}>{description}</Text>

        {isActive && buttonLabel && (
          <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={{ marginTop: 12 }}>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
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
  container: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 6,
  },
  leftCol: {
    alignItems: 'center',
    marginRight: 14,
    width: 28,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.white,
  },
  stepNum: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  line: {
    width: 2,
    flex: 1,
    marginVertical: 4,
    borderRadius: 1,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardActive: {
    borderColor: colors.accentYellow,
    backgroundColor: colors.accentYellowSoft,
  },
  cardDone: {
    borderColor: colors.statusGreen,
    backgroundColor: colors.statusGreenSoft,
  },
  cardPending: {
    opacity: 0.5,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  titleActive: {
    color: colors.accentAmber,
  },
  titleDone: {
    color: colors.statusGreen,
  },
  description: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  actionBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
  doneBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: colors.statusGreenSoft,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.statusGreen,
  },
  doneBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.statusGreen,
  },
});

export default StatusCard;
