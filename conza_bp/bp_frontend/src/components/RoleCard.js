import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

const RoleCard = React.memo(({ emoji, title, description, onPress, active }) => (
  <TouchableOpacity
    style={[styles.card, active && styles.cardActive]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
      <Text style={styles.emoji}>{emoji}</Text>
    </View>
    <View style={styles.textWrap}>
      <Text style={[styles.title, active && styles.titleActive]}>{title}</Text>
      <Text style={styles.desc}>{description}</Text>
    </View>
    {active && <View style={styles.activeDot} />}
  </TouchableOpacity>
));

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 4,
  },
  cardActive: {
    borderColor: colors.accentYellow,
    backgroundColor: colors.accentYellowSoft,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrapActive: {
    backgroundColor: 'rgba(245,200,66,0.25)',
    borderColor: colors.accentYellow,
  },
  emoji: {
    fontSize: 26,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  titleActive: {
    color: colors.accentAmber,
  },
  desc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    fontWeight: '400',
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accentAmber,
    marginLeft: 10,
  },
});

export default RoleCard;
