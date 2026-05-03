import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

const CategoryButton = React.memo(({ label, icon, isSelected, onPress }) => {
  if (isSelected) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.wrapper}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.button}
        >
          <Text style={styles.iconSelected}>{icon}</Text>
          <Text style={styles.labelSelected}>{label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={styles.wrapper}>
      <View style={styles.buttonInactive}>
        <Text style={styles.iconInactive}>{icon}</Text>
        <Text style={styles.labelInactive}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    marginHorizontal: 4,
  },
  button: {
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderRadius: 13,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  buttonInactive: {
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderRadius: 13,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconSelected: { fontSize: 15 },
  labelSelected: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.2,
  },
  iconInactive: { fontSize: 15 },
  labelInactive: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.2,
  },
});

export default CategoryButton;