import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Alert, ActivityIndicator, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useAppStore from '../store/useAppStore';
import { colors } from '../theme/colors';

// ── Status display helpers (mirror StatusScreen.js so the cards look identical) ──
const getLabourStatusDisplay = (status) => {
  switch (status) {
    case 'pending':                        return { text: 'Waiting for response',    color: '#F59E0B', icon: 'clock-outline'   };
    case 'accepted':                       return { text: 'Worker on the way',       color: '#3B82F6', icon: 'car-side'        };
    case 'arrived':                        return { text: 'Worker Arrived',          color: '#10B981', icon: 'account-check'   };
    case 'in_progress':                    return { text: 'Work in Progress',        color: '#6366F1', icon: 'hammer-wrench'   };
    case 'awaiting_customer_confirmation': return { text: 'Confirm Work Completion', color: '#F97316', icon: 'clipboard-check' };
    case 'completed':                      return { text: 'Completed',               color: '#10B981', icon: 'check-decagram'  };
    case 'cancelled':                      return { text: 'Cancelled',               color: '#EF4444', icon: 'close-circle'    };
    default:                               return { text: status,                    color: '#6B7280', icon: 'help-circle'     };
  }
};

const getMaterialStatusDisplay = (status) => {
  switch (status) {
    case 'new':              return { text: 'Order Placed',     color: '#3B82F6', icon: 'package-variant' };
    case 'accepted':         return { text: 'Accepted',         color: '#10B981', icon: 'check-circle'    };
    case 'out_for_delivery': return { text: 'Out for Delivery', color: '#F97316', icon: 'truck-delivery'  };
    case 'delivered':        return { text: 'Delivered',        color: '#6366F1', icon: 'package-check'   };
    case 'cancelled':        return { text: 'Cancelled',        color: '#EF4444', icon: 'close-circle'    };
    default:                 return { text: status,             color: '#6B7280', icon: 'help-circle'     };
  }
};

const getVendorStatusDisplay = (status) => {
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

// item.type comes from the backend loadAttachments() helper: 'labour' | 'material' | 'rental'
const getStatusForType = (type, status) => {
  if (type === 'labour')   return getLabourStatusDisplay(status);
  if (type === 'material') return getMaterialStatusDisplay(status);
  return getVendorStatusDisplay(status); // 'rental' → shown under the "Vendor" filter
};

const TYPE_META = {
  labour:   { icon: 'account-hard-hat', badge: '👷 Labour',   badgeBg: '#EEF2FF', badgeColor: '#4338CA' },
  material: { icon: 'package-variant',  badge: '📦 Material', badgeBg: '#FEF3C7', badgeColor: '#92400E' },
  rental:   { icon: 'hammer-wrench',    badge: '🏗️ Vendor',   badgeBg: '#ECFDF5', badgeColor: '#059669' },
};

const FILTERS = [
  { key: 'all',      label: 'All',      icon: 'view-grid-outline' },
  { key: 'labour',   label: 'Labour',   icon: 'account-hard-hat'  },
  { key: 'material', label: 'Material', icon: 'package-variant'   },
  { key: 'vendor',   label: 'Vendor',   icon: 'hammer-wrench'     },
];

// UI filter key → attachment item.type
const filterToType = { labour: 'labour', material: 'material', vendor: 'rental' };

const EMPTY_COPY = {
  all:      { emoji: '📋', title: 'No Attachments Yet',      sub: 'Tap "Add Attachment" below to attach a labour booking or order from the Status tab.' },
  labour:   { emoji: '👷', title: 'No Labour Attachments',   sub: 'Labour bookings added to this project will appear here.'   },
  material: { emoji: '📦', title: 'No Material Attachments', sub: 'Material orders added to this project will appear here.'   },
  vendor:   { emoji: '🏗️', title: 'No Vendor Attachments',   sub: 'Rental / vendor orders added to this project will appear here.' },
};

// A status card, visually matching the ones on the Status tab. Stays visible
// (showing "Completed" / "Delivered" / "Returned" etc.) until the customer
// explicitly removes it — never auto-hides.
const AttachmentStatusCard = React.memo(({ item, onViewDetails, onRemove, busy }) => {
  const s    = getStatusForType(item.type, item.status);
  const meta = TYPE_META[item.type] || TYPE_META.material;

  return (
    <View style={styles.card}>
      <View style={[styles.cardAccent, { backgroundColor: s.color }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={styles.statusPill}>
            <MaterialCommunityIcons name={s.icon} size={14} color={s.color} />
            <Text style={[styles.statusPillText, { color: s.color }]}>{s.text}</Text>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: meta.badgeBg }]}>
            <Text style={[styles.typeBadgeText, { color: meta.badgeColor }]}>{meta.badge}</Text>
          </View>
        </View>

        <Text style={styles.serviceName} numberOfLines={1}>{item.title}</Text>

        {!!item.city && (
          <View style={styles.locationRow}>
            <MaterialCommunityIcons name="map-marker" size={13} color={colors.textMuted} />
            <Text style={styles.locationText} numberOfLines={1}>{item.city}</Text>
          </View>
        )}

        <View style={styles.cardBottom}>
          <Text style={styles.amountText}>₹{item.total}</Text>
          <Text style={styles.idText}>#{(item.refId || '').toString().slice(-6).toUpperCase()}</Text>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={onViewDetails} activeOpacity={0.8}>
            <Text style={styles.actionBtnText}>View Details →</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={onRemove}
            activeOpacity={0.8}
            disabled={busy}
          >
            <MaterialCommunityIcons name="close-circle-outline" size={14} color={colors.danger} />
            <Text style={styles.removeBtnText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

// Scrollable amount-breakdown popup, grouped by Labour / Material / Vendor.
const BreakdownModal = ({ visible, onClose, groups, grandTotal }) => (
  <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
    <View style={styles.modalBackdrop}>
      <View style={styles.modalSheet}>
        <View style={styles.modalHandle} />
        <View style={styles.modalHeaderRow}>
          <Text style={styles.modalTitle}>Amount Breakdown</Text>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons name="close" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalScroll}
          contentContainerStyle={styles.modalScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {groups.length === 0 ? (
            <Text style={styles.emptyHint}>No attachments to show yet.</Text>
          ) : (
            groups.map((group) => (
              <View key={group.key} style={styles.breakdownGroup}>
                <Text style={styles.breakdownGroupTitle}>{group.label} ({group.items.length})</Text>
                {group.items.map((item) => (
                  <View key={item.attachmentId} style={styles.breakdownRow}>
                    <Text style={styles.breakdownRowTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.breakdownRowAmount}>₹{item.total}</Text>
                  </View>
                ))}
                <View style={styles.breakdownSubtotalRow}>
                  <Text style={styles.breakdownSubtotalLabel}>Subtotal</Text>
                  <Text style={styles.breakdownSubtotalAmount}>₹{group.subtotal}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        <View style={styles.modalGrandTotalRow}>
          <Text style={styles.modalGrandTotalLabel}>Grand Total</Text>
          <Text style={styles.modalGrandTotalAmount}>₹{grandTotal}</Text>
        </View>
      </View>
    </View>
  </Modal>
);

const ProjectDetailScreen = ({ route, navigation }) => {
  const { projectId } = route.params || {};
  const {
    myProjects, fetchMyProjects,
    removeAttachmentFromProject, deleteProject,
    setActiveBookingId,
  } = useAppStore();

  const [activeFilter, setActiveFilter]   = useState('all');
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [busy, setBusy]                   = useState(false);

  useEffect(() => {
    fetchMyProjects();
  }, []);

  const project = useMemo(
    () => (myProjects || []).find((p) => p._id === projectId),
    [myProjects, projectId]
  );

  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);

  const attachments = project?.attachments || [];

  const counts = useMemo(() => ({
    all:      attachments.length,
    labour:   attachments.filter((a) => a.type === 'labour').length,
    material: attachments.filter((a) => a.type === 'material').length,
    vendor:   attachments.filter((a) => a.type === 'rental').length,
  }), [attachments]);

  const filteredAttachments = useMemo(() => {
    if (activeFilter === 'all') return attachments;
    const wantType = filterToType[activeFilter];
    return attachments.filter((a) => a.type === wantType);
  }, [attachments, activeFilter]);

  // Total spent always reflects the whole project, regardless of the active filter.
  const grandTotal = useMemo(
    () => attachments.reduce((sum, a) => sum + (Number(a.total) || 0), 0),
    [attachments]
  );

  const breakdownGroups = useMemo(() => {
    const groupDefs = [
      { key: 'labour',   label: 'Labour Bookings', type: 'labour'   },
      { key: 'material', label: 'Material Orders', type: 'material' },
      { key: 'rental',   label: 'Vendor Orders',   type: 'rental'   },
    ];
    return groupDefs
      .map((g) => {
        const items    = attachments.filter((a) => a.type === g.type);
        const subtotal = items.reduce((sum, a) => sum + (Number(a.total) || 0), 0);
        return { key: g.key, label: g.label, items, subtotal };
      })
      .filter((g) => g.items.length > 0);
  }, [attachments]);

  const handleViewDetails = useCallback(async (item) => {
    if (item.refModel === 'Booking') {
      await setActiveBookingId(item.refId);
      navigation.navigate('Status', { screen: 'BookingDetail' });
    } else {
      navigation.navigate('Status', { screen: 'OrderDetail', params: { orderId: item.refId } });
    }
  }, [navigation, setActiveBookingId]);

  const handleRemove = useCallback((item) => {
    if (!project) return;
    Alert.alert('Remove Attachment', `Remove "${item.title}" from this project?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await removeAttachmentFromProject(project._id, item.attachmentId);
          } catch (e) {
            Alert.alert('Could not remove', e.message || 'Please try again.');
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  }, [project, removeAttachmentFromProject]);

  const [deleting, setDeleting] = useState(false);

  const handleDeleteProject = useCallback(() => {
    if (!project || busy || deleting) return; // guards against double-tap re-firing the alert
    Alert.alert(
      'Delete Project',
      `Delete "${project.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            setBusy(true);
            try {
              await deleteProject(project._id);
              navigation.goBack();
            } catch (e) {
              setDeleting(false);
              setBusy(false);
              Alert.alert(
                'Could not delete',
                e?.response?.data?.message || e?.message || 'Please check your connection and try again.'
              );
            }
          },
        },
      ],
      { cancelable: true }
    );
  }, [project, busy, deleting, deleteProject, navigation]);

  // Bottom-right FAB: send the customer to the Status tab, where attachments
  // are actually added via each card's existing "Add to Project" action.
  const handleAddAttachment = useCallback(() => {
    navigation.navigate('Status', { screen: 'StatusList' });
  }, [navigation]);

  if (!project) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleGoBack} activeOpacity={0.7}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Project</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator color={colors.accentAmber} />
        </View>
      </SafeAreaView>
    );
  }

  const emptyCopy      = EMPTY_COPY[activeFilter];
  const activeFilterDef = FILTERS.find((f) => f.key === activeFilter);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleGoBack} activeOpacity={0.7}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{project.name}</Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleDeleteProject}
          activeOpacity={0.7}
          disabled={busy || deleting}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {deleting ? (
            <ActivityIndicator size="small" color={colors.danger} />
          ) : (
            <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.danger} />
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.divider} />

      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const isActive = activeFilter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setActiveFilter(f.key)}
              activeOpacity={0.75}
            >
              <MaterialCommunityIcons
                name={f.icon}
                size={14}
                color={isActive ? colors.white : colors.textSecondary}
              />
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                {f.label}
              </Text>
              {counts[f.key] > 0 && (
                <View style={[styles.filterBadge, isActive && styles.filterBadgeActive]}>
                  <Text style={[styles.filterBadgeText, isActive && styles.filterBadgeTextActive]}>
                    {counts[f.key]}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.totalCard} onPress={() => setShowBreakdown(true)} activeOpacity={0.85}>
          <View style={styles.totalCardLeft}>
            <View style={styles.totalIconWrap}>
              <MaterialCommunityIcons name="wallet-outline" size={20} color={colors.accentAmber} />
            </View>
            <View>
              <Text style={styles.totalLabel}>Total Amount Spent</Text>
              <Text style={styles.totalAmount}>₹{grandTotal}</Text>
            </View>
          </View>
          <View style={styles.totalCardRight}>
            <Text style={styles.totalCardHint}>View Breakdown</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textMuted} />
          </View>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>
          Attachments{activeFilter !== 'all' ? ` · ${activeFilterDef?.label}` : ''} ({filteredAttachments.length})
        </Text>

        {filteredAttachments.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>{emptyCopy.emoji}</Text>
            <Text style={styles.emptyTitle}>{emptyCopy.title}</Text>
            <Text style={styles.emptySub}>{emptyCopy.sub}</Text>
          </View>
        ) : (
          filteredAttachments.map((item) => (
            <AttachmentStatusCard
              key={item.attachmentId}
              item={item}
              busy={busy}
              onViewDetails={() => handleViewDetails(item)}
              onRemove={() => handleRemove(item)}
            />
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={handleAddAttachment} activeOpacity={0.88}>
        <MaterialCommunityIcons name="plus" size={18} color={colors.textPrimary} />
        <Text style={styles.fabText}>Add Attachment</Text>
      </TouchableOpacity>

      <BreakdownModal
        visible={showBreakdown}
        onClose={() => setShowBreakdown(false)}
        groups={breakdownGroups}
        grandTotal={grandTotal}
      />

      {busy && (
        <View style={styles.busyOverlay}>
          <ActivityIndicator color={colors.accentAmber} />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    gap: 10,
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

  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  filterChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
  },
  filterChipActive: { backgroundColor: colors.textPrimary },
  filterChipText:   { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  filterChipTextActive: { color: colors.white },
  filterBadge: {
    minWidth: 15, height: 15, borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  filterBadgeActive: { backgroundColor: colors.accentAmber },
  filterBadgeText: { fontSize: 9, fontWeight: '800', color: colors.textSecondary },
  filterBadgeTextActive: { color: colors.textPrimary },

  scroll: { paddingTop: 18, paddingHorizontal: 20, paddingBottom: 110 },

  totalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: colors.border,
  },
  totalCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  totalIconWrap: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: colors.accentAmberSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  totalLabel: { fontSize: 12, fontWeight: '600', color: colors.textMuted, marginBottom: 2 },
  totalAmount: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  totalCardRight: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  totalCardHint: { fontSize: 12, fontWeight: '700', color: colors.accentAmber },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginBottom: 14 },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 16 },
  emptyEmoji: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginBottom: 6 },
  emptySub:   { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 18, fontWeight: '500' },

  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardAccent: { width: 5 },
  cardBody:   { flex: 1, padding: 14 },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  typeBadge:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  typeBadgeText:  { fontSize: 10, fontWeight: '700' },
  serviceName:    { fontSize: 15, fontWeight: '800', color: colors.textPrimary, marginBottom: 6 },
  locationRow:    { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 10 },
  locationText:   { fontSize: 12, color: colors.textMuted },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amountText: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  idText:     { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentAmberSoft,
    paddingVertical: 9,
    borderRadius: 10,
  },
  actionBtnText: { fontSize: 12, fontWeight: '700', color: colors.accentAmber },
  removeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(224,59,59,0.08)',
    paddingVertical: 9,
    borderRadius: 10,
  },
  removeBtnText: { fontSize: 12, fontWeight: '700', color: colors.danger },

  fab: {
    position: 'absolute',
    right: 18,
    bottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accentAmber,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 28,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  fabText: { fontSize: 13, fontWeight: '800', color: colors.textPrimary },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(26,24,20,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
    maxHeight: '75%',
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: colors.textPrimary },
  modalCloseBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  modalScroll: { flexGrow: 0 },
  modalScrollContent: { paddingBottom: 8 },
  emptyHint: { fontSize: 13, color: colors.textMuted, fontWeight: '500', paddingVertical: 16, textAlign: 'center' },

  breakdownGroup: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  breakdownGroupTitle: {
    fontSize: 12, fontWeight: '700', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
  },
  breakdownRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  breakdownRowTitle:  { flex: 1, fontSize: 13, fontWeight: '600', color: colors.textPrimary, marginRight: 10 },
  breakdownRowAmount: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  breakdownSubtotalRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 8,
  },
  breakdownSubtotalLabel:  { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  breakdownSubtotalAmount: { fontSize: 13, fontWeight: '800', color: colors.accentAmber },

  modalGrandTotalRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 6, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: colors.borderLight,
  },
  modalGrandTotalLabel:  { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  modalGrandTotalAmount: { fontSize: 18, fontWeight: '900', color: colors.accentAmber },

  busyOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(250,250,247,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
});

export default ProjectDetailScreen;