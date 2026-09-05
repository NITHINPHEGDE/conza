import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const H_PADDING = 10;
const BANNER_WIDTH = SCREEN_WIDTH - H_PADDING * 2;
const BANNER_HEIGHT = Math.min(Math.round(BANNER_WIDTH * 0.25), 94);
const AUTO_SLIDE_INTERVAL = 3000;

export default function BannerCarousel({ banners = [] }) {
  const navigation = useNavigation();
  const scrollRef = useRef(null);
  const indexRef = useRef(0);
  const timerRef = useRef(null);
  const isPausedRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const count = banners?.length || 0;

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = useCallback(() => {
    clearTimer();
    if (count < 2) return;
    timerRef.current = setInterval(() => {
      if (isPausedRef.current) return;
      const next = (indexRef.current + 1) % count;
      indexRef.current = next;
      scrollRef.current?.scrollTo({ x: next * BANNER_WIDTH, animated: true });
      setActiveIndex(next);
    }, AUTO_SLIDE_INTERVAL);
  }, [count]);

  useEffect(() => {
    startTimer();
    return clearTimer;
  }, [startTimer]);

  const handleTouchStart = () => { isPausedRef.current = true; };
  const handleTouchEnd   = () => { isPausedRef.current = false; };

  const handleMomentumScrollEnd = (e) => {
    const x = e.nativeEvent.contentOffset.x;
    const newIndex = Math.max(0, Math.min(count - 1, Math.round(x / BANNER_WIDTH)));
    indexRef.current = newIndex;
    setActiveIndex(newIndex);
  };

  const handleBannerPress = (banner) => {
    if (banner?.link) {
      navigation.navigate(banner.link);
    } else {
      navigation.navigate('WorkersNearby', { category: 'Labour' });
    }
  };

  // If no banners from admin panel yet, render the default featured hero card from the reference design
  if (!count) {
    return (
      <View style={styles.wrapper}>
        <View style={styles.fallbackCard}>
          <View style={styles.fallbackLeft}>
            <Text style={styles.fallbackTitle}>
              Skilled Labour.{'\n'}Stronger Homes.
            </Text>
            <Text style={styles.fallbackSub}>
              Verified professionals for all your construction needs.
            </Text>
            <TouchableOpacity
              style={styles.fallbackBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('WorkersNearby', { category: 'Labour' })}
            >
              <Text style={styles.fallbackBtnText}>Book Labour →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.fallbackRight}>
            <View style={styles.workerIconBubble}>
              <MaterialCommunityIcons name="account-hard-hat" size={26} color="#D97706" />
            </View>
          </View>

          {/* 3 carousel dots at bottom right */}
          <View style={styles.dotsRowRight}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={BANNER_WIDTH}
        snapToAlignment="start"
        scrollEventThrottle={16}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onScrollBeginDrag={handleTouchStart}
        onScrollEndDrag={handleTouchEnd}
        onMomentumScrollEnd={handleMomentumScrollEnd}
      >
        {banners.map((banner, i) => (
          <TouchableOpacity
            key={banner._id || banner.id || i}
            activeOpacity={0.92}
            onPress={() => handleBannerPress(banner)}
            style={{ width: BANNER_WIDTH }}
          >
            <Image
              source={{ uri: banner.image }}
              style={styles.image}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {count > 1 && (
        <View style={styles.dotsRow}>
          {banners.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 0,
    marginTop: 2,
    marginBottom: 3,
  },
  image: {
    width: '100%',
    height: BANNER_HEIGHT,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
  },
  dotActive: {
    width: 10,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F59E0B',
  },

  // Fallback Hero Card
  fallbackCard: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    backgroundColor: '#FFFDF5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  fallbackLeft: {
    flex: 1.4,
    justifyContent: 'center',
  },
  fallbackTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 16,
    letterSpacing: -0.2,
  },
  fallbackSub: {
    fontSize: 9.5,
    fontWeight: '400',
    color: '#64748B',
    lineHeight: 12,
    marginTop: 2,
    marginBottom: 5,
  },
  fallbackBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#111827',
    borderRadius: 5,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  fallbackBtnText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  fallbackRight: {
    flex: 0.6,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 6,
  },
  workerIconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsRowRight: {
    position: 'absolute',
    right: 8,
    bottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
});

