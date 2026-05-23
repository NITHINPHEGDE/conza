import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Image, Switch, ScrollView, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import useModeStore from '../store/useModeStore';
import useVendorStore from '../store/useVendorStore';
import ModeToggle from '../components/ModeToggle';
import { colors } from '../theme/colors';



// ── Category configs ──────────────────────────────────────────────────────────
const MAT_CATEGORY_COLORS = {
  Cement: { bg: '#FFF7ED', color: '#F97316' },
  Steel: { bg: '#EFF6FF', color: '#3B82F6' },
  Sand: { bg: '#FEFCE8', color: '#EAB308' },
  Bricks: { bg: '#FEF2F2', color: '#EF4444' },
  Aggregate: { bg: '#F0FDF4', color: '#22C55E' },
};
const MAT_CATEGORY_EMOJI = { Cement: '🏗️', Steel: '⚙️', Sand: '🪨', Bricks: '🧱', Aggregate: '🪵' };

const RENTAL_CATEGORY_COLORS = {
  'Concrete Equipment': { bg: '#F0FDF4', color: '#16A34A' },
  'Scaffolding': { bg: '#EFF6FF', color: '#3B82F6' },
  'Earthmoving': { bg: '#FEF3C7', color: '#D97706' },
  'Lifting Equipment': { bg: '#F5F3FF', color: '#7C3AED' },
  'Compaction': { bg: '#FFF7ED', color: '#EA580C' },
  'Power Tools': { bg: '#EFF6FF', color: '#2563EB' },
  'Lighting': { bg: '#FEFCE8', color: '#CA8A04' },
  'Formwork': { bg: '#FDF4FF', color: '#9333EA' },
  'Safety Equipment': { bg: '#F0FDF4', color: '#15803D' },
  'Other': { bg: colors.surfaceElevated, color: colors.textMuted },
};
const RENTAL_CATEGORY_EMOJI = {
  'Concrete Equipment': '🏗️', 'Scaffolding': '🪜', 'Earthmoving': '🚜',
  'Lifting Equipment': '🏋️', 'Compaction': '🔨', 'Power Tools': '🔧',
  'Lighting': '💡', 'Formwork': '🪵', 'Safety Equipment': '🦺', 'Other': '📦',
};

const MAT_TABS = ['All', 'Active', 'Inactive', 'Low Stock'];
const RENTAL_TABS = ['All', 'Active', 'Inactive', 'Available', 'Rented Out'];

// ── Material Product Card ─────────────────────────────────────────────────────
const MaterialCard = ({ item, onToggleStatus, onDelete }) => {
  const stockColor = item.stock === 0 ? colors.red : item.lowStock ? colors.orange : colors.green;
  const stockBg = item.stock === 0 ? colors.redSoft : item.lowStock ? colors.orangeSoft : colors.greenSoft;
  const stockLabel = item.stock === 0 ? 'Out of Stock' : item.lowStock ? 'Low Stock' : 'In Stock';
  const stockIcon = item.stock === 0 ? '❌' : item.lowStock ? '⚠️' : '✅';
  const catStyle = MAT_CATEGORY_COLORS[item.category] || { bg: colors.surfaceElevated, color: colors.textMuted };
  const catEmoji = MAT_CATEGORY_EMOJI[item.category] || '📦';

  return (
    <View style={[styles.card, !item.active && styles.cardInactive]}>
      <View style={styles.imageBox}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: catStyle.bg }]}>
            <Text style={styles.placeholderEmoji}>{catEmoji}</Text>
            <Text style={[styles.placeholderCategory, { color: catStyle.color }]}>{item.category}</Text>
          </View>
        )}
        <View style={[styles.statusPill, { backgroundColor: item.active ? colors.greenSoft : colors.redSoft }]}>
          <View style={[styles.statusDot, { backgroundColor: item.active ? colors.green : colors.red }]} />
          <Text style={[styles.statusPillText, { color: item.active ? colors.green : colors.red }]}>
            {item.active ? 'Active' : 'Inactive'}
          </Text>
        </View>
        <View style={styles.skuPill}>
          <Text style={styles.skuPillText}>{item.sku}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.nameRow}>
          <View style={styles.nameBlock}>
            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.brandText}>{item.brand}</Text>
          </View>
          <Switch
            value={item.active}
            onValueChange={() => onToggleStatus(item.id)}
            trackColor={{ false: colors.border, true: 'rgba(240,165,0,0.3)' }}
            thumbColor={item.active ? colors.accentAmber : '#ccc'}
            style={styles.switch}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.priceStockRow}>
          <View>
            <Text style={styles.priceLabel}>Price</Text>
            <Text style={styles.priceText}>
              ₹{item.price.toLocaleString('en-IN')}
              <Text style={styles.unitText}> /{item.unit}</Text>
            </Text>
          </View>
          <View style={styles.stockBlock}>
            <Text style={styles.priceLabel}>Stock</Text>
            <View style={[styles.stockBadge, { backgroundColor: stockBg }]}>
              <Text style={styles.stockIcon}>{stockIcon}</Text>
              <Text style={[styles.stockText, { color: stockColor }]}>{stockLabel} · {item.stock}</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}><Text style={styles.statValue}>{item.sold}</Text><Text style={styles.statLabel}>Sold</Text></View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}><Text style={styles.statValue}>{item.stock}</Text><Text style={styles.statLabel}>In Stock</Text></View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}><Text style={styles.statValue}>₹{(item.price * item.sold).toLocaleString('en-IN')}</Text><Text style={styles.statLabel}>Revenue</Text></View>
        </View>

        <Text style={styles.descText} numberOfLines={1}>{item.description}</Text>
        <View style={styles.divider} />

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.editBtn} activeOpacity={0.8}>
            <Text style={styles.editBtnText}>✏️  Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(item.id)} activeOpacity={0.8}>
            <Text style={styles.deleteBtnText}>🗑️  Delete</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8}>
            <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.viewBtn}>
              <Text style={styles.viewBtnText}>👁️  View</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// ── Rental Equipment Card ─────────────────────────────────────────────────────
const RentalCard = ({ item, onToggleStatus, onDelete }) => {
  const available = item.totalUnits - item.rentedOut;
  const allRented = available === 0;
  const catStyle = RENTAL_CATEGORY_COLORS[item.category] || { bg: colors.surfaceElevated, color: colors.textMuted };
  const catEmoji = RENTAL_CATEGORY_EMOJI[item.category] || '📦';

  const availColor = allRented ? colors.red : available <= 1 ? colors.orange : colors.green;
  const availBg = allRented ? colors.redSoft : available <= 1 ? colors.orangeSoft : colors.greenSoft;
  const availLabel = allRented ? 'All Rented Out' : `${available} Available`;
  const availIcon = allRented ? '❌' : available <= 1 ? '⚠️' : '✅';

  return (
    <View style={[styles.card, !item.active && styles.cardInactive]}>

      {/* Image area */}
      <View style={styles.imageBox}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: catStyle.bg }]}>
            <Text style={styles.placeholderEmoji}>{catEmoji}</Text>
            <Text style={[styles.placeholderCategory, { color: catStyle.color }]}>{item.category}</Text>
          </View>
        )}

        <View style={[styles.statusPill, { backgroundColor: item.active ? colors.greenSoft : colors.redSoft }]}>
          <View style={[styles.statusDot, { backgroundColor: item.active ? colors.green : colors.red }]} />
          <Text style={[styles.statusPillText, { color: item.active ? colors.green : colors.red }]}>
            {item.active ? 'Active' : 'Inactive'}
          </Text>
        </View>

        <View style={styles.skuPill}>
          <Text style={styles.skuPillText}>{item.sku}</Text>
        </View>

        {/* Rental tag */}
        <View style={styles.rentalTag}>
          <Text style={styles.rentalTagText}>🏗️ Rental</Text>
        </View>
      </View>

      <View style={styles.cardBody}>

        {/* Name + Toggle */}
        <View style={styles.nameRow}>
          <View style={styles.nameBlock}>
            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.brandText}>{item.brand}</Text>
          </View>
          <Switch
            value={item.active}
            onValueChange={() => onToggleStatus(item.id)}
            trackColor={{ false: colors.border, true: 'rgba(240,165,0,0.3)' }}
            thumbColor={item.active ? colors.accentAmber : '#ccc'}
            style={styles.switch}
          />
        </View>

        <View style={styles.divider} />

        {/* Price + Availability */}
        <View style={styles.priceStockRow}>
          <View>
            <Text style={styles.priceLabel}>Rental Rate</Text>
            <Text style={styles.priceText}>
              ₹{item.pricePerDay.toLocaleString('en-IN')}
              <Text style={styles.unitText}> /day</Text>
            </Text>
            <Text style={styles.depositText}>Deposit: ₹{item.deposit.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.stockBlock}>
            <Text style={styles.priceLabel}>Availability</Text>
            <View style={[styles.stockBadge, { backgroundColor: availBg }]}>
              <Text style={styles.stockIcon}>{availIcon}</Text>
              <Text style={[styles.stockText, { color: availColor }]}>{availLabel}</Text>
            </View>
          </View>
        </View>

        {/* Fleet strip */}
        <View style={styles.fleetStrip}>
          <View style={styles.fleetCell}>
            <Text style={styles.fleetValue}>{item.totalUnits}</Text>
            <Text style={styles.fleetLabel}>Total Fleet</Text>
          </View>
          <View style={styles.fleetDivider} />
          <View style={styles.fleetCell}>
            <Text style={[styles.fleetValue, { color: colors.orange }]}>{item.rentedOut}</Text>
            <Text style={styles.fleetLabel}>Rented Out</Text>
          </View>
          <View style={styles.fleetDivider} />
          <View style={styles.fleetCell}>
            <Text style={[styles.fleetValue, { color: availColor }]}>{available}</Text>
            <Text style={styles.fleetLabel}>Available</Text>
          </View>
          <View style={styles.fleetDivider} />
          <View style={styles.fleetCell}>
            <Text style={[styles.fleetValue, { color: colors.indigo }]}>
              {item.minDays}–{item.maxDays}d
            </Text>
            <Text style={styles.fleetLabel}>Duration</Text>
          </View>
        </View>

        {/* Utilisation bar */}
        <View style={styles.utilBlock}>
          <View style={styles.utilHeader}>
            <Text style={styles.utilLabel}>Utilisation</Text>
            <Text style={[styles.utilPct, { color: availColor }]}>
              {Math.round((item.rentedOut / item.totalUnits) * 100)}%
            </Text>
          </View>
          <View style={styles.utilTrack}>
            <View
              style={[styles.utilFill, {
                width: `${(item.rentedOut / item.totalUnits) * 100}%`,
                backgroundColor: availColor,
              }]}
            />
          </View>
        </View>

        <Text style={styles.descText} numberOfLines={1}>{item.description}</Text>
        <View style={styles.divider} />

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.editBtn} activeOpacity={0.8}>
            <Text style={styles.editBtnText}>✏️  Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(item.id)} activeOpacity={0.8}>
            <Text style={styles.deleteBtnText}>🗑️  Delete</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8}>
            <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.viewBtn}>
              <Text style={styles.viewBtnText}>👁️  View</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </View>
    </View>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
const InventoryScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { mode } = useModeStore();

  const {
    fetchInventory, getFilteredInventory, inventoryLoading,
    toggleProductAvailability, deleteProduct,
  } = useVendorStore();
  const inventory = useVendorStore((s) => s.inventory);

  useEffect(() => {
    fetchInventory(mode);
  }, [mode]);

  const isRental = mode === 'rental';
  const [matTab, setMatTab] = useState('All');
  const [rentTab, setRentTab] = useState('All');
  const [search, setSearch] = useState('');

  const items = useMemo(() => {
    return getFilteredInventory(mode);
  }, [inventory, mode]);
  const tabs = isRental ? RENTAL_TABS : MAT_TABS;
  const activeTab = isRental ? rentTab : matTab;
  const setTab = isRental ? setRentTab : setMatTab;

  const handleToggle = async (id) => {
    try {
      await toggleProductAvailability(id);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Product', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteProduct(id);
          } catch (e) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  const tabCounts = useMemo(() => {
    if (isRental) {
      return {
        All: items.length,
        Active: items.filter((i) => i.active).length,
        Inactive: items.filter((i) => !i.active).length,
        Available: items.filter((i) => i.stock > 0).length,
        'Rented Out': items.filter((i) => (i.sold || 0) > 0).length,
      };
    }
    return {
      All: items.length,
      Active: items.filter((i) => i.active).length,
      Inactive: items.filter((i) => !i.active).length,
      'Low Stock': items.filter((i) => i.lowStock || i.stock === 0).length,
    };
  }, [items, isRental]);

  const filtered = useMemo(() => {
    let list = items;
    if (isRental) {
      if (activeTab === 'Active') list = list.filter((i) => i.active);
      if (activeTab === 'Inactive') list = list.filter((i) => !i.active);
      if (activeTab === 'Available') list = list.filter((i) => (i.totalUnits - i.rentedOut) > 0);
      if (activeTab === 'Rented Out') list = list.filter((i) => i.rentedOut > 0);
    } else {
      if (activeTab === 'Active') list = list.filter((i) => i.active);
      if (activeTab === 'Inactive') list = list.filter((i) => !i.active);
      if (activeTab === 'Low Stock') list = list.filter((i) => i.lowStock || i.stock === 0);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) =>
        i.name.toLowerCase().includes(q) ||
        i.brand.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        i.sku.toLowerCase().includes(q)
      );
    }
    return list;
  }, [items, activeTab, search, isRental]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {isRental ? 'Equipment' : 'Inventory'}
        </Text>
        <View style={styles.headerRight}>
          <ModeToggle />
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate(isRental ? 'AddEquipment' : 'AddProduct')}
          >
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.addBtn}
            >
              <Text style={styles.addBtnText}>+ Add</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={isRental ? 'Search equipment, brand, category...' : 'Search name, brand, category, SKU...'}
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setTab(tab)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
              <View style={[styles.tabBadge, activeTab === tab && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, activeTab === tab && styles.tabBadgeTextActive]}>
                  {tabCounts[tab] || 0}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>{isRental ? '🏗️' : '📦'}</Text>
            <Text style={styles.emptyText}>No {isRental ? 'equipment' : 'items'} found</Text>
          </View>
        }
        renderItem={({ item }) =>
          isRental ? (
            <RentalCard item={item} onToggleStatus={handleToggle} onDelete={handleDelete} />
          ) : (
            <MaterialCard item={item} onToggleStatus={handleToggle} onDelete={handleDelete} />
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addBtn: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { fontSize: 12, fontWeight: '800', color: colors.white },

  searchWrap: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceElevated, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1, borderColor: colors.border, gap: 8 },
  searchIcon: { fontSize: 15 },
  searchInput: { flex: 1, fontSize: 13, color: colors.textPrimary, fontWeight: '500' },
  clearIcon: { fontSize: 13, color: colors.textMuted, fontWeight: '700', paddingHorizontal: 2 },

  tabsWrap: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  tabsRow: { paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border, gap: 4 },
  tabActive: { backgroundColor: colors.accentAmberSoft, borderColor: colors.accentAmber },
  tabText: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  tabTextActive: { color: colors.accentAmber, fontWeight: '800' },
  tabBadge: { backgroundColor: colors.borderLight, borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1, minWidth: 18, alignItems: 'center' },
  tabBadgeActive: { backgroundColor: colors.accentAmber },
  tabBadgeText: { fontSize: 9, fontWeight: '800', color: colors.textMuted },
  tabBadgeTextActive: { color: colors.white },

  list: { padding: 16, paddingBottom: 40 },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: { backgroundColor: colors.surface, borderRadius: 20, marginBottom: 16, borderWidth: 1, borderColor: colors.border, elevation: 4, shadowColor: colors.cardShadow, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.09, shadowRadius: 10, overflow: 'hidden' },
  cardInactive: { opacity: 0.55 },

  imageBox: { width: '100%', height: 160, backgroundColor: colors.surfaceElevated, position: 'relative' },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  placeholderEmoji: { fontSize: 44 },
  placeholderCategory: { fontSize: 12, fontWeight: '700' },

  statusPill: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontSize: 10, fontWeight: '800' },
  skuPill: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  skuPillText: { fontSize: 9, fontWeight: '700', color: colors.white },
  rentalTag: { position: 'absolute', bottom: 10, right: 10, backgroundColor: colors.indigoSoft, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: colors.indigo },
  rentalTagText: { fontSize: 9, fontWeight: '800', color: colors.indigo },

  cardBody: { padding: 16 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  nameBlock: { flex: 1, marginRight: 8 },
  itemName: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginBottom: 2 },
  brandText: { fontSize: 11, color: colors.textSecondary, fontWeight: '500' },
  switch: { transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] },

  divider: { height: 1, backgroundColor: colors.borderLight, marginVertical: 12 },

  priceStockRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  priceLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  priceText: { fontSize: 22, fontWeight: '900', color: colors.accentAmber },
  unitText: { fontSize: 12, fontWeight: '500', color: colors.textMuted },
  depositText: { fontSize: 11, color: colors.textSecondary, fontWeight: '500', marginTop: 3 },
  stockBlock: { alignItems: 'flex-end' },
  stockBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  stockIcon: { fontSize: 11 },
  stockText: { fontSize: 11, fontWeight: '700' },

  // Material stats
  statsRow: { flexDirection: 'row', backgroundColor: colors.surfaceElevated, borderRadius: 14, padding: 12, marginBottom: 12, alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 13, fontWeight: '800', color: colors.textPrimary, marginBottom: 2 },
  statLabel: { fontSize: 9, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  statDivider: { width: 1, height: 28, backgroundColor: colors.border },

  // Rental fleet strip
  fleetStrip: { flexDirection: 'row', backgroundColor: colors.surfaceElevated, borderRadius: 14, padding: 12, marginBottom: 12, alignItems: 'center' },
  fleetCell: { flex: 1, alignItems: 'center' },
  fleetValue: { fontSize: 16, fontWeight: '900', color: colors.textPrimary, marginBottom: 2 },
  fleetLabel: { fontSize: 9, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  fleetDivider: { width: 1, height: 28, backgroundColor: colors.border },

  // Utilisation bar
  utilBlock: { marginBottom: 12 },
  utilHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  utilLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  utilPct: { fontSize: 11, fontWeight: '800' },
  utilTrack: { height: 6, backgroundColor: colors.borderLight, borderRadius: 3, overflow: 'hidden' },
  utilFill: { height: '100%', borderRadius: 3 },

  descText: { fontSize: 11, color: colors.textMuted, fontWeight: '500', lineHeight: 16 },

  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  editBtn: { flex: 1, backgroundColor: colors.surfaceElevated, paddingVertical: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  editBtnText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  deleteBtn: { flex: 1, backgroundColor: colors.redSoft, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  deleteBtnText: { fontSize: 11, fontWeight: '700', color: colors.red },
  viewBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  viewBtnText: { fontSize: 11, fontWeight: '700', color: colors.white },

  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 15, color: colors.textMuted, fontWeight: '600', marginTop: 12 },
});

export default InventoryScreen;