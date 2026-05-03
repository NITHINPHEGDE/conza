import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

const CategoryButton = React.memo(({ label, icon, isSelected, onPress }) => {
  if (isSelected) {
    return (
      <TouchableOpacity 
        onPress={onPress} 
        activeOpacity={0.9} 
        style={styles.wrapper}
      >
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.button, styles.buttonSelected]}
        >
          <Text style={styles.iconSelected}>{icon}</Text>
          <Text style={styles.labelSelected}>{label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      onPress={onPress} 
      activeOpacity={0.7} 
      style={styles.wrapper}
    >
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
    marginHorizontal: 5,
  },
  button: {
    paddingVertical: 14, // Increased from 11
    paddingHorizontal: 12,
    borderRadius: 16, // Smoother corners
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    position: 'relative',
  },
  buttonSelected: {
    shadowColor: colors.accentAmber,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonInactive: {
    paddingVertical: 14, // Increased from 11
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconSelected: { 
    fontSize: 16,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  labelSelected: {
    fontSize: 13,
    fontWeight: '800', // Bolder
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
  iconInactive: { 
    fontSize: 16,
    opacity: 0.8,
  },
  labelInactive: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.2,
  },
});

export default CategoryButton;