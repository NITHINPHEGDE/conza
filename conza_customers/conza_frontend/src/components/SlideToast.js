import React, { useEffect, useRef } from 'react';
import { Animated, PanResponder, Text, View, StyleSheet } from 'react-native';

// A slideable toast banner. Swipe up to dismiss, or it auto-hides after 4s.
const SlideToast = ({ visible, message, onDismiss }) => {
  const translateY = useRef(new Animated.Value(-140)).current;
  const hideTimer   = useRef(null);

  const hide = () => {
    Animated.timing(translateY, { toValue: -140, duration: 250, useNativeDriver: true }).start();
  };

  useEffect(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (visible) {
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
      hideTimer.current = setTimeout(() => {
        hide();
        if (onDismiss) onDismiss();
      }, 4000);
    } else {
      hide();
    }
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, message]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6,
      onPanResponderMove: (_, g) => { if (g.dy < 0) translateY.setValue(g.dy); },
      onPanResponderRelease: (_, g) => {
        if (g.dy < -30) {
          Animated.timing(translateY, { toValue: -140, duration: 200, useNativeDriver: true }).start(() => {
            if (onDismiss) onDismiss();
          });
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.wrap, { transform: [{ translateY }] }]}
      {...panResponder.panHandlers}
    >
      <View style={styles.pill}>
        <Text style={styles.emoji}>⚡</Text>
        <Text style={styles.text} numberOfLines={2}>{message}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 54, left: 16, right: 16, zIndex: 999, elevation: 20 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  emoji: { fontSize: 16 },
  text: { color: '#FFF', fontWeight: '700', fontSize: 13, flex: 1 },
});

export default SlideToast;
