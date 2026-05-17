import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import useModeStore from '../store/useModeStore';
import { colors } from '../theme/colors';

const TOGGLE_WIDTH  = 110;
const TOGGLE_HEIGHT = 32;
const PILL_WIDTH    = 52;
const PILL_HEIGHT   = 24;
const PILL_MARGIN   = 4;

const ModeToggle = () => {
  const { mode, setMode } = useModeStore();
  const isMaterials = mode === 'materials';
  const animX = useRef(new Animated.Value(isMaterials ? PILL_MARGIN : TOGGLE_WIDTH - PILL_WIDTH - PILL_MARGIN)).current;

  useEffect(() => {
    Animated.spring(animX, {
      toValue:         isMaterials ? PILL_MARGIN : TOGGLE_WIDTH - PILL_WIDTH - PILL_MARGIN,
      useNativeDriver: false,
      tension:         80,
      friction:        10,
    }).start();
  }, [mode]);

  const handleToggle = () => {
    setMode(isMaterials ? 'rental' : 'materials');
  };

  return (
    <TouchableOpacity onPress={handleToggle} activeOpacity={0.9}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.track}
      >
        {/* Background labels — always visible */}
        <View style={styles.labelsRow}>
          <View style={styles.labelSlot}>
            <Text style={styles.emoji}>🧱</Text>
          </View>
          <View style={styles.labelSlot}>
            <Text style={styles.emoji}>🏗️</Text>
          </View>
        </View>

        {/* Animated sliding pill */}
        <Animated.View style={[styles.pill, { left: animX }]}>
          <Text style={styles.pillEmoji}>
            {isMaterials ? '🧱' : '🏗️'}
          </Text>
          <Text style={styles.pillLabel}>
            {isMaterials ? 'Sale' : 'Rent'}
          </Text>
        </Animated.View>

      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  track: {
    width:        TOGGLE_WIDTH,
    height:       TOGGLE_HEIGHT,
    borderRadius: TOGGLE_HEIGHT / 2,
    justifyContent: 'center',
    overflow:     'hidden',
  },
  labelsRow: {
    position:       'absolute',
    left:           0,
    right:          0,
    flexDirection:  'row',
    paddingHorizontal: PILL_MARGIN,
  },
  labelSlot: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 14,
    opacity:  0.45,
  },
  pill: {
    position:        'absolute',
    width:           PILL_WIDTH,
    height:          PILL_HEIGHT,
    borderRadius:    PILL_HEIGHT / 2,
    backgroundColor: 'rgba(255,255,255,0.92)',
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             3,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.15,
    shadowRadius:    3,
    elevation:       3,
  },
  pillEmoji: { fontSize: 12 },
  pillLabel: {
    fontSize:   10,
    fontWeight: '800',
    color:      colors.accentAmber,
  },
});

export default ModeToggle;