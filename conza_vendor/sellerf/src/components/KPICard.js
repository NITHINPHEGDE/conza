import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';

const KPICard = ({ label, value, icon, accent, onPress }) => (
  <TouchableOpacity
    style={[styles.card, { borderTopColor: accent, borderTopWidth: 3 }]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <Text style={styles.icon}>{icon}</Text>
    <Text style={[styles.value, { color: accent }]}>{value}</Text>
    <Text style={styles.label}>{label}</Text>
  </TouchableOpacity>
);
const styles = StyleSheet.create({
  card: {
    flex:            1,
    backgroundColor: colors.surface,
    borderRadius:    14,
    padding:         12,
    alignItems:      'center',
    marginHorizontal: 4,
    elevation:        2,
    shadowColor:      colors.cardShadow,
    shadowOffset:     { width: 0, height: 2 },
    shadowOpacity:    0.08,
    shadowRadius:     6,
    minWidth:         70,
  },
  icon:  { fontSize: 22, marginBottom: 6 },
  value: { fontSize: 20, fontWeight: '900', marginBottom: 2 },
  label: { fontSize: 10, color: colors.textMuted, fontWeight: '600', textAlign: 'center' },
});

export default KPICard;