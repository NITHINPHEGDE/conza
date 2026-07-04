import React, { useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const hexToRgba = (hex, alpha) => {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Darken a hex color by a percentage, used for the selected-state gradient
const darken = (hex, amount) => {
  const h = hex.replace('#', '');
  const r = Math.max(0, parseInt(h.substring(0, 2), 16) - amount);
  const g = Math.max(0, parseInt(h.substring(2, 4), 16) - amount);
  const b = Math.max(0, parseInt(h.substring(4, 6), 16) - amount);
  return `rgb(${r}, ${g}, ${b})`;
};

const CategoryButton = React.memo(({ label, icon, color, isSelected, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const iconColor = color || colors.accentAmber;
  const iconTint = hexToRgba(iconColor, 0.14);

  const animateIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 6,
    }).start();
  };

  const animateOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 10,
    }).start();
  };

  if (isSelected) {
    return (
      <Animated.View style={[styles.wrapper, { transform: [{ scale: scale.interpolate({ inputRange: [0.96, 1], outputRange: [0.98, 1.04] }) }] }]}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={animateIn}
          onPressOut={animateOut}
          activeOpacity={0.92}
        >
          <LinearGradient
            colors={[iconColor, darken(iconColor, 35)]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.pill, styles.pillSelected, { shadowColor: iconColor }]}
          >
            <View style={styles.iconBadgeSelected}>
              <MaterialCommunityIcons name={icon} size={19} color={iconColor} />
            </View>
            <Text style={styles.labelSelected} numberOfLines={2}>{label}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale }] }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={animateIn}
        onPressOut={animateOut}
        activeOpacity={0.8}
      >
        <View style={styles.pill}>
          <View style={[styles.iconBadge, { backgroundColor: iconTint }]}>
            <MaterialCommunityIcons name={icon} size={19} color={iconColor} />
          </View>
          <Text style={styles.labelInactive} numberOfLines={2}>{label}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    marginHorizontal: 4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderRadius: 14,
    gap: 7,
    backgroundColor: colors.surface,
    borderWidth: 1.3,
    borderColor: colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  pillSelected: {
    borderWidth: 0,
    paddingVertical: 12,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 9,
    elevation: 7,
  },
  iconBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadgeSelected: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelSelected: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.2,
    lineHeight: 15,
    textAlign: 'left',
    flexShrink: 1,
  },
  labelInactive: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.1,
    lineHeight: 15,
    textAlign: 'left',
    flexShrink: 1,
  },
});

export default CategoryButton;