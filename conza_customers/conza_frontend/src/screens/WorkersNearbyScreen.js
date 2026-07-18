import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Modal,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import useAppStore, { EMPTY_ARRAY } from '../store/useAppStore';
import { WorkerListSkeleton, ErrorState, EmptyState } from '../components/LoadingState';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { socket } from '../utils/socket';

// ─── Worker Card ──────────────────────────────────────────────────────────────
const VERIFIED_GREEN = '#16A34A';
const VERIFIED_GREEN_SOFT = 'rgba(22,163,74,0.10)';

const WorkerCard = React.memo(({ worker, isSelected, onToggle }) => {
  const handleToggle = useCallback(() => onToggle(worker), [onToggle, worker]);

  const gradientColors = useMemo(() =>
    isSelected ? [colors.gradientStart, colors.gradientEnd] : ['#D0CDFF', '#A89CFF'],
    [isSelected]
  );

  const cardStyle = useMemo(() => [
    styles.card,
    isSelected && styles.cardSelected
  ], [isSelected]);

  const checkboxStyle = useMemo(() => [
    styles.checkbox,
    isSelected && styles.checkboxSelected
  ], [isSelected]);

  const priceSegments = useMemo(() => {
    const segs = [
      { label: 'Per Hour', value: Number(worker.pricePerDay) || 0, suffix: '/hr' },
    ];
    if (worker.perDayCharge) segs.push({ label: 'Per Day', value: Number(worker.perDayCharge), suffix: '/day' });
    return segs;
  }, [worker.pricePerDay, worker.perDayCharge]);

  return (
    <TouchableOpacity
      style={cardStyle}
      onPress={handleToggle}
      activeOpacity={0.85}
    >
      {/* Top row: avatar, name + verified badge, rating, distance, checkbox */}
      <View style={styles.cardTop}>
        <LinearGradient
          colors={gradientColors}
          style={styles.avatar}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.avatarText}>{worker.initials}</Text>
        </LinearGradient>

        <View style={styles.nameBlock}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{worker.name}</Text>
            {worker.isVerified !== false && (
              <View style={styles.verifiedBadge}>
                <MaterialCommunityIcons name="shield-check" size={11} color={VERIFIED_GREEN} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>
          <View style={styles.metaRow}>
            <View style={styles.ratingChip}>
              <Text style={styles.ratingStar}>⭐</Text>
              <Text style={styles.ratingValue}>{worker.rating}</Text>
            </View>
            <View style={styles.distanceChip}>
              <MaterialCommunityIcons name="map-marker" size={11} color={colors.textMuted} />
              <Text style={styles.metaText}>{worker.distance}</Text>
            </View>
          </View>
        </View>

        <View style={checkboxStyle}>
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </View>

      {/* Skills */}
      {(worker.skills || []).length > 0 && (
        <View style={styles.skillsRow}>
          {worker.skills.map((skill) => (
            <View key={skill} style={styles.skillTag}>
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.cardDivider} />

      {/* Pricing footer — one clean bar, segments only for charges that exist */}
      <View style={styles.priceFooter}>
        {priceSegments.map((seg, idx) => (
          <React.Fragment key={seg.label}>
            {idx > 0 && <View style={styles.priceDivider} />}
            <View style={styles.priceSegment}>
              <Text style={styles.priceLabel}>{seg.label.toUpperCase()}</Text>
              <Text style={[styles.priceValue, idx === 0 && isSelected && styles.priceValueSelected]}>
                ₹{seg.value}{seg.suffix}
              </Text>
            </View>
          </React.Fragment>
        ))}
      </View>
    </TouchableOpacity>
  );
});

// ─── Filter Chip ──────────────────────────────────────────────────────────────
const FilterChip = React.memo(({ label, active, onPress }) => {
  const chipStyle = useMemo(() => [
    styles.filterChip, 
    active && styles.filterChipActive
  ], [active]);

  const textStyle = useMemo(() => [
    styles.filterChipText, 
    active && styles.filterChipTextActive
  ], [active]);

  return (
    <TouchableOpacity
      style={chipStyle}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={textStyle}>{label}</Text>
    </TouchableOpacity>
  );
});

const AutoBookCard = React.memo(({ category, onPress }) => (
  <LinearGradient
    colors={[colors.gradientStart, colors.gradientEnd]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={styles.autoBookCard}
  >
    <TouchableOpacity
      style={styles.autoBookTouchable}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={styles.autoBookContent}>
        <Text style={styles.autoBookTitle}>⚡ Quick Auto Book</Text>
        <View style={styles.autoBookBtn}>
          <Text style={styles.autoBookBtnText}>Book Now →</Text>
        </View>
      </View>
    </TouchableOpacity>
  </LinearGradient>
));

// ─── Main Screen ──────────────────────────────────────────────────────────────
const WorkersNearbyScreen = ({ route, navigation }) => {
  const category = route?.params?.category;
  
  const allWorkers = useAppStore((s) => (category ? s.workersByCategory[category] : null) || EMPTY_ARRAY);
  const labourLoading = useAppStore((s) => s.labourLoading);
  const labourError   = useAppStore((s) => s.labourError);
  const fetchWorkersByCategory = useAppStore((s) => s.fetchWorkersByCategory);

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWorkersByCategory(category);
    setRefreshing(false);
  }, [category, fetchWorkersByCategory]);

  // Fetch workers for this category when screen mounts
  useEffect(() => {
    if (category) {
      fetchWorkersByCategory(category);
    }
  }, [category, fetchWorkersByCategory]);

  // Join the workers_watch_room so this screen receives real-time
  // worker_availability_changed and worker_went_offline events.
  useEffect(() => {
    socket.emit('join_workers_watch');
    // No leave needed — being in the room is harmless when navigating away,
    // and the store handles state updates globally.
  }, []);

  const [selected, setSelected] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [quantity, setQuantity]   = useState(1);

  const displayed = allWorkers;

  const toggleWorker = useCallback((worker) => {
    setSelected((prev) =>
      prev.find((w) => w._id === worker._id)
        ? prev.filter((w) => w._id !== worker._id)
        : [...prev, worker]
    );
  }, []);

  const totalPerDay = useMemo(() => 
    selected.reduce((sum, w) => sum + (Number(w.pricePerDay) || 0), 0),
    [selected]
  );

  const renderItem = useCallback(({ item }) => (
    <WorkerCard
      worker={item}
      isSelected={!!selected.find((w) => w._id === item._id)}
      onToggle={toggleWorker}
    />
  ), [selected, toggleWorker]);

  const handleFilterAll = useCallback(() => setFilterAvail('All'), []);
  const handleFilterAvailable = useCallback(() => setFilterAvail('Available'), []);
  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);
  const handleOpenModal = useCallback(() => setShowModal(true), []);
  const handleCloseModal = useCallback(() => setShowModal(false), []);
  
  const handleIncrement = useCallback(() => setQuantity((q) => Math.min(10, q + 1)), []);
  const handleDecrement = useCallback(() => setQuantity((q) => Math.max(1, q - 1)), []);

  const handleCheckout = useCallback(() => {
    navigation.navigate('LabourCheckout', {
      selectedWorkers: selected,
      category,
    });
  }, [navigation, selected, category]);

  const listHeader = null;

  const listEmpty = useMemo(() => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>🔍</Text>
      <Text style={styles.emptyText}>No workers available right now</Text>
      <Text style={styles.emptySub}>Check back soon or try a different filter</Text>
    </View>
  ), []);

  if (!category) return <ErrorState message="No category selected" onRetry={() => navigation.goBack()} />;
  if (labourLoading && !refreshing) return <WorkerListSkeleton />;
  if (labourError)   return <ErrorState message={labourError} onRetry={() => fetchWorkersByCategory(category)} />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.fixedTopSection}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleGoBack}
            activeOpacity={0.7}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{category}s Nearby</Text>
            <Text style={styles.headerSub}>Select one or more workers</Text>
          </View>
        </View>

        <AutoBookCard category={category} onPress={handleOpenModal} />
        
        <View style={styles.divider} />
      </View>

      <FlatList
        data={displayed}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews={true}
        extraData={selected}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.accentAmber]}
            tintColor={colors.accentAmber}
          />
        }
      />

      {selected.length > 0 && (
        <View style={styles.bottomBar}>
          <Text style={styles.selectedCount}>
            {selected.length} worker{selected.length > 1 ? 's' : ''} selected
          </Text>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.checkoutBtn}
          >
            <TouchableOpacity
              style={styles.checkoutTouchable}
              activeOpacity={0.85}
              onPress={handleCheckout}
            >
              <Text style={styles.checkoutText}>Proceed to Checkout →</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleCloseModal}
        >
          <TouchableOpacity style={styles.modalSheet} activeOpacity={1}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              How many {category}s do you need?
            </Text>
            <Text style={styles.modalSub}>
              We'll match you with the highest-rated workers nearby
            </Text>
            <View style={styles.counterRow}>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={handleDecrement}
                activeOpacity={0.75}
              >
                <Text style={styles.counterBtnText}>−</Text>
              </TouchableOpacity>
              <View style={styles.counterDisplay}>
                <Text style={styles.counterValue}>{quantity}</Text>
                <Text style={styles.counterLabel}>
                  {category}{quantity > 1 ? 's' : ''}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={handleIncrement}
                activeOpacity={0.75}
              >
                <Text style={styles.counterBtnText}>+</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalNote}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 5 }}>
                <MaterialCommunityIcons name="map-marker" size={14} color={colors.textMuted} style={{ marginTop: 1 }} />
                <Text style={[styles.modalNoteText, { flex: 1 }]}>
                  Workers with valid Labour Cards will be prioritized for your safety.
                </Text>
              </View>
            </View>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.modalConfirmBtn}
            >
              <TouchableOpacity
                style={styles.checkoutTouchable}
                activeOpacity={0.85}
                onPress={handleCloseModal}
              >
                <Text style={styles.checkoutText}>
                  Book {quantity} {category}{quantity > 1 ? 's' : ''} →
                </Text>
              </TouchableOpacity>
            </LinearGradient>
            <TouchableOpacity
              onPress={handleCloseModal}
              style={styles.modalCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  fixedTopSection: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingBottom: 10,
    zIndex: 10,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    gap: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  backArrow: { fontSize: 18, color: colors.textPrimary, fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  headerSub: { fontSize: 12, color: colors.textMuted, fontWeight: '500', marginTop: 2 },
  divider: { height: 1, backgroundColor: 'transparent' },

  // Filters
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 0, // Parent list has 20
    paddingTop: 14,
    paddingBottom: 6,
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.accentYellowSoft,
    borderColor: colors.accentYellow,
  },
  filterChipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  filterChipTextActive: { color: colors.accentAmber },

  // List
  list: { paddingTop: 0, paddingHorizontal: 20, paddingBottom: 120 },

  // Worker Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardSelected: {
    borderColor: colors.accentYellow,
    backgroundColor: '#FFFDF0',
    shadowColor: colors.accentAmber,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },

  // Top row
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: 16, fontWeight: '800', color: colors.white, letterSpacing: 0.5 },
  nameBlock: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  name: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.1,
    flexShrink: 1,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  ratingStar: { fontSize: 10 },
  ratingValue: { fontSize: 11, fontWeight: '700', color: colors.textPrimary },
  distanceChip: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  checkbox: {
    width: 24,
    height: 24,
    minWidth: 24,
    minHeight: 24,
    maxWidth: 24,
    maxHeight: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 24,
    overflow: 'hidden',
  },
  checkboxSelected: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  checkmark: { fontSize: 13, color: colors.white, fontWeight: '800', textAlign: 'center', includeFontPadding: false },

  // Verified badge
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    flexShrink: 0,
    gap: 3,
    backgroundColor: VERIFIED_GREEN_SOFT,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(22,163,74,0.2)',
  },
  verifiedText: { fontSize: 9.5, fontWeight: '700', color: VERIFIED_GREEN, letterSpacing: 0.1 },

  // Skills
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  skillTag: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  skillText: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },

  // Divider
  cardDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginBottom: 12,
  },

  // Pricing footer
  priceFooter: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  priceSegment: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  priceDivider: { width: 1, backgroundColor: colors.borderLight, marginVertical: 2 },
  priceLabel: { fontSize: 9, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.4, marginBottom: 3 },
  priceValue: { fontSize: 14, fontWeight: '800', color: colors.textSecondary },
  priceValueSelected: { color: colors.accentAmber },

  // Empty
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 44, marginBottom: 14 },
  emptyText: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  emptySub: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 30 },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  selectedCount: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 12 },
  checkoutBtn: { borderRadius: 16, overflow: 'hidden' },
  checkoutTouchable: { paddingVertical: 16, alignItems: 'center' },
  checkoutText: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.3 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: colors.border,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSub: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 30,
    marginBottom: 32,
  },
  counterBtn: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  counterBtnText: { fontSize: 24, color: colors.textPrimary, fontWeight: '600' },
  counterDisplay: { alignItems: 'center', minWidth: 100 },
  counterValue: { fontSize: 32, fontWeight: '900', color: colors.textPrimary },
  counterLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginTop: 2 },
  modalNote: {
    backgroundColor: colors.accentYellowSoft,
    padding: 16,
    borderRadius: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: colors.accentYellow,
  },
  modalNoteText: { fontSize: 13, color: colors.accentAmber, fontWeight: '600', lineHeight: 18, textAlign: 'center' },
  modalConfirmBtn: { borderRadius: 18, overflow: 'hidden' },
  modalCancel: { marginTop: 16, alignItems: 'center' },
  modalCancelText: { fontSize: 14, fontWeight: '700', color: colors.textMuted },

  // Auto Book Card
  autoBookCard: {
    marginTop: 0,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.accentAmber,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 14,
  },
  autoBookTouchable: { padding: 12 },
  autoBookContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  autoBookTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  autoBookBtn: {
    backgroundColor: 'rgba(0,0,0,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  autoBookBtnText: { color: colors.textPrimary, fontSize: 12, fontWeight: '800' },

});

export default WorkersNearbyScreen;