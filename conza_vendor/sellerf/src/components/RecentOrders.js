import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, ScrollView, Dimensions,
} from 'react-native';
import { colors } from '../theme/colors';
import OrderCard from './OrderCard';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const COLLAPSED_HEIGHT = 160;
const EXPANDED_HEIGHT  = SCREEN_HEIGHT * 0.52;

const RecentOrders = ({ orders }) => {
  const [expanded, setExpanded]   = useState(false);
  const animHeight  = useRef(new Animated.Value(COLLAPSED_HEIGHT)).current;
  const animRotate  = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    const toHeight = expanded ? COLLAPSED_HEIGHT : EXPANDED_HEIGHT;
    const toRotate = expanded ? 0 : 1;

    Animated.parallel([
      Animated.spring(animHeight, {
        toValue:         toHeight,
        useNativeDriver: false,
        tension:         60,
        friction:        10,
      }),
      Animated.timing(animRotate, {
        toValue:         toRotate,
        duration:        250,
        useNativeDriver: true,
      }),
    ]).start();

    setExpanded(!expanded);
  };

  const rotate = animRotate.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Recent Orders</Text>
        <TouchableOpacity style={styles.expandBtn} onPress={toggle} activeOpacity={0.8}>
          <Animated.Text style={[styles.arrow, { transform: [{ rotate }] }]}>
            ⌄
          </Animated.Text>
        </TouchableOpacity>
      </View>

      {/* Animated body */}
      <Animated.View style={[styles.body, { height: animHeight }]}>
        <ScrollView
          scrollEnabled={expanded}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {orders.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No orders yet</Text>
            </View>
          ) : (
            orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom:     20,
    backgroundColor:  colors.surface,
    borderRadius:     18,
    padding:          16,
    elevation:         2,
    shadowColor:       colors.cardShadow,
    shadowOffset:      { width: 0, height: 2 },
    shadowOpacity:     0.08,
    shadowRadius:      8,
  },
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title:     { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  expandBtn: {
    width:           32,
    height:          32,
    borderRadius:    10,
    backgroundColor: colors.surfaceElevated,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1,
    borderColor:     colors.border,
  },
  arrow:     { fontSize: 18, color: colors.textSecondary, fontWeight: '900', lineHeight: 22 },
  body:      { overflow: 'hidden' },
  empty:     { alignItems: 'center', paddingVertical: 30 },
  emptyText: { color: colors.textMuted, fontWeight: '600' },
});

export default RecentOrders;