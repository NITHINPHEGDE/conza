import React, { useCallback, useMemo, useState, useRef } from 'react';
import { TouchableOpacity, Text, View, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

// ── Shimmer skeleton shown while the category image is loading ─────────────────
const ImageSkeleton = () => {
  const shimmer = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });

  return <Animated.View style={[styles.imageSkeleton, { opacity }]} />;
};

// ── Image with fade-in on load ─────────────────────────────────────────────────
const FadingImage = ({ uri }) => {
  const [loaded, setLoaded] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const onLoad = useCallback(() => {
    setLoaded(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
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

// ── Category Card ──────────────────────────────────────────────────────────────
// Full-bleed photo card: the photo IS the card (no inset/padding), with the
// label + live stats overlaid on a bottom scrim — same pattern used by
// service-marketplace apps (Urban Company, Housejoy) so a grid of these
// reads instantly as "browse a pro", not as a generic icon tile.
const LabourCategoryCard = React.memo(({ item, isSelected, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
  }, [scaleAnim]);

  const handlePress = useCallback(() => {
    onPress && onPress(item);
  }, [onPress, item]);

  const gradientColors = useMemo(() => [colors.gradientStart, colors.gradientEnd], []);
  const cardStyle = useMemo(() => [styles.card, isSelected && styles.cardSelected], [isSelected]);

  const hasPhoto = !!item.image;

  return (
    <Animated.View style={{ width: '47%', margin: 6, transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={cardStyle}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.92}
      >
        {/* ── Background: photo fills the card edge-to-edge, or an emoji sits on a soft tinted field ── */}
        {hasPhoto ? (
          <FadingImage uri={item.image} />
        ) : (
          <LinearGradient
            colors={[colors.surfaceElevated, colors.borderLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          >
            <View style={styles.emojiWrap}>
              <Text style={styles.emoji}>{item.emoji}</Text>
            </View>
          </LinearGradient>
        )}

        {/* ── Bottom scrim: only needed to keep white overlay text legible on a photo ── */}
        {hasPhoto && (
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.72)']}
            locations={[0, 0.85]}
            style={styles.scrim}
            pointerEvents="none"
          />
        )}

        {/* ── Selected ring + check badge ── */}
        {isSelected && (
          <>
            <View style={styles.selectedRing} pointerEvents="none" />
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

        {/* ── Overlaid label + live stats ── */}
        <View style={styles.footer}>
          <Text
            style={[styles.label, hasPhoto ? styles.labelOnPhoto : styles.labelOnTint]}
            numberOfLines={1}
          >
            {item.label}
          </Text>

          <View style={styles.metaRow}>
            <Text style={[styles.metaText, hasPhoto ? styles.metaTextOnPhoto : styles.metaTextOnTint]}>
              ⭐ {item.rating}
            </Text>
            <View style={[styles.metaDivider, hasPhoto ? styles.metaDividerOnPhoto : styles.metaDividerOnTint]} />
            <View style={styles.availabilityGroup}>
              <View style={styles.liveDot} />
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
  card: {
    aspectRatio: 0.85,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  cardSelected: {
    borderColor: colors.accentYellow,
    shadowColor: colors.accentAmber,
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },

  // ── Photo: identical sizing/crop logic to before — just no longer inset by padding ──
  categoryImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    // Taller than the box on purpose: resizeMode="cover" fits/crops this
    // oversized image centered within itself, then the extra bottom portion
    // gets clipped by the card's overflow:hidden — since the image is
    // pinned to top:0, the top (cap/face) is what always stays visible and
    // any cropping happens at the bottom instead.
    height: '135%',
    resizeMode: 'cover',
  },
  imageSkeleton: {
    ...StyleSheet.absoluteFillObject,
  },

  emojiWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 36, // keeps emoji visually centered above the footer text
  },
  emoji: {
    fontSize: 30,
  },

  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '58%',
  },

  selectedRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: colors.accentYellow,
  },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 4,
  },
  checkBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textPrimary,
  },

  // ── Overlaid footer content ──
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.1,
    marginBottom: 4,
  },
  labelOnPhoto: {
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  labelOnTint: {
    color: colors.textPrimary,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 10,
    fontWeight: '700',
  },
  metaTextOnPhoto: {
    color: 'rgba(255,255,255,0.92)',
  },
  metaTextOnTint: {
    color: colors.textSecondary,
  },
  metaDivider: {
    width: 1,
    height: 9,
    marginHorizontal: 6,
  },
  metaDividerOnPhoto: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  metaDividerOnTint: {
    backgroundColor: colors.borderLight,
  },
  availabilityGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#4ADE80',
    marginRight: 4,
  },
});

export default LabourCategoryCard;