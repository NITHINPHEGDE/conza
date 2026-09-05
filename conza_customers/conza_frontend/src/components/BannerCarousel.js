import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, Image, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { colors } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const H_PADDING = 14; // matches the search bar's horizontal margin on the Labour tab
const BANNER_WIDTH = SCREEN_WIDTH - H_PADDING * 2;
const BANNER_HEIGHT = Math.round(BANNER_WIDTH * 0.42);
const AUTO_SLIDE_INTERVAL = 2000;

export default function BannerCarousel({ banners }) {
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

  // Pause auto-slide the moment the user touches the banner (covers press-and-hold,
  // not just an active drag), and resume once they lift their finger.
  const handleTouchStart = () => { isPausedRef.current = true; };
  const handleTouchEnd = () => { isPausedRef.current = false; };

  const handleMomentumScrollEnd = (e) => {
    const x = e.nativeEvent.contentOffset.x;
    const newIndex = Math.max(0, Math.min(count - 1, Math.round(x / BANNER_WIDTH)));
    indexRef.current = newIndex;
    setActiveIndex(newIndex);
  };

  if (!count) return null;

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
          <View key={banner._id || banner.id || i} style={{ width: BANNER_WIDTH }}>
            <Image source={{ uri: banner.image }} style={styles.image} resizeMode="cover" />
          </View>
        ))}
      </ScrollView>

      {count > 1 && (
        <View style={styles.dotsRow}>
          {banners.map((_, i) => (
            <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 4 },
  image: {
    width: '100%',
    height: BANNER_HEIGHT,
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 16,
    backgroundColor: colors.accentAmber,
  },
});
