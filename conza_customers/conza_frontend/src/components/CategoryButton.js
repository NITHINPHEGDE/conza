import React, { useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const CategoryButton = React.memo(({ label, icon, isSelected, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const animateIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const animateOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 8,
    }).start();
  };

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale }] }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={animateIn}
        onPressOut={animateOut}
        activeOpacity={0.88}
        style={[styles.pill, isSelected ? styles.pillActive : styles.pillInactive]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={16}
          color={isSelected ? '#F59E0B' : '#64748B'}
          style={styles.icon}
        />
        <Text
          style={[styles.label, isSelected ? styles.labelActive : styles.labelInactive]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    marginHorizontal: 2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
    paddingHorizontal: 6,
    borderRadius: 16,
  },
  pillActive: {
    backgroundColor: '#111827',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  pillInactive: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  icon: {
    marginRight: 5,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  labelActive: {
    color: '#FFFFFF',
  },
  labelInactive: {
    color: '#475569',
  },
});

export default CategoryButton;