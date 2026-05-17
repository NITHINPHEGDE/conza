import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';

const STATUS_CONFIG = {
  delivered:  { color: colors.green,  bg: colors.greenSoft,  label: 'Delivered',  icon: '✅' },
  pending:    { color: colors.orange, bg: colors.orangeSoft, label: 'Pending',    icon: '⏳' },
  processing: { color: colors.blue,   bg: colors.blueSoft,   label: 'Processing', icon: '⚙️' },
  cancelled:  { color: colors.red,    bg: colors.redSoft,    label: 'Cancelled',  icon: '❌' },
};

const PAYMENT_CONFIG = {
  paid:     { color: colors.green,  label: 'Paid'     },
  pending:  { color: colors.orange, label: 'Pending'  },
  refunded: { color: colors.blue,   label: 'Refunded' },
};

const OrderCard = ({ order }) => {
  const s  = STATUS_CONFIG[order.status]  || STATUS_CONFIG.pending;
  const p  = PAYMENT_CONFIG[order.paymentStatus] || PAYMENT_CONFIG.pending;

  return (
    <View style={styles.card}>
      {/* Left image/icon */}
      <View style={[styles.thumb, { backgroundColor: order.type === 'rental' ? colors.indigoSoft : colors.accentAmberSoft }]}>
        <Text style={styles.thumbIcon}>{order.type === 'rental' ? '🏗️' : '🧱'}</Text>
      </View>

      {/* Main content */}
      <View style={styles.body}>
        {/* Row 1 — product + amount */}
        <View style={styles.row}>
          <Text style={styles.product} numberOfLines={1}>{order.product}</Text>
          <Text style={styles.amount}>₹{order.amount.toLocaleString('en-IN')}</Text>
        </View>

        {/* Row 2 — customer + status */}
        <View style={styles.row}>
          <Text style={styles.customer}>👤 {order.customerName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
            <Text style={[styles.statusText, { color: s.color }]}>{s.icon} {s.label}</Text>
          </View>
        </View>

        {/* Row 3 — location + type tag */}
        <View style={styles.row}>
          <Text style={styles.meta} numberOfLines={1}>📍 {order.location}</Text>
          <View style={[styles.typeTag, { backgroundColor: order.type === 'rental' ? colors.indigoSoft : colors.accentAmberSoft }]}>
            <Text style={[styles.typeText, { color: order.type === 'rental' ? colors.indigo : colors.accentAmber }]}>
              {order.type === 'rental' ? 'Rental' : 'Material'}
            </Text>
          </View>
        </View>

        {/* Row 4 — date + payment + qty */}
        <View style={styles.row}>
          <Text style={styles.meta}>🕐 {order.date}</Text>
          <View style={styles.rightMeta}>
            <Text style={[styles.payment, { color: p.color }]}>{p.label}</Text>
            <Text style={styles.qty}>  ×{order.quantity}</Text>
          </View>
        </View>

        {/* Row 5 — ID + action */}
        <View style={styles.row}>
          <Text style={styles.orderId}>#{order.id}</Text>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionText}>View →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection:   'row',
    backgroundColor: colors.surface,
    borderRadius:    16,
    padding:         12,
    marginBottom:    10,
    elevation:        2,
    shadowColor:      colors.cardShadow,
    shadowOffset:     { width: 0, height: 2 },
    shadowOpacity:    0.07,
    shadowRadius:     6,
    borderWidth:      1,
    borderColor:      colors.border,
  },
  thumb: {
    width:          52,
    height:         52,
    borderRadius:   14,
    alignItems:     'center',
    justifyContent: 'center',
    marginRight:    12,
    alignSelf:      'center',
  },
  thumbIcon:   { fontSize: 24 },
  body:        { flex: 1, gap: 5 },
  row:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  product:     { fontSize: 13, fontWeight: '700', color: colors.textPrimary, flex: 1, marginRight: 8 },
  amount:      { fontSize: 14, fontWeight: '900', color: colors.textPrimary },
  customer:    { fontSize: 11, color: colors.textSecondary, fontWeight: '500' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  statusText:  { fontSize: 10, fontWeight: '700' },
  meta:        { fontSize: 10, color: colors.textMuted, fontWeight: '500', flex: 1 },
  typeTag:     { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  typeText:    { fontSize: 10, fontWeight: '700' },
  rightMeta:   { flexDirection: 'row', alignItems: 'center' },
  payment:     { fontSize: 10, fontWeight: '700' },
  qty:         { fontSize: 10, color: colors.textMuted, fontWeight: '600' },
  orderId:     { fontSize: 10, color: colors.textMuted, fontWeight: '500' },
  actionBtn:   { backgroundColor: colors.indigoSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  actionText:  { fontSize: 11, color: colors.indigo, fontWeight: '700' },
});

export default OrderCard;