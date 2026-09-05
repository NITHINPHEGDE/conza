import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  Image,
  Animated,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const TRADE_META = {
  mason: {
    icon: 'wall',
    iconColor: '#C2410C',
    bgColor: '#FFEDD5',
    sub: 'Brick & plaster',
    defaultWorkers: '1.2K+ active',
  },
  electrician: {
    icon: 'lightning-bolt',
    iconColor: '#D97706',
    bgColor: '#FEF3C7',
    sub: 'Wiring & repairs',
    defaultWorkers: '980+ active',
  },
  plumber: {
    icon: 'water-pump',
    iconColor: '#0284C7',
    bgColor: '#E0F2FE',
    sub: 'Pipes & fittings',
    defaultWorkers: '870+ active',
  },
  carpenter: {
    icon: 'hammer',
    iconColor: '#B45309',
    bgColor: '#FFEDD5',
    sub: 'Furniture & doors',
    defaultWorkers: '640+ active',
  },
  painter: {
    icon: 'format-paint',
    iconColor: '#CA8A04',
    bgColor: '#FEF9C3',
    sub: 'Interior & paint',
    defaultWorkers: '720+ active',
  },
  'steel fixer': {
    icon: 'grid',
    iconColor: '#475569',
    bgColor: '#F1F5F9',
    sub: 'RCC & steel work',
    defaultWorkers: '410+ active',
  },
  helper: {
    icon: 'account-group',
    iconColor: '#D97706',
    bgColor: '#FEF3C7',
    sub: 'General helpers',
    defaultWorkers: '1.5K+ active',
  },
};

const getMeta = (label = '') => {
  const key = label.trim().toLowerCase();
  if (key.startsWith('electr')) return TRADE_META.electrician;
  for (const [trade, meta] of Object.entries(TRADE_META)) {
    if (key.includes(trade)) return meta;
  }
  return {
    icon: 'hammer-wrench',
    iconColor: '#D97706',
    bgColor: '#FEF3C7',
    sub: 'Trade service',
    defaultWorkers: '500+ active',
  };
};

const LabourCategoryCard = React.memo(({ item, onPress }) => {
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

  const meta = getMeta(item.label || item.name || '');
  const description = item.description || meta.sub;
  const workerCountText =
    item.workersCount ||
    (item.available > 0
      ? `${item.available * 40 || 400}+ active`
      : meta.defaultWorkers);

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale }] }]}>
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.88}
        onPress={() => onPress && onPress(item)}
        onPressIn={animateIn}
        onPressOut={animateOut}
      >
        {/* Left: Side Photo or Single Trade Illustration Badge */}
        <View style={styles.imageBox}>
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.fallbackBox, { backgroundColor: meta.bgColor }]}>
              <MaterialCommunityIcons name={meta.icon} size={28} color={meta.iconColor} />
            </View>
          )}
        </View>

        {/* Right: Info Column */}
        <View style={styles.infoCol}>
          <View>
            <Text style={styles.title} numberOfLines={1}>
              {item.label || item.name}
            </Text>
            <Text style={styles.sub} numberOfLines={2}>
              {description}
            </Text>
          </View>

          <View style={styles.bottomRow}>
            <View style={styles.workerBadge}>
              <MaterialCommunityIcons name="account-group-outline" size={12} color="#94A3B8" />
              <Text style={styles.workerCount} numberOfLines={1}>
                {workerCountText}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={15} color="#D97706" />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  cardWrapper: {
    flex: 1,
    marginBottom: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 6,
    height: 102,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  imageBox: {
    width: 76,
    height: '100%',
    borderRadius: 9,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallbackBox: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    flex: 1,
    paddingLeft: 8,
    paddingRight: 3,
    justifyContent: 'space-between',
    paddingVertical: 3,
    height: '100%',
  },
  title: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0F172A',
    letterSpacing: -0.1,
    lineHeight: 18,
  },
  sub: {
    fontSize: 10.5,
    fontWeight: '400',
    color: '#64748B',
    lineHeight: 14,
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  workerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  workerCount: {
    fontSize: 9.5,
    fontWeight: '400',
    color: '#64748B',
    flexShrink: 1,
  },
});

export default LabourCategoryCard;