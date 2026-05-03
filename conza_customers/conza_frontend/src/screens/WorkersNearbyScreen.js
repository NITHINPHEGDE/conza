import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { workersByCategory } from '../data/dummyData';
import { colors } from '../theme/colors';

// ─── Worker Card ──────────────────────────────────────────────────────────────
const WorkerCard = React.memo(({ worker, isSelected, onToggle }) => {
  const handleToggle = useCallback(() => onToggle(worker), [onToggle, worker]);

  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={handleToggle}
      activeOpacity={0.82}
    >
      {/* Top Row — Avatar + Name + Checkbox */}
      <View style={styles.cardTop}>
        <LinearGradient
          colors={isSelected
            ? [colors.gradientStart, colors.gradientEnd]
            : ['#D0CDFF', '#A89CFF']}
          style={styles.avatar}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.avatarText}>{worker.initials}</Text>
        </LinearGradient>

        <View style={styles.nameBlock}>
          <Text style={styles.name}>{worker.name}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>⭐ {worker.rating}</Text>
            <View style={styles.metaDot} />
            <Text style={styles.metaText}>📍 {worker.distance}</Text>
          </View>
        </View>

        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </View>

      {/* Divider */}
      <View style={styles.cardDivider} />

      {/* Bottom Row — Skills + Price */}
      <View style={styles.cardBottom}>
        <View style={styles.skillsRow}>
          {worker.skills.map((s) => (
            <View key={s} style={styles.skillTag}>
              <Text style={styles.skillText}>{s}</Text>
            </View>
          ))}
        </View>
        <Text style={[styles.price, isSelected && styles.priceSelected]}>
          ₹{worker.pricePerDay}/day
        </Text>
      </View>
    </TouchableOpacity>
  );
});

// ─── Filter Chip ──────────────────────────────────────────────────────────────
const FilterChip = React.memo(({ label, active, onPress }) => (
  <TouchableOpacity
    style={[styles.filterChip, active && styles.filterChipActive]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
));

// ─── Main Screen ──────────────────────────────────────────────────────────────
const WorkersNearbyScreen = ({ route, navigation }) => {
  const { category } = route.params;
  const allWorkers = useMemo(() => workersByCategory[category] || [], [category]);

  const [selected, setSelected]       = useState([]);
  const [filterAvail, setFilterAvail] = useState('All');

  const displayed = useMemo(() =>
    filterAvail === 'Available'
      ? allWorkers.filter((w) => w.available)
      : allWorkers
  , [allWorkers, filterAvail]);

  const toggleWorker = useCallback((worker) => {
    setSelected((prev) =>
      prev.find((w) => w.id === worker.id)
        ? prev.filter((w) => w.id !== worker.id)
        : [...prev, worker]
    );
  }, []);

  const totalPerDay = useMemo(() => selected.reduce((sum, w) => sum + w.pricePerDay, 0), [selected]);

  const renderItem = useCallback(({ item }) => (
    <WorkerCard
      worker={item}
      isSelected={!!selected.find((w) => w.id === item.id)}
      onToggle={toggleWorker}
    />
  ), [selected, toggleWorker]);

  const handleFilterAll = useCallback(() => setFilterAvail('All'), []);
  const handleFilterAvailable = useCallback(() => setFilterAvail('Available'), []);

  const handleCheckout = useCallback(() => {
    navigation.navigate('LabourCheckout', {
      selectedWorkers: selected,
      category,
    });
  }, [navigation, selected, category]);

  const ListHeader = useMemo(() => (
    <View style={styles.filterRow}>
      <FilterChip
        label={`All (${allWorkers.length})`}
        active={filterAvail === 'All'}
        onPress={handleFilterAll}
      />
      <FilterChip
        label="🟢  Available Now"
        active={filterAvail === 'Available'}
        onPress={handleFilterAvailable}
      />
    </View>
  ), [allWorkers.length, filterAvail, handleFilterAll, handleFilterAvailable]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{category}s Nearby</Text>
          <Text style={styles.headerSub}>Select one or more workers</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <FlatList
        data={displayed}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyText}>No workers available right now</Text>
            <Text style={styles.emptySub}>Check back soon or try a different filter</Text>
          </View>
        }
      />

      {/* Bottom bar */}
      {selected.length > 0 && (
        <View style={styles.bottomBar}>
          <View style={styles.bottomBarInfo}>
            <Text style={styles.selectedCount}>
              {selected.length} worker{selected.length > 1 ? 's' : ''} selected
            </Text>
            <Text style={styles.totalPrice}>₹{totalPerDay}/day</Text>
          </View>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

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
  divider: { height: 1, backgroundColor: colors.borderLight },

  // Filters
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
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
  list: { paddingTop: 10, paddingHorizontal: 20, paddingBottom: 120 },

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
  nameBlock: { flex: 1 },
  name: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 5,
    letterSpacing: 0.1,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  metaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.textMuted },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxSelected: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  checkmark: { fontSize: 13, color: colors.white, fontWeight: '800', lineHeight: 16 },

  // Divider
  cardDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 12,
  },

  // Bottom row
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
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
  price: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textSecondary,
    flexShrink: 0,
  },
  priceSelected: { color: colors.accentAmber },

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
  bottomBarInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  selectedCount: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  totalPrice: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  checkoutBtn: { borderRadius: 16, overflow: 'hidden' },
  checkoutTouchable: { paddingVertical: 16, alignItems: 'center' },
  checkoutText: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.3 },
});

export default WorkersNearbyScreen;