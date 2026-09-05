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
      <Animated.View style={[styles.wrapper, { transform: [{ scale }] }]}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={animateIn}
          onPressOut={animateOut}
          activeOpacity={0.92}
        >
          <View style={[styles.pill, styles.pillSelected]}>
            <View style={styles.iconBoxSelected}>
              <MaterialCommunityIcons name={icon} size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.labelSelected} numberOfLines={2}>{label}</Text>
          </View>
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
          <View style={styles.iconCircleInactive}>
            <MaterialCommunityIcons name={icon} size={20} color="#F59E0B" />
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
    marginHorizontal: 3,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 8,
    borderRadius: 16,
    gap: 7,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  pillSelected: {
    backgroundColor: '#F59E0B',
    borderWidth: 0,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  iconCircleInactive: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxSelected: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelSelected: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    lineHeight: 15,
    flexShrink: 1,
  },
  labelInactive: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.2,
    lineHeight: 15,
    flexShrink: 1,
  },
});

export default CategoryButton;