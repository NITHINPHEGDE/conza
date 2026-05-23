import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MATERIAL_STATUS_CONFIG, RENTAL_STATUS_CONFIG } from './OrdersScreen';
import { colors } from '../theme/colors';
import useVendorStore from '../store/useVendorStore';

const PAYMENT_COLOR = {
  paid:     colors.green,
  pending:  colors.orange,
  refunded: colors.blue,
};

const DEPOSIT_COLOR = {
  collected: colors.green,
  pending:   colors.orange,
  refunded:  colors.blue,
};

// ── Reusable components ───────────────────────────────────────────────────────
const DetailRow = ({ label, value, valueColor }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={[styles.detailValue, valueColor && { color: valueColor }]}>{value}</Text>
  </View>
);

const SectionCard = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const TimelineItem = ({ icon, label, time, done, last }) => (
  <View style={tlStyles.row}>
    <View style={tlStyles.left}>
      <View style={[tlStyles.dot, done && tlStyles.dotDone]}>
        <Text style={tlStyles.dotIcon}>{done ? '✓' : '·'}</Text>
      </View>
      {!last && <View style={[tlStyles.line, done && tlStyles.lineDone]} />}
    </View>
    <View style={tlStyles.content}>
      <Text style={[tlStyles.label, done && tlStyles.labelDone]}>{icon}  {label}</Text>
      <Text style={tlStyles.time}>{time}</Text>
    </View>
  </View>
);

// ── Material Detail ───────────────────────────────────────────────────────────
const MaterialDetail = ({ order, onAccept, onReject, onStatusChange }) => {
  const s = MATERIAL_STATUS_CONFIG[order.status] || MATERIAL_STATUS_CONFIG.new;

  return (
    <>
      <SectionCard title="📋 Order Summary">
        <DetailRow label="Order ID"       value={order.id} />
        <DetailRow label="Date & Time"    value={`${order.date} · ${order.time}`} />
        <DetailRow label="Payment Method" value={order.paymentMethod} />
        <DetailRow
          label="Payment Status"
          value={order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
          valueColor={PAYMENT_COLOR[order.paymentStatus]}
        />
      </SectionCard>

      <SectionCard title="👤 Customer Information">
        <DetailRow label="Name"  value={order.customerName}  />
        <DetailRow label="Phone" value={order.customerPhone} />
      </SectionCard>

      <SectionCard title="📍 Delivery Address">
        <Text style={styles.addressText}>{order.customerAddress}</Text>
      </SectionCard>

      <SectionCard title="🧱 Ordered Items">
        <View style={styles.tableHeader}>
          <Text style={[styles.colHeader, { flex: 3 }]}>Item</Text>
          <Text style={[styles.colHeader, { flex: 1, textAlign: 'center' }]}>Qty</Text>
          <Text style={[styles.colHeader, { flex: 2, textAlign: 'right' }]}>Price</Text>
          <Text style={[styles.colHeader, { flex: 2, textAlign: 'right' }]}>Total</Text>
        </View>
        {order.items.map((item, index) => (
          <View key={item.id} style={[styles.itemRow, index === order.items.length - 1 && { borderBottomWidth: 0 }]}>
            <View style={{ flex: 3 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemUnit}>per {item.unit}</Text>
            </View>
            <Text style={[styles.itemQty,   { flex: 1, textAlign: 'center' }]}>{item.qty}</Text>
            <Text style={[styles.itemPrice, { flex: 2, textAlign: 'right'  }]}>₹{item.price.toLocaleString('en-IN')}</Text>
            <Text style={[styles.itemTotal, { flex: 2, textAlign: 'right'  }]}>₹{((item.qty || 0) * (item.price || 0)).toLocaleString('en-IN')}</Text>
          </View>
        ))}
        <View style={styles.totalsBlock}>
          <DetailRow label="Subtotal"        value={`₹${(order.subtotal || 0).toLocaleString('en-IN')}`} />
          <DetailRow label="Delivery Charge" value={(order.deliveryCharge ?? 0) === 0 ? 'FREE' : `₹${order.deliveryCharge}`} />
          <View style={[styles.detailRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalValue}>₹{(order.total || 0).toLocaleString('en-IN')}</Text>
          </View>
        </View>
      </SectionCard>

      <SectionCard title="🕐 Order Timeline">
        <TimelineItem icon="🆕" label="Order Placed"     time={`${order.date} · ${order.time}`} done />
        <TimelineItem icon="✅" label="Order Accepted"   time="—" done={['accepted','out_for_delivery','delivered'].includes(order.status)} />
        <TimelineItem icon="🚚" label="Out for Delivery" time="—" done={['out_for_delivery','delivered'].includes(order.status)} />
        <TimelineItem icon="📦" label="Delivered"        time="—" done={order.status === 'delivered'} last />
      </SectionCard>

      {/* Action buttons */}
      {order.status === 'new' && (
        <View style={styles.buttonsRow}>
          <TouchableOpacity style={styles.rejectBtn} onPress={onReject} activeOpacity={0.8}>
            <Text style={styles.rejectBtnText}>✕  Reject Order</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acceptBtnWrap} onPress={onAccept} activeOpacity={0.85}>
            <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.acceptBtn}>
              <Text style={styles.acceptBtnText}>✓  Accept Order</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
      {order.status === 'accepted' && (
        <TouchableOpacity style={styles.fullBtnWrap} onPress={() => onStatusChange('out_for_delivery')} activeOpacity={0.85}>
          <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.fullBtn}>
            <Text style={styles.fullBtnText}>🚚  Mark as Out for Delivery</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
      {order.status === 'out_for_delivery' && (
        <TouchableOpacity style={styles.fullBtnWrap} onPress={() => onStatusChange('delivered')} activeOpacity={0.85}>
          <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.fullBtn}>
            <Text style={styles.fullBtnText}>📦  Mark as Delivered</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </>
  );
};

// ── Rental Detail ─────────────────────────────────────────────────────────────
const RentalDetail = ({ order, onAccept, onReject, onStatusChange }) => {
  const s = RENTAL_STATUS_CONFIG[order.status] || RENTAL_STATUS_CONFIG.new;

  return (
    <>
      {/* Overdue alert */}
      {order.status === 'overdue' && (
        <View style={styles.overdueAlert}>
          <Text style={styles.overdueAlertText}>
            ⚠️ This rental is overdue. Equipment was due on {order.endDate}.
          </Text>
        </View>
      )}

      <SectionCard title="📋 Rental Summary">
        <DetailRow label="Rental ID"      value={order.id} />
        <DetailRow label="Requested On"   value={`${order.date} · ${order.time}`} />
        <DetailRow label="Payment Method" value={order.paymentMethod} />
        <DetailRow
          label="Payment Status"
          value={order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
          valueColor={PAYMENT_COLOR[order.paymentStatus]}
        />
      </SectionCard>

      <SectionCard title="👤 Customer Information">
        <DetailRow label="Name"    value={order.customerName}  />
        <DetailRow label="Phone"   value={order.customerPhone} />
      </SectionCard>

      <SectionCard title="📍 Delivery Address">
        <Text style={styles.addressText}>{order.customerAddress}</Text>
      </SectionCard>

      {/* Rental period card */}
      <SectionCard title="📅 Rental Period">
        <View style={styles.rentalPeriodGrid}>
          <View style={styles.rentalPeriodItem}>
            <Text style={styles.rentalPeriodLabel}>Start Date</Text>
            <Text style={styles.rentalPeriodValue}>{order.startDate}</Text>
          </View>
          <View style={styles.rentalPeriodItem}>
            <Text style={styles.rentalPeriodLabel}>End Date</Text>
            <Text style={styles.rentalPeriodValue}>{order.endDate}</Text>
          </View>
          <View style={styles.rentalPeriodItem}>
            <Text style={styles.rentalPeriodLabel}>Duration</Text>
            <Text style={[styles.rentalPeriodValue, { color: colors.accentAmber }]}>
              {order.durationDays} Days
            </Text>
          </View>
        </View>
      </SectionCard>

      {/* Deposit card */}
      <SectionCard title="🔐 Security Deposit">
        <DetailRow label="Deposit Amount" value={`₹${(order.depositAmount || 0).toLocaleString('en-IN')}`} />
        <DetailRow
          label="Deposit Status"
          value={order.depositStatus.charAt(0).toUpperCase() + order.depositStatus.slice(1)}
          valueColor={DEPOSIT_COLOR[order.depositStatus]}
        />
      </SectionCard>

      {/* Rental items */}
      <SectionCard title="🏗️ Rented Equipment">
        <View style={styles.tableHeader}>
          <Text style={[styles.colHeader, { flex: 3 }]}>Equipment</Text>
          <Text style={[styles.colHeader, { flex: 1, textAlign: 'center' }]}>Qty</Text>
          <Text style={[styles.colHeader, { flex: 2, textAlign: 'right' }]}>Rate/Day</Text>
          <Text style={[styles.colHeader, { flex: 2, textAlign: 'right' }]}>Total</Text>
        </View>
        {order.items.map((item, index) => (
          <View key={item.id} style={[styles.itemRow, index === order.items.length - 1 && { borderBottomWidth: 0 }]}>
            <View style={{ flex: 3 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemUnit}>{item.days} days · per {item.unit}</Text>
            </View>
            <Text style={[styles.itemQty,   { flex: 1, textAlign: 'center' }]}>{item.qty}</Text>
            <Text style={[styles.itemPrice, { flex: 2, textAlign: 'right'  }]}>₹{item.pricePerDay.toLocaleString('en-IN')}</Text>
            <Text style={[styles.itemTotal, { flex: 2, textAlign: 'right'  }]}>₹{((item.qty || 0) * (item.pricePerDay || 0) * (item.days || 0)).toLocaleString('en-IN')}</Text>
          </View>
        ))}
        <View style={styles.totalsBlock}>
          <DetailRow label="Subtotal"        value={`₹${(order.subtotal || 0).toLocaleString('en-IN')}`} />
          <DetailRow label="Delivery Charge" value={(order.deliveryCharge ?? 0) === 0 ? 'FREE' : `₹${order.deliveryCharge}`} />
          <DetailRow label="Security Deposit" value={`₹${(order.depositAmount || 0).toLocaleString('en-IN')} (refundable)`} />
          <View style={[styles.detailRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalValue}>₹{(order.total || 0).toLocaleString('en-IN')}</Text>
          </View>
        </View>
      </SectionCard>

      {/* Rental timeline */}
      <SectionCard title="🕐 Rental Timeline">
        <TimelineItem icon="🆕" label="Request Placed"      time={`${order.date} · ${order.time}`} done />
        <TimelineItem icon="✅" label="Request Accepted"    time="—" done={['active','overdue','returned'].includes(order.status)} />
        <TimelineItem icon="🚚" label="Equipment Delivered" time={order.startDate} done={['active','overdue','returned'].includes(order.status)} />
        <TimelineItem icon="🔧" label="Rental Active"       time={`Until ${order.endDate}`} done={['active','overdue','returned'].includes(order.status)} />
        <TimelineItem icon="📦" label="Equipment Returned"  time="—" done={order.status === 'returned'} last />
      </SectionCard>

      {/* Action buttons */}
      {order.status === 'new' && (
        <View style={styles.buttonsRow}>
          <TouchableOpacity style={styles.rejectBtn} onPress={onReject} activeOpacity={0.8}>
            <Text style={styles.rejectBtnText}>✕  Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acceptBtnWrap} onPress={onAccept} activeOpacity={0.85}>
            <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.acceptBtn}>
              <Text style={styles.acceptBtnText}>✓  Accept Rental</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
      {order.status === 'active' && (
        <TouchableOpacity style={styles.fullBtnWrap} onPress={() => onStatusChange('returned')} activeOpacity={0.85}>
          <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.fullBtn}>
            <Text style={styles.fullBtnText}>📦  Mark as Returned</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
      {order.status === 'overdue' && (
        <View style={styles.buttonsRow}>
          <TouchableOpacity style={[styles.rejectBtn, { borderColor: colors.orange, backgroundColor: colors.orangeSoft }]} activeOpacity={0.8}>
            <Text style={[styles.rejectBtnText, { color: colors.orange }]}>📞  Call Customer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acceptBtnWrap} onPress={() => onStatusChange('returned')} activeOpacity={0.85}>
            <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.acceptBtn}>
              <Text style={styles.acceptBtnText}>📦  Mark Returned</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
const OrderDetailScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const [order, setOrder] = useState(route.params.order);

  if (!order) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Order not found</Text>
      </View>
    );
  }

  const { mode }          = route.params;
  const isRental          = mode === 'rental';

  const statusConfig = isRental ? RENTAL_STATUS_CONFIG : MATERIAL_STATUS_CONFIG;
  const s = statusConfig[order.status] || statusConfig.new;

  const { updateOrderStatus } = useVendorStore();

  const handleStatusChange = async (newStatus) => {
    try {
      await updateOrderStatus(order.id, newStatus);
      setOrder((prev) => ({ ...prev, status: newStatus }));
      Alert.alert('Updated', `Order status set to ${newStatus}`);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleAccept = () => {
    Alert.alert('Accept', `Confirm accepting this ${isRental ? 'rental' : 'order'}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Accept', onPress: () => handleStatusChange(isRental ? 'active' : 'accepted') },
    ]);
  };

  const handleReject = () => {
    Alert.alert('Reject', `Reject this ${isRental ? 'rental request' : 'order'}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: () => handleStatusChange('cancelled') },
    ]);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isRental ? 'Rental Details' : 'Order Details'}
        </Text>
        <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
          <Text style={styles.statusIcon}>{s.icon}</Text>
          <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {isRental ? (
          <RentalDetail
            order={order}
            onAccept={handleAccept}
            onReject={handleReject}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <MaterialDetail
            order={order}
            onAccept={handleAccept}
            onReject={handleReject}
            onStatusChange={handleStatusChange}
          />
        )}
      </ScrollView>
    </View>
  );
};

const tlStyles = StyleSheet.create({
  row:      { flexDirection: 'row', marginBottom: 4 },
  left:     { alignItems: 'center', marginRight: 12, width: 24 },
  dot:      { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  dotDone:  { backgroundColor: colors.accentAmber },
  dotIcon:  { fontSize: 11, color: colors.white, fontWeight: '900' },
  line:     { width: 2, flex: 1, backgroundColor: colors.border, marginVertical: 2, minHeight: 16 },
  lineDone: { backgroundColor: colors.accentAmber },
  content:  { flex: 1, paddingBottom: 16 },
  label:    { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  labelDone:{ color: colors.textPrimary, fontWeight: '700' },
  time:     { fontSize: 11, color: colors.textMuted, marginTop: 2 },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn:     { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  backIcon:    { fontSize: 24, color: colors.textPrimary, fontWeight: '300', lineHeight: 28 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: colors.textPrimary },
  statusPill:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  statusIcon:  { fontSize: 12 },
  statusText:  { fontSize: 11, fontWeight: '800' },

  scroll: { padding: 16, paddingBottom: 50 },

  section: {
    backgroundColor: colors.surface,
    borderRadius:    18,
    padding:         16,
    marginBottom:    14,
    borderWidth:     1,
    borderColor:     colors.border,
    elevation:        2,
    shadowColor:      colors.cardShadow,
    shadowOffset:     { width: 0, height: 2 },
    shadowOpacity:    0.06,
    shadowRadius:     6,
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: colors.textPrimary, marginBottom: 14 },

  detailRow:    { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  detailLabel:  { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  detailValue:  { fontSize: 13, color: colors.textPrimary, fontWeight: '700', textAlign: 'right', flex: 1, marginLeft: 16 },
  addressText:  { fontSize: 13, color: colors.textSecondary, fontWeight: '500', lineHeight: 20 },

  // Rental period grid
  rentalPeriodGrid:  { flexDirection: 'row', backgroundColor: colors.surfaceElevated, borderRadius: 14, padding: 14 },
  rentalPeriodItem:  { flex: 1, alignItems: 'center' },
  rentalPeriodLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 },
  rentalPeriodValue: { fontSize: 13, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' },

  // Overdue alert
  overdueAlert:     { backgroundColor: colors.redSoft, borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: colors.red },
  overdueAlertText: { fontSize: 13, fontWeight: '700', color: colors.red, lineHeight: 20 },

  // Table
  tableHeader: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 4 },
  colHeader:   { fontSize: 10, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 },
  itemRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  itemName:    { fontSize: 12, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  itemUnit:    { fontSize: 10, color: colors.textMuted, fontWeight: '500' },
  itemQty:     { fontSize: 13, fontWeight: '800', color: colors.textPrimary },
  itemPrice:   { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  itemTotal:   { fontSize: 13, fontWeight: '800', color: colors.textPrimary },

  totalsBlock:     { marginTop: 12, backgroundColor: colors.surfaceElevated, borderRadius: 12, padding: 12 },
  grandTotalRow:   { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 6, paddingTop: 10 },
  grandTotalLabel: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  grandTotalValue: { fontSize: 18, fontWeight: '900', color: colors.accentAmber },

  // Buttons
  buttonsRow:    { flexDirection: 'row', gap: 12, marginBottom: 14 },
  rejectBtn:     { flex: 1, paddingVertical: 15, borderRadius: 14, alignItems: 'center', backgroundColor: colors.redSoft, borderWidth: 1, borderColor: colors.red },
  rejectBtnText: { fontSize: 13, fontWeight: '800', color: colors.red },
  acceptBtnWrap: { flex: 2 },
  acceptBtn:     { paddingVertical: 15, borderRadius: 14, alignItems: 'center' },
  acceptBtnText: { fontSize: 13, fontWeight: '800', color: colors.white },
  fullBtnWrap:   { marginBottom: 14 },
  fullBtn:       { paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  fullBtnText:   { fontSize: 14, fontWeight: '800', color: colors.white },
});

export default OrderDetailScreen;