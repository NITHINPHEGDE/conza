import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
// Now driven by a real, admin-controlled ServiceCategory (same data source
// as every other category card: labourCategories from useAppStore). The
// parent (BookingScreen) only renders this component when the admin has
// actually created & activated a "Helper" category, and passes that
// category's real data + the same onPress handler used by LabourCategoryCard
// — so clicking it, hiding/showing it, and its backend matching all behave
// exactly like every other category. Only the visual presentation (banner
// instead of grid tile) is intentionally different in the customer app.
const HelperBannerCard = React.memo(({ item, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const animateIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };

  const animateOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 8,
    }).start();
  };

  const handlePress = () => {
    if (item && onPress) {
      onPress(item);
    }
  };

  const sub = item?.description || 'General helpers for shifting, clearing & aid';

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale }] }]}>
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.88}
        onPress={handlePress}
        onPressIn={animateIn}
        onPressOut={animateOut}
      >
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="account-group" size={16} color="#D97706" />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>Need a Helper?</Text>
          <Text style={styles.sub} numberOfLines={1}>{sub}</Text>
        </View>

        <MaterialCommunityIcons name="chevron-right" size={16} color="#94A3B8" />
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 0,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 7,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#0F172A',
    letterSpacing: -0.1,
  },
  sub: {
    fontSize: 10,
    fontWeight: '400',
    color: '#64748B',
    marginTop: 1,
    lineHeight: 13,
  },
});

export default HelperBannerCard;
