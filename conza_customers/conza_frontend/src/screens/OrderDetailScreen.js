import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useAppStore from '../store/useAppStore';
import { colors } from '../theme/colors';
import AddToProjectSheet from '../components/AddToProjectSheet';
import SlideToast from '../components/SlideToast';

const getMaterialStatus = (status) => {
  switch (status) {
    case 'new':              return { text: 'Order Placed',     color: '#3B82F6', icon: 'package-variant' };
    case 'accepted':         return { text: 'Accepted',         color: '#10B981', icon: 'check-circle'    };
    case 'out_for_delivery': return { text: 'Out for Delivery', color: '#F97316', icon: 'truck-delivery'  };
    case 'delivered':        return { text: 'Delivered',        color: '#6366F1', icon: 'package-check'   };
    case 'cancelled':        return { text: 'Cancelled',        color: '#EF4444', icon: 'close-circle'    };
    default:                 return { text: status,             color: '#6B7280', icon: 'help-circle'     };
  }
};

const getRentalStatus = (status) => {
  switch (status) {
    case 'new':       return { text: 'Booking Placed',   color: '#3B82F6', icon: 'clock-outline'   };
    case 'accepted':  return { text: 'Accepted',         color: '#10B981', icon: 'check-circle'    };
    case 'active':    return { text: 'Equipment Active', color: '#6366F1', icon: 'hammer-wrench'   };
    case 'overdue':   return { text: 'Overdue',          color: '#EF4444', icon: 'alert-circle'    };
    case 'returned':  return { text: 'Returned',         color: '#10B981', icon: 'keyboard-return' };
    case 'cancelled': return { text: 'Cancelled',        color: '#EF4444', icon: 'close-circle'    };
    default:          return { text: status,             color: '#6B7280', icon: 'help-circle'     };
  }
};

const DetailRow = React.memo(({ label, value }) => {
  if (value === null || value === undefined || value === '') return null;
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={2}>{value}</Text>
    </View>
  );
});

const ItemRow = React.memo(({ item, orderType, isLast }) => (
  <View style={[styles.itemRow, isLast && { borderBottomWidth: 0 }]}>
    {item.image ? (
      <Image source={{ uri: item.image }} style={styles.itemImage} />
    ) : (
      <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
        <MaterialCommunityIcons
          name={orderType === 'rental' ? 'hammer-wrench' : 'package-variant'}
          size={20}
          color={colors.textMuted}
        />
      </View>
    )}
    <View style={{ flex: 1 }}>
      <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.itemMeta}>
        {item.qty ? `${item.qty} ${item.unit || 'unit'}${item.qty > 1 ? 's' : ''}` : ''}
        {item.days ? ` × ${item.days} day${item.days > 1 ? 's' : ''}` : ''}
        {item.price ? ` • ₹${item.price}` : ''}
      </Text>
    </View>
    <Text style={styles.itemSubtotal}>₹{item.subtotal}</Text>
  </View>
));

const OrderDetailScreen = ({ route, navigation }) => {
  const { orderId } = route.params || {};
  const { sellerOrders, sellerOrdersLoading, fetchMySellerOrders } = useAppStore();

  const [showAddToProject, setShowAddToProject] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '' });

  useEffect(() => {
    if (!sellerOrders || !sellerOrders.length) {
      fetchMySellerOrders();
    }
  }, []);

  const order = useMemo(
    () => (sellerOrders || []).find((o) => o._id === orderId),
    [sellerOrders, orderId]
  );

  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);

  const handleAddToProjectSuccess = useCallback((project, message) => {
    setToast({ visible: true, message });
  }, []);

  const handleDismissToast = useCallback(() => setToast({ visible: false, message: '' }), []);

  if (!order) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleGoBack} activeOpacity={0.7}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.center}>
          {sellerOrdersLoading ? (
            <ActivityIndicator color={colors.accentAmber} />
          ) : (
            <Text style={styles.emptyText}>This order could not be found.</Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const isRental   = order.orderType === 'rental';
  const s          = isRental ? getRentalStatus(order.status) : getMaterialStatus(order.status);
  const itemNames  = (order.items || []).map((i) => i.title).filter(Boolean).join(', ');

  const attachment = {
    refModel: 'SellerOrder',
    refId: order._id,
    title: itemNames || (isRental ? 'Equipment Rental' : 'Material Order'),
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleGoBack} activeOpacity={0.7}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {isRental ? 'Rental Order' : 'Material Order'}
        </Text>
        <View style={{ width: 38 }} />
      </View>
      <View style={styles.divider} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.statusBanner}>
          <View style={[styles.statusPill, { backgroundColor: `${s.color}1A` }]}>
            <MaterialCommunityIcons name={s.icon} size={16} color={s.color} />
            <Text style={[styles.statusPillText, { color: s.color }]}>{s.text}</Text>
          </View>
          <Text style={styles.orderIdText}>Order #{(order._id || '').slice(-6).toUpperCase()}</Text>
        </View>

        <Text style={styles.sectionTitle}>Items</Text>
        <View style={styles.card}>
          {(order.items || []).map((item, idx) => (
            <ItemRow
              key={item.product ? `${item.product}-${idx}` : idx}
              item={item}
              orderType={order.orderType}
              isLast={idx === (order.items || []).length - 1}
            />
          ))}
        </View>

        {isRental && (
          <>
            <Text style={styles.sectionTitle}>Rental Period</Text>
            <View style={styles.card}>
              <DetailRow label="Start Date" value={order.startDate ? new Date(order.startDate).toLocaleDateString('en-IN') : null} />
              <DetailRow label="End Date" value={order.endDate ? new Date(order.endDate).toLocaleDateString('en-IN') : null} />
              <DetailRow label="Duration" value={order.durationDays ? `${order.durationDays} day${order.durationDays > 1 ? 's' : ''}` : null} />
              <DetailRow label="Deposit" value={order.depositAmount ? `₹${order.depositAmount} (${order.depositStatus})` : null} />
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>Delivery Address</Text>
        <View style={styles.card}>
          <DetailRow label="Name" value={order.customerName} />
          <DetailRow label="Phone" value={order.customerPhone} />
          <DetailRow label="Address" value={order.customerAddress} />
          <DetailRow label="City" value={order.city} />
          <DetailRow label="Pincode" value={order.pincode} />
        </View>

        <Text style={styles.sectionTitle}>Payment</Text>
        <View style={styles.card}>
          <DetailRow label="Subtotal" value={`₹${order.subtotal}`} />
          <DetailRow label="Delivery Charge" value={`₹${order.deliveryCharge || 0}`} />
          <DetailRow label="Total" value={`₹${order.total}`} />
          <DetailRow label="Payment Method" value={(order.paymentMethod || '').toUpperCase()} />
          <DetailRow label="Payment Status" value={(order.paymentStatus || '').replace(/_/g, ' ')} />
        </View>

        {!!order.notes && (
          <>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.card}>
              <Text style={styles.notesText}>{order.notes}</Text>
            </View>
          </>
        )}

        {order.status !== 'cancelled' && (
          <TouchableOpacity
            style={styles.addToProjectBtn}
            onPress={() => setShowAddToProject(true)}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="briefcase-plus-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.addToProjectBtnText}>Add to Project</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <AddToProjectSheet
        visible={showAddToProject}
        attachment={attachment}
        onClose={() => setShowAddToProject(false)}
        onSuccess={handleAddToProjectSuccess}
      />
      <SlideToast visible={toast.visible} message={toast.message} onDismiss={handleDismissToast} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 14, color: colors.textMuted, fontWeight: '500' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14, gap: 10,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  backArrow: { fontSize: 18, color: colors.textPrimary, fontWeight: '600' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' },
  divider: { height: 1, backgroundColor: colors.borderLight },

  scroll: { paddingTop: 20, paddingHorizontal: 20, paddingBottom: 40 },

  statusBanner: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  statusPillText: { fontSize: 12, fontWeight: '700' },
  orderIdText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },

  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, marginBottom: 10, marginTop: 4 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },

  itemRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  itemImage: { width: 44, height: 44, borderRadius: 10, backgroundColor: colors.surfaceElevated },
  itemImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  itemTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  itemMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2, fontWeight: '500' },
  itemSubtotal: { fontSize: 13, fontWeight: '800', color: colors.textPrimary },

  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  detailLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  detailValue: {
    fontSize: 13, color: colors.textPrimary, fontWeight: '700',
    flexShrink: 1, textAlign: 'right', marginLeft: 12, textTransform: 'capitalize',
  },

  notesText: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, fontWeight: '500' },

  addToProjectBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.accentYellow,
    borderRadius: 16,
    paddingVertical: 15,
    marginTop: 4,
  },
  addToProjectBtnText: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
});

export default OrderDetailScreen;
