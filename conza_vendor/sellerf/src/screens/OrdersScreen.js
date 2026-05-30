import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ScrollView, Alert, Modal, Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import useModeStore   from '../store/useModeStore';
import useVendorStore from '../store/useVendorStore';
import ModeToggle     from '../components/ModeToggle';
import { colors }     from '../theme/colors';

// ── Status configs ────────────────────────────────────────────────────────────
export const MATERIAL_STATUS_CONFIG = {
  new:              { label: 'New',              color: colors.blue,   bg: colors.blueSoft,   icon: '🆕' },
  accepted:         { label: 'Accepted',         color: colors.green,  bg: colors.greenSoft,  icon: '✅' },
  out_for_delivery: { label: 'Out for Delivery', color: colors.orange, bg: colors.orangeSoft, icon: '🚚' },
  delivered:        { label: 'Delivered',        color: colors.green,  bg: colors.greenSoft,  icon: '📦' },
  cancelled:        { label: 'Cancelled',        color: colors.red,    bg: colors.redSoft,    icon: '❌' },
};

export const RENTAL_STATUS_CONFIG = {
  new:       { label: 'New Request', color: colors.blue,   bg: colors.blueSoft,   icon: '🆕' },
  active:    { label: 'Active',      color: colors.green,  bg: colors.greenSoft,  icon: '🔧' },
  overdue:   { label: 'Overdue',     color: colors.red,    bg: colors.redSoft,    icon: '⚠️' },
  returned:  { label: 'Returned',    color: colors.indigo, bg: colors.indigoSoft, icon: '✅' },
  cancelled: { label: 'Cancelled',   color: colors.red,    bg: colors.redSoft,    icon: '❌' },
};

const MATERIAL_TABS = [
  { key: 'all',              label: 'All'              },
  { key: 'new',              label: 'New'              },
  { key: 'accepted',         label: 'Accepted'         },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered',        label: 'Delivered'        },
  { key: 'cancelled',        label: 'Cancelled'        },
];

const RENTAL_TABS = [
  { key: 'all',       label: 'All'       },
  { key: 'new',       label: 'New'       },
  { key: 'active',    label: 'Active'    },
  { key: 'overdue',   label: 'Overdue'   },
  { key: 'returned',  label: 'Returned'  },
  { key: 'cancelled', label: 'Cancelled' },
];

// ── Shared helpers ────────────────────────────────────────────────────────────
const InfoRow = ({ icon, text, bold }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoIcon}>{icon}</Text>
    <Text style={[styles.infoText, bold && styles.infoTextBold]} numberOfLines={1}>{text}</Text>
  </View>
);

const Divider = () => <View style={styles.divider} />;

// ── Status Change Modal ───────────────────────────────────────────────────────
const StatusChangeModal = ({ visible, order, targetStatus, statusConfig, onConfirm, onCancel }) => {
  if (!order || !targetStatus) return null;
  const cfg = statusConfig[targetStatus] || { label: targetStatus, icon: '🔄', color: colors.textPrimary, bg: colors.surfaceElevated };
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.modalOverlay} onPress={onCancel}>
        <View style={styles.confirmModal} onStartShouldSetResponder={() => true}>
          <Text style={styles.confirmTitle}>Update Order Status</Text>
          <Text style={styles.confirmBody}>
            Are you sure you want to mark order{'\n'}
            <Text style={styles.confirmOrderId}>#{order.id}</Text>
            {'\n'}as{' '}
            <Text style={[styles.confirmStatus, { color: cfg.color }]}>{cfg.icon} {cfg.label}</Text>?
          </Text>
          <View style={styles.confirmActions}>
            <TouchableOpacity style={styles.confirmCancel} onPress={onCancel} activeOpacity={0.8}>
              <Text style={styles.confirmCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.confirmOk, { backgroundColor: cfg.color }]} onPress={onConfirm} activeOpacity={0.85}>
              <Text style={styles.confirmOkText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

// ── Material Order Card ───────────────────────────────────────────────────────
const MaterialOrderCard = ({ order, onViewDetails, onAccept, onReject, onStatusChange }) => {
  const s         = MATERIAL_STATUS_CONFIG[order.status] || MATERIAL_STATUS_CONFIG.new;
  const itemNames = (order.items || []).map((i) => i.name).join(', ');
  const totalQty  = (order.items || []).reduce((sum, i) => sum + (i.qty || 0), 0);
  const total     = order.total || 0;

  const NEXT_STATUSES = {
    new:              ['accepted', 'cancelled'],
    accepted:         ['out_for_delivery', 'cancelled'],
    out_for_delivery: ['delivered', 'cancelled'],
    delivered:        [],
    cancelled:        [],
  };
  const nextStatuses = NEXT_STATUSES[order.status] || [];

  return (
    <View style={styles.card}>

      {/* ── Header ── */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.orderTypeTag}>
            <Text style={styles.orderTypeTagText}>📦 Material</Text>
          </View>
          <Text style={styles.orderId}>{order.id}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
          <Text style={styles.statusIcon}>{s.icon}</Text>
          <Text style={[styles.statusLabel, { color: s.color }]}>{s.label}</Text>
        </View>
      </View>

      <Divider />

      {/* ── Customer + Items ── */}
      <View style={styles.cardBody}>
        <InfoRow icon="👤" text={order.customerName} bold />
        <InfoRow icon="🧱" text={itemNames} />
        <InfoRow icon="🕐" text={`${order.date || ''} · ${order.time || ''}`} />
      </View>

      <Divider />

      {/* ── Stats strip ── */}
      <View style={styles.statsStrip}>
        <View style={styles.statCell}>
          <Text style={styles.statCellLabel}>Items</Text>
          <Text style={styles.statCellValue}>{totalQty}</Text>
        </View>
        <View style={styles.statCellDivider} />
        <View style={styles.statCell}>
          <Text style={styles.statCellLabel}>Payment</Text>
          <Text style={styles.statCellValue}>{order.paymentMethod || '—'}</Text>
        </View>
        <View style={styles.statCellDivider} />
        <View style={styles.statCell}>
          <Text style={styles.statCellLabel}>Status</Text>
          <Text style={[styles.statCellValue, {
            color: order.paymentStatus === 'paid' ? colors.green :
                   order.paymentStatus === 'refunded' ? colors.blue : colors.orange
          }]}>
            {(order.paymentStatus || 'pending').charAt(0).toUpperCase() + (order.paymentStatus || '').slice(1)}
          </Text>
        </View>
        <View style={styles.statCellDivider} />
        <View style={styles.statCell}>
          <Text style={styles.statCellLabel}>Total</Text>
          <Text style={[styles.statCellValue, { color: colors.accentAmber }]}>
            ₹{total.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      <Divider />

      {/* ── Status update buttons ── */}
      {nextStatuses.length > 0 && (
        <>
          <View style={styles.statusUpdateRow}>
            <Text style={styles.statusUpdateLabel}>Update Status:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusBtnScroll}>
              {nextStatuses.map((st) => {
                const sc = MATERIAL_STATUS_CONFIG[st] || {};
                return (
                  <TouchableOpacity
                    key={st}
                    style={[styles.statusUpdateBtn, { backgroundColor: sc.bg, borderColor: sc.color }]}
                    onPress={() => onStatusChange(order, st)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.statusUpdateBtnText, { color: sc.color }]}>{sc.icon} {sc.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
          <Divider />
        </>
      )}

      {/* ── Actions ── */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.viewBtn}
          onPress={() => onViewDetails(order)}
          activeOpacity={0.8}
        >
          <Text style={styles.viewBtnText}>👁️  Details</Text>
        </TouchableOpacity>

        {order.status === 'new' && (
          <>
            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={() => onReject(order.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.rejectBtnText}>✕  Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.acceptBtnWrap}
              onPress={() => onAccept(order.id)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.acceptBtn}
              >
                <Text style={styles.acceptBtnText}>✓  Accept</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
      </View>

    </View>
  );
};

// ── Rental Order Card ─────────────────────────────────────────────────────────
// ── Rental Order Card ─────────────────────────────────────────────────────────
const RentalOrderCard = ({ order, onViewDetails, onAccept, onReject, onStatusChange }) => {
  const s         = RENTAL_STATUS_CONFIG[order.status] || RENTAL_STATUS_CONFIG.new;
  const isOverdue = order.status === 'overdue';
  const itemNames = (order.items || []).map((i) => i.name).join(', ');
  const total     = order.total || 0;
  const deposit   = order.depositAmount || 0;

  const NEXT_STATUSES = {
    new:       ['active', 'cancelled'],
    active:    ['returned', 'overdue', 'cancelled'],
    overdue:   ['returned', 'cancelled'],
    returned:  [],
    cancelled: [],
  };
  const nextStatuses = NEXT_STATUSES[order.status] || [];

  return (
    <View style={[styles.card, isOverdue && styles.cardOverdue]}>

      {/* Overdue banner */}
      {isOverdue && (
        <View style={styles.overdueBanner}>
          <Text style={styles.overdueBannerText}>⚠️  Equipment return is overdue — contact customer immediately</Text>
        </View>
      )}

      {/* ── Header ── */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.orderTypeTag, { backgroundColor: colors.indigoSoft }]}>
            <Text style={[styles.orderTypeTagText, { color: colors.indigo }]}>🏗️ Rental</Text>
          </View>
          <Text style={styles.orderId}>{order.id}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
          <Text style={styles.statusIcon}>{s.icon}</Text>
          <Text style={[styles.statusLabel, { color: s.color }]}>{s.label}</Text>
        </View>
      </View>

      <Divider />

      {/* ── Customer + Equipment ── */}
      <View style={styles.cardBody}>
        <InfoRow icon="👤" text={order.customerName} bold />
        <InfoRow icon="🏗️" text={itemNames} />
        <InfoRow icon="🕐" text={`Requested: ${order.date || ''} · ${order.time || ''}`} />
      </View>

      <Divider />

      {/* ── Rental period strip ── */}
      <View style={styles.rentalPeriodStrip}>
        <View style={styles.rentalPeriodCell}>
          <Text style={styles.rentalPeriodLabel}>Start</Text>
          <Text style={styles.rentalPeriodValue}>{order.startDate || '—'}</Text>
        </View>
        <View style={styles.rentalPeriodArrow}>
          <Text style={styles.rentalPeriodArrowText}>→</Text>
        </View>
        <View style={styles.rentalPeriodCell}>
          <Text style={styles.rentalPeriodLabel}>End</Text>
          <Text style={styles.rentalPeriodValue}>{order.endDate || '—'}</Text>
        </View>
        <View style={styles.rentalPeriodArrow}>
          <Text style={styles.rentalPeriodArrowText}>·</Text>
        </View>
        <View style={styles.rentalPeriodCell}>
          <Text style={styles.rentalPeriodLabel}>Duration</Text>
          <Text style={[styles.rentalPeriodValue, { color: colors.indigo }]}>
            {order.durationDays || 0} Days
          </Text>
        </View>
      </View>

      {/* ── Financial strip ── */}
      <View style={styles.statsStrip}>
        <View style={styles.statCell}>
          <Text style={styles.statCellLabel}>Rental Total</Text>
          <Text style={[styles.statCellValue, { color: colors.accentAmber }]}>
            ₹{total.toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={styles.statCellDivider} />
        <View style={styles.statCell}>
          <Text style={styles.statCellLabel}>Deposit</Text>
          <Text style={styles.statCellValue}>₹{deposit.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.statCellDivider} />
        <View style={styles.statCell}>
          <Text style={styles.statCellLabel}>Deposit Status</Text>
          <Text style={[styles.statCellValue, {
            color: order.depositStatus === 'collected' ? colors.green :
                   order.depositStatus === 'refunded'  ? colors.blue  : colors.orange,
          }]}>
            {(order.depositStatus || 'pending').charAt(0).toUpperCase() + (order.depositStatus || '').slice(1)}
          </Text>
        </View>
      </View>

      <Divider />

      {/* ── Status update buttons ── */}
      {nextStatuses.length > 0 && (
        <>
          <View style={styles.statusUpdateRow}>
            <Text style={styles.statusUpdateLabel}>Update Status:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusBtnScroll}>
              {nextStatuses.map((st) => {
                const sc = RENTAL_STATUS_CONFIG[st] || {};
                return (
                  <TouchableOpacity
                    key={st}
                    style={[styles.statusUpdateBtn, { backgroundColor: sc.bg, borderColor: sc.color }]}
                    onPress={() => onStatusChange(order, st)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.statusUpdateBtnText, { color: sc.color }]}>{sc.icon} {sc.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
          <Divider />
        </>
      )}

      {/* ── Actions ── */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.viewBtn}
          onPress={() => onViewDetails(order)}
          activeOpacity={0.8}
        >
          <Text style={styles.viewBtnText}>👁️  Details</Text>
        </TouchableOpacity>

        {order.status === 'new' && (
          <>
            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={() => onReject(order.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.rejectBtnText}>✕  Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.acceptBtnWrap}
              onPress={() => onAccept(order.id)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.acceptBtn}
              >
                <Text style={styles.acceptBtnText}>✓  Accept</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}

        {order.status === 'overdue' && (
          <TouchableOpacity style={styles.callBtn} activeOpacity={0.8}>
            <Text style={styles.callBtnText}>📞  Call Customer</Text>
          </TouchableOpacity>
        )}
      </View>

    </View>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
// ── Main Screen ───────────────────────────────────────────────────────────────
const OrdersScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { mode } = useModeStore();
  const { getFilteredOrders, fetchOrders, ordersLoading, updateOrderStatus } = useVendorStore();
  const materialOrders = useVendorStore((s) => s.materialOrders);
  const rentalOrders   = useVendorStore((s) => s.rentalOrders);

  const [matTab,  setMatTab]  = useState('all');
  const [rentTab, setRentTab] = useState('all');

  // Confirmation modal state
  const [confirmVisible,  setConfirmVisible]  = useState(false);
  const [pendingOrder,    setPendingOrder]    = useState(null);
  const [pendingStatus,   setPendingStatus]   = useState(null);

  useEffect(() => {
    fetchOrders(mode);
  }, [mode]);

  const isMaterials = mode === 'materials';
  const tabs        = isMaterials ? MATERIAL_TABS : RENTAL_TABS;
  const activeTab   = isMaterials ? matTab        : rentTab;
  const setTab      = isMaterials ? setMatTab     : setRentTab;
  const orders      = useMemo(() => getFilteredOrders(mode), [materialOrders, rentalOrders, mode]);

  const handleViewDetails = (order) => {
    navigation.navigate('OrderDetail', { order, mode });
  };

  const handleStatusChange = useCallback((order, targetStatus) => {
    setPendingOrder(order);
    setPendingStatus(targetStatus);
    setConfirmVisible(true);
  }, []);

  const handleConfirmStatus = useCallback(async () => {
    if (!pendingOrder || !pendingStatus) return;
    setConfirmVisible(false);
    try {
      await updateOrderStatus(pendingOrder.id, pendingStatus);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setPendingOrder(null);
      setPendingStatus(null);
    }
  }, [pendingOrder, pendingStatus, updateOrderStatus]);

  const handleCancelConfirm = useCallback(() => {
    setConfirmVisible(false);
    setPendingOrder(null);
    setPendingStatus(null);
  }, []);

  const tabCounts = useMemo(() => {
    const counts = { all: orders.length };
    tabs.slice(1).forEach((t) => {
      counts[t.key] = orders.filter((o) => o.status === t.key).length;
    });
    return counts;
  }, [orders, tabs]);

  const filtered = useMemo(() => {
    if (activeTab === 'all') return orders;
    return orders.filter((o) => o.status === activeTab);
  }, [orders, activeTab]);

  const activeStatusConfig = isMaterials ? MATERIAL_STATUS_CONFIG : RENTAL_STATUS_CONFIG;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>

      {/* Confirmation Modal */}
      <StatusChangeModal
        visible={confirmVisible}
        order={pendingOrder}
        targetStatus={pendingStatus}
        statusConfig={activeStatusConfig}
        onConfirm={handleConfirmStatus}
        onCancel={handleCancelConfirm}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {isMaterials ? 'Material Orders' : 'Rental Orders'}
        </Text>
        <ModeToggle />
      </View>

      {/* Tabs */}
      <View style={styles.tabsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setTab(tab.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
              <View style={[styles.tabBadge, activeTab === tab.key && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, activeTab === tab.key && styles.tabBadgeTextActive]}>
                  {tabCounts[tab.key] || 0}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>📭</Text>
            <Text style={styles.emptyText}>No orders found</Text>
          </View>
        }
        renderItem={({ item: order }) =>
          isMaterials ? (
            <MaterialOrderCard
              order={order}
              onViewDetails={handleViewDetails}
              onStatusChange={handleStatusChange}
              onAccept={() => handleStatusChange(order, 'accepted')}
              onReject={() => handleStatusChange(order, 'cancelled')}
            />
          ) : (
            <RentalOrderCard
              order={order}
              onViewDetails={handleViewDetails}
              onStatusChange={handleStatusChange}
              onAccept={() => handleStatusChange(order, 'active')}
              onReject={() => handleStatusChange(order, 'cancelled')}
            />
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: colors.background },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },

  // Tabs
  tabsWrap:           { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  tabs:               { paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  tab:                { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border, gap: 5 },
  tabActive:          { backgroundColor: colors.accentAmberSoft, borderColor: colors.accentAmber },
  tabText:            { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  tabTextActive:      { color: colors.accentAmber, fontWeight: '800' },
  tabBadge:           { backgroundColor: colors.borderLight, borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1, minWidth: 18, alignItems: 'center' },
  tabBadgeActive:     { backgroundColor: colors.accentAmber },
  tabBadgeText:       { fontSize: 9, fontWeight: '800', color: colors.textMuted },
  tabBadgeTextActive: { color: colors.white },

  list: { padding: 16, paddingBottom: 40 },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: colors.surface,
    borderRadius:    20,
    marginBottom:    16,
    borderWidth:     1,
    borderColor:     colors.border,
    elevation:        3,
    shadowColor:      colors.cardShadow,
    shadowOffset:     { width: 0, height: 3 },
    shadowOpacity:    0.08,
    shadowRadius:     10,
    overflow:        'hidden',
  },
  cardOverdue: { borderColor: colors.red, borderWidth: 2 },

  // Overdue banner
  overdueBanner:     { backgroundColor: colors.redSoft, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(224,59,59,0.15)' },
  overdueBannerText: { fontSize: 12, fontWeight: '700', color: colors.red, lineHeight: 18 },

  // Card header
  cardHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  orderTypeTag:   { backgroundColor: colors.accentAmberSoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  orderTypeTagText:{ fontSize: 10, fontWeight: '800', color: colors.accentAmber },
  orderId:        { fontSize: 13, fontWeight: '800', color: colors.textPrimary },
  statusBadge:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10, gap: 4 },
  statusIcon:     { fontSize: 11 },
  statusLabel:    { fontSize: 11, fontWeight: '800' },

  divider: { height: 1, backgroundColor: colors.borderLight },

  // Card body
  cardBody:     { paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  infoRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoIcon:     { fontSize: 14, width: 22 },
  infoText:     { flex: 1, fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  infoTextBold: { fontWeight: '700', color: colors.textPrimary, fontSize: 13 },

  // Stats strip
  statsStrip:       { flexDirection: 'row', backgroundColor: colors.surfaceElevated, paddingVertical: 12, paddingHorizontal: 8 },
  statCell:         { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  statCellDivider:  { width: 1, backgroundColor: colors.border },
  statCellLabel:    { fontSize: 9, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 },
  statCellValue:    { fontSize: 12, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' },

  // Rental period strip
  rentalPeriodStrip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, backgroundColor: colors.indigoSoft },
  rentalPeriodCell:  { flex: 1 },
  rentalPeriodLabel: { fontSize: 9, color: colors.indigo, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3, opacity: 0.7 },
  rentalPeriodValue: { fontSize: 12, fontWeight: '800', color: colors.textPrimary },
  rentalPeriodArrow: { paddingHorizontal: 6 },
  rentalPeriodArrowText: { fontSize: 14, color: colors.indigo, fontWeight: '700' },

  // Actions
  actionsRow:    { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingVertical: 12 },
  viewBtn:       { flex: 1, backgroundColor: colors.surfaceElevated, paddingVertical: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  viewBtnText:   { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  rejectBtn:     { flex: 1, backgroundColor: colors.redSoft, paddingVertical: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(224,59,59,0.2)' },
  rejectBtnText: { fontSize: 11, fontWeight: '700', color: colors.red },
  acceptBtnWrap: { flex: 1 },
  acceptBtn:     { paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  acceptBtnText: { fontSize: 11, fontWeight: '800', color: colors.white },
  callBtn:       { flex: 1, backgroundColor: colors.redSoft, paddingVertical: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(224,59,59,0.2)' },
  callBtnText:   { fontSize: 11, fontWeight: '700', color: colors.red },

  // Empty
  // Empty
  empty:     { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 15, color: colors.textMuted, fontWeight: '600', marginTop: 12 },

  // Status update row
  statusUpdateRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  statusUpdateLabel:  { fontSize: 10, color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, flexShrink: 0 },
  statusBtnScroll:    { flexDirection: 'row', gap: 6, alignItems: 'center' },
  statusUpdateBtn:    { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  statusUpdateBtnText:{ fontSize: 11, fontWeight: '700' },

  // Confirm modal
  modalOverlay:   { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: 24 },
  confirmModal:   { backgroundColor: colors.surface, borderRadius: 20, padding: 24, width: '100%', maxWidth: 340, elevation: 10, shadowColor: colors.cardShadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 },
  confirmTitle:   { fontSize: 17, fontWeight: '800', color: colors.textPrimary, marginBottom: 12, textAlign: 'center' },
  confirmBody:    { fontSize: 14, color: colors.textSecondary, fontWeight: '500', textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  confirmOrderId: { fontWeight: '800', color: colors.textPrimary },
  confirmStatus:  { fontWeight: '800' },
  confirmActions: { flexDirection: 'row', gap: 10 },
  confirmCancel:  { flex: 1, backgroundColor: colors.surfaceElevated, paddingVertical: 12, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  confirmCancelText:{ fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  confirmOk:      { flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  confirmOkText:  { fontSize: 13, fontWeight: '800', color: colors.white },
});

export default OrdersScreen;