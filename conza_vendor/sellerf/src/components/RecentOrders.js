import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, ScrollView, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const COLLAPSED_HEIGHT = 240;
const EXPANDED_HEIGHT  = SCREEN_HEIGHT * 0.58;

const STATUS_META = {
  new:              { color: '#3B82F6', bg: 'rgba(59,130,246,0.10)',  icon: '🆕', label: 'New'              },
  accepted:         { color: '#2E8B57', bg: 'rgba(46,139,87,0.10)',   icon: '✅', label: 'Accepted'         },
  out_for_delivery: { color: '#F97316', bg: 'rgba(249,115,22,0.10)',  icon: '🚚', label: 'Out for Delivery' },
  delivered:        { color: '#2E8B57', bg: 'rgba(46,139,87,0.10)',   icon: '📦', label: 'Delivered'        },
  active:           { color: '#2E8B57', bg: 'rgba(46,139,87,0.10)',   icon: '🔧', label: 'Active'           },
  overdue:          { color: '#E03B3B', bg: 'rgba(224,59,59,0.10)',   icon: '⚠️', label: 'Overdue'          },
  returned:         { color: '#6366F1', bg: 'rgba(99,102,241,0.10)',  icon: '✅', label: 'Returned'         },
  cancelled:        { color: '#E03B3B', bg: 'rgba(224,59,59,0.10)',   icon: '❌', label: 'Cancelled'        },
  pending:          { color: '#F97316', bg: 'rgba(249,115,22,0.10)',  icon: '⏳', label: 'Pending'          },
};

const TYPE_META = {
  material: { icon: '🧱', color: '#F0A500', bg: 'rgba(240,165,0,0.10)', label: 'Material' },
  rental:   { icon: '🏗️', color: '#6366F1', bg: 'rgba(99,102,241,0.10)', label: 'Rental'  },
};

const RecentOrderRow = ({ order, onPress, isLast }) => {
  const status   = order.status || 'pending';
  const s        = STATUS_META[status] || STATUS_META.pending;
  const orderType = order.orderType || (order.type === 'rental' ? 'rental' : 'material');
  const t        = TYPE_META[orderType] || TYPE_META.material;
  const itemName = (order.items && order.items[0]?.title) || order.items?.[0]?.name || 'Item';
  const customer = order.customerName || '';
  const total    = order.total || 0;
  const date     = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
    : order.date || '';

  return (
    <TouchableOpacity
      style={[styles.row, isLast && styles.rowLast]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Left icon */}
      <View style={[styles.rowIcon, { backgroundColor: t.bg }]}>
        <Text style={styles.rowIconText}>{t.icon}</Text>
      </View>

      {/* Middle content */}
      <View style={styles.rowContent}>
        {/* Line 1 — name + amount */}
        <View style={styles.rowLine}>
          <Text style={styles.rowName} numberOfLines={1}>{itemName}</Text>
          <Text style={styles.rowAmount}>₹{total.toLocaleString('en-IN')}</Text>
        </View>

        {/* Line 2 — customer + status badge */}
        <View style={styles.rowLine}>
          <View style={styles.rowCustomerRow}>
            <Text style={styles.rowCustomerIcon}>👤</Text>
            <Text style={styles.rowCustomer} numberOfLines={1}>{customer}</Text>
          </View>
          <View style={[styles.rowStatusBadge, { backgroundColor: s.bg }]}>
            <Text style={[styles.rowStatusText, { color: s.color }]}>{s.icon} {s.label}</Text>
          </View>
        </View>

        {/* Line 3 — type tag + date */}
        <View style={styles.rowLine}>
          <View style={[styles.rowTypeTag, { backgroundColor: t.bg, borderColor: t.color + '40' }]}>
            <Text style={[styles.rowTypeText, { color: t.color }]}>{t.label}</Text>
          </View>
          <Text style={styles.rowDate}>{date}</Text>
        </View>
      </View>

      {/* Chevron */}
      <Text style={styles.rowChevron}>›</Text>
    </TouchableOpacity>
  );
};

const RecentOrders = ({ orders, navigation, mode }) => {
  const [expanded, setExpanded] = useState(false);
  const animHeight = useRef(new Animated.Value(COLLAPSED_HEIGHT)).current;
  const animRotate = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    const toHeight = expanded ? COLLAPSED_HEIGHT : EXPANDED_HEIGHT;
    const toRotate = expanded ? 0 : 1;
    Animated.parallel([
      Animated.spring(animHeight, { toValue: toHeight, useNativeDriver: false, tension: 60, friction: 10 }),
      Animated.timing(animRotate, { toValue: toRotate, duration: 250, useNativeDriver: true }),
    ]).start();
    setExpanded(!expanded);
  };

  const rotate = animRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  const handleOrderPress = (order) => {
    if (!navigation) return;
    const orderType = order.orderType || (mode === 'materials' ? 'material' : 'rental');
    navigation.navigate('Orders', {
      screen: 'OrdersList',
      params: { highlightOrderId: order._id, orderType },
    });
  };

  const handleViewAll = () => {
    if (navigation) navigation.navigate('Orders');
  };

  const count = orders.length;

  return (
    <View style={styles.container}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Recent Orders</Text>
          {count > 0 && (
            <View style={styles.countPill}>
              <Text style={styles.countText}>{count}</Text>
            </View>
          )}
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.viewAllBtn} onPress={handleViewAll} activeOpacity={0.8}>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.viewAllGrad}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.expandBtn} onPress={toggle} activeOpacity={0.8}>
            <Animated.Text style={[styles.arrow, { transform: [{ rotate }] }]}>⌄</Animated.Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Divider ── */}
      <View style={styles.headerDivider} />

      {/* ── Body ── */}
      <Animated.View style={[styles.body, { height: animHeight }]}>
        <ScrollView scrollEnabled={expanded} showsVerticalScrollIndicator={false} nestedScrollEnabled>
          {count === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyTitle}>No recent orders</Text>
              <Text style={styles.emptySubtitle}>New orders will appear here</Text>
            </View>
          ) : (
            orders.map((order, idx) => (
              <RecentOrderRow
                key={order._id || order.id || idx}
                order={order}
                isLast={idx === orders.length - 1}
                onPress={() => handleOrderPress(order)}
              />
            ))
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom:     24,
    backgroundColor:  colors.surface,
    borderRadius:     22,
    paddingTop:       16,
    paddingHorizontal: 16,
    paddingBottom:    4,
    elevation:        4,
    shadowColor:      '#C8C4B0',
    shadowOffset:     { width: 0, height: 3 },
    shadowOpacity:    0.10,
    shadowRadius:     10,
    borderWidth:      1,
    borderColor:      colors.border,
  },

  // Header
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerLeft:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerRight:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title:        { fontSize: 15, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.1 },
  countPill:    { backgroundColor: colors.accentAmberSoft, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(240,165,0,0.25)' },
  countText:    { fontSize: 11, fontWeight: '800', color: colors.accentAmber },
  viewAllBtn:   { borderRadius: 10, overflow: 'hidden' },
  viewAllGrad:  { paddingHorizontal: 12, paddingVertical: 6 },
  viewAllText:  { fontSize: 11, fontWeight: '800', color: '#FFF' },
  expandBtn:    { width: 30, height: 30, borderRadius: 9, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  arrow:        { fontSize: 17, color: colors.textSecondary, fontWeight: '900', lineHeight: 21 },
  headerDivider:{ height: 1, backgroundColor: colors.borderLight, marginBottom: 4 },

  // Body
  body: { overflow: 'hidden' },

  // Row
  row: {
    flexDirection:    'row',
    alignItems:       'center',
    paddingVertical:  13,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap:              12,
  },
  rowLast: { borderBottomWidth: 0 },

  rowIcon:     { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowIconText: { fontSize: 22 },

  rowContent: { flex: 1, gap: 5 },

  rowLine:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowName:       { fontSize: 13, fontWeight: '700', color: colors.textPrimary, flex: 1, marginRight: 8 },
  rowAmount:     { fontSize: 14, fontWeight: '900', color: colors.textPrimary },

  rowCustomerRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  rowCustomerIcon: { fontSize: 11, color: colors.textMuted },
  rowCustomer:     { fontSize: 12, color: colors.textSecondary, fontWeight: '500', flex: 1 },

  rowStatusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, flexShrink: 0 },
  rowStatusText:  { fontSize: 10, fontWeight: '700' },

  rowTypeTag:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7, borderWidth: 1 },
  rowTypeText: { fontSize: 10, fontWeight: '700' },
  rowDate:     { fontSize: 11, color: colors.textMuted, fontWeight: '500' },

  rowChevron: { fontSize: 20, color: colors.textMuted, fontWeight: '300', marginLeft: 2 },

  // Empty
  empty:        { alignItems: 'center', paddingVertical: 36, gap: 6 },
  emptyIcon:    { fontSize: 36, marginBottom: 4 },
  emptyTitle:   { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  emptySubtitle:{ fontSize: 12, color: colors.textMuted, fontWeight: '500' },
});

export default RecentOrders;