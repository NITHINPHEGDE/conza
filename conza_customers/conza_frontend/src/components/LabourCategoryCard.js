import React, { useCallback, useMemo, useState, useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  Animated,
  StyleSheet,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

// ── Diagonal sweep skeleton ────────────────────────────────────────────────────
const ImageSkeleton = () => {
  const shimmer = useRef(new Animated.Value(-1)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1600,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    ).start();
  }, [shimmer]);

  const translateX = shimmer.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-120%', '120%'],
  });

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#1a1a1a' }]}>
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            transform: [{ translateX }, { skewX: '-15deg' }],
            backgroundColor: 'rgba(255,255,255,0.08)',
          },
        ]}
      />
    </View>
  );
};

// ── Image with fade-in ─────────────────────────────────────────────────────────
const FadingImage = ({ uri }) => {
  const [loaded, setLoaded] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const onLoad = useCallback(() => {
    setLoaded(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <>
      {!loaded && <ImageSkeleton />}
      <Animated.Image
        source={{ uri }}
        style={[styles.categoryImage, { opacity: fadeAnim }]}
        onLoad={onLoad}
        resizeMode="cover"
      />
    </>
  );
};

// ── Pulsing availability dot ───────────────────────────────────────────────────
const LiveDot = () => {
  const pulse = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 3.2] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

  return (
    <View style={styles.dotWrap}>
      <Animated.View style={[styles.pulseRing, { transform: [{ scale }], opacity }]} />
      <View style={styles.liveDot} />
    </View>
  );
};

// ── Category Card ──────────────────────────────────────────────────────────────
const LabourCategoryCard = React.memo(({ item, isSelected, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const selectAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  const handlePress = useCallback(() => {
    onPress && onPress(item);
  }, [onPress, item]);

  React.useEffect(() => {
    Animated.timing(selectAnim, {
      toValue: isSelected ? 1 : 0,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [isSelected, selectAnim]);

  const gradientColors = useMemo(() => [colors.gradientStart, colors.gradientEnd], []);
  const cardStyle = useMemo(() => [styles.card, isSelected && styles.cardSelected], [isSelected]);
  const hasPhoto = !!item.image;

  return (
    <Animated.View style={{ flex: 1, marginBottom: 8, transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={cardStyle}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.92}
      >
        {/* ── Background ── */}
        {hasPhoto ? (
          <FadingImage uri={item.image} />
        ) : (
          <LinearGradient
            colors={['#2a2a2a', '#1a1a1a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          >
            <View style={styles.emojiWrap}>
              <View style={styles.emojiOrb}>
                <Text style={styles.emoji}>{item.emoji}</Text>
              </View>
            </View>
          </LinearGradient>
        )}

        {/* ── Top vignette ── */}
        {hasPhoto && (
          <LinearGradient
            colors={['rgba(0,0,0,0.35)', 'transparent']}
            locations={[0, 0.5]}
            style={styles.topVignette}
            pointerEvents="none"
          />
        )}

        {/* ── Bottom panel ── */}
        {hasPhoto && (
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.55)']}
            locations={[0, 0.45, 1]}
            style={styles.bottomPanel}
            pointerEvents="none"
          />
        )}

        {/* ── Selection glow ── */}
        {isSelected && (
          <>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.selectGlow,
                {
                  opacity: selectAnim,
                  transform: [
                    {
                      scale: selectAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.92, 1],
                      }),
                    },
                  ],
                },
              ]}
            />
            <View style={styles.selectRing} pointerEvents="none" />
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.checkBadge}
            >
              <Text style={styles.checkBadgeText}>✓</Text>
            </LinearGradient>
          </>
        )}

        {/* ── Floating rating chip ── */}
        <View style={styles.floatingRating}>
          <Text style={styles.ratingText}>★ {item.rating}</Text>
        </View>

        {/* ── Footer with HIGHLIGHTED text ── */}
        <View style={styles.footer}>
          {/* Label with frosted highlight backdrop */}
          <View style={styles.labelHighlight}>
            <Text
              style={[styles.label, hasPhoto ? styles.labelOnPhoto : styles.labelOnTint]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
          </View>

          {/* Availability chip */}
          <View style={styles.metaRow}>
            <View style={styles.availabilityChip}>
              <LiveDot />
              <Text
                style={[styles.metaText, hasPhoto ? styles.metaTextOnPhoto : styles.metaTextOnTint]}
                numberOfLines={1}
              >
                {item.available} free
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  // ── Card ──
  card: {
    aspectRatio: 0.88,
    borderRadius: 16,
    backgroundColor: '#1e1e1e',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 28,
    elevation: 10,
  },
  cardSelected: {
    shadowColor: colors.accentYellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 14,
  },

  // ── Image ──
  categoryImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '112%',
    height: '126%',
    resizeMode: 'cover',
  },

  // ── Emoji fallback ──
  emojiWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiOrb: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 20,
  },

  // ── Vignettes ──
  topVignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '35%',
  },
  bottomPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
  },

  // ── Selection ──
  selectGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.accentYellow,
    backgroundColor: 'rgba(255, 193, 7, 0.12)',
  },
  selectRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: colors.accentYellow,
  },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 8,
  },
  checkBadgeText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.textPrimary,
    includeFontPadding: false,
  },

  // ── Floating rating ──
  floatingRating: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(255, 215, 0, 0.18)',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.35)',
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  // ── Footer ──
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 7,
    paddingBottom: 7,
    paddingTop: 4,
  },

  // ── HIGHLIGHTED LABEL ──
  labelHighlight: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  labelOnPhoto: {
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  labelOnTint: {
    color: '#f0f0f0',
  },

  // ── Meta ──
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    alignSelf: 'flex-start',
  },
  metaText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  metaTextOnPhoto: {
    color: '#34D399',
  },
  metaTextOnTint: {
    color: '#34D399',
  },

  // ── Live dot ──
  dotWrap: {
    position: 'relative',
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#34D399',
  },
  pulseRing: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#34D399',
  },
});

export default LabourCategoryCard;