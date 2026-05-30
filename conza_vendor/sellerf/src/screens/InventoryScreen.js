import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Image, Switch, ScrollView, Alert, Platform, Modal, Pressable,
  Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
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

// ── Image Carousel ────────────────────────────────────────────────────────────
const ImageCarousel = ({ images, height = 160, placeholderBg, placeholderEmoji, placeholderLabel, placeholderColor }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef(null);
  const validImages = (images || []).filter(Boolean);

  if (validImages.length === 0) {
    return (
      <View style={[carouselStyles.placeholder, { height, backgroundColor: placeholderBg }]}>
        <Text style={carouselStyles.placeholderEmoji}>{placeholderEmoji}</Text>
        <Text style={[carouselStyles.placeholderLabel, { color: placeholderColor }]}>{placeholderLabel}</Text>
      </View>
    );
  }

  if (validImages.length === 1) {
    return <Image source={{ uri: validImages[0] }} style={{ width: '100%', height }} resizeMode="cover" />;
  }

  const onScroll = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width);
    setActiveIdx(idx);
  };

  return (
    <View style={{ width: '100%', height }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ width: '100%', height }}
      >
        {validImages.map((uri, i) => (
          <Image key={i} source={{ uri }} style={{ width: SCREEN_WIDTH - 32, height }} resizeMode="cover" />
        ))}
      </ScrollView>
      {/* Dots */}
      <View style={carouselStyles.dots}>
        {validImages.map((_, i) => (
          <View
            key={i}
            style={[carouselStyles.dot, i === activeIdx && carouselStyles.dotActive]}
          />
        ))}
      </View>
      {/* Image counter */}
      <View style={carouselStyles.counter}>
        <Text style={carouselStyles.counterText}>{activeIdx + 1}/{validImages.length}</Text>
      </View>
    </View>
  );
};

const carouselStyles = StyleSheet.create({
  placeholder:      { alignItems: 'center', justifyContent: 'center', gap: 6 },
  placeholderEmoji: { fontSize: 44 },
  placeholderLabel: { fontSize: 12, fontWeight: '700' },
  dots:             { position: 'absolute', bottom: 8, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 4 },
  dot:              { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive:        { width: 14, backgroundColor: '#FFF' },
  counter:          { position: 'absolute', bottom: 8, right: 10, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  counterText:      { fontSize: 10, color: '#FFF', fontWeight: '700' },
});

const MAT_TABS = ['All', 'Active', 'Inactive', 'Low Stock'];
const RENTAL_TABS = ['All', 'Active', 'Inactive', 'Available', 'Rented Out'];

// ── Material Product Card ─────────────────────────────────────────────────────
const MaterialCard = ({ item, onToggleStatus, onDelete, onEdit, onView }) => {
  const stockColor = item.stock === 0 ? colors.red : item.lowStock ? colors.orange : colors.green;
  const stockBg = item.stock === 0 ? colors.redSoft : item.lowStock ? colors.orangeSoft : colors.greenSoft;
  const stockLabel = item.stock === 0 ? 'Out of Stock' : item.lowStock ? 'Low Stock' : 'In Stock';
  const stockIcon = item.stock === 0 ? '❌' : item.lowStock ? '⚠️' : '✅';
  const catStyle = MAT_CATEGORY_COLORS[item.category] || { bg: colors.surfaceElevated, color: colors.textMuted };
  const catEmoji = MAT_CATEGORY_EMOJI[item.category] || '📦';

  return (
    <View style={[styles.card, !item.active && styles.cardInactive]}>
      <View style={styles.imageBox}>
        <ImageCarousel
          images={item.images && item.images.length > 0 ? item.images : (item.image ? [item.image] : [])}
          height={160}
          placeholderBg={catStyle.bg}
          placeholderEmoji={catEmoji}
          placeholderLabel={item.category}
          placeholderColor={catStyle.color}
        />
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
          <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(item)} activeOpacity={0.8}>
            <Text style={styles.editBtnText}>✏️  Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(item.id)} activeOpacity={0.8}>
            <Text style={styles.deleteBtnText}>🗑️  Delete</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onView(item)} activeOpacity={0.8} style={{ flex: 1 }}>
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
const RentalCard = ({ item, onToggleStatus, onDelete, onEdit, onView }) => {
  const totalUnits = item.stock ?? 0;
  const rentedOut = item.rentedOut ?? 0;
  const available = totalUnits - rentedOut;
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
      {/* Image area */}
      <View style={styles.imageBox}>
        <ImageCarousel
          images={item.images && item.images.length > 0 ? item.images : (item.image ? [item.image] : [])}
          height={160}
          placeholderBg={catStyle.bg}
          placeholderEmoji={catEmoji}
          placeholderLabel={item.category}
          placeholderColor={catStyle.color}
        />

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
              ₹{(item.rentalPrice || item.price || 0).toLocaleString('en-IN')}
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
            <Text style={styles.fleetValue}>{totalUnits}</Text>
            <Text style={styles.fleetLabel}>Total Fleet</Text>
          </View>
          <View style={styles.fleetDivider} />
          <View style={styles.fleetCell}>
            <Text style={[styles.fleetValue, { color: colors.orange }]}>{rentedOut}</Text>
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
              {item.minRentalDays ?? '?'}–{'?'}d
            </Text>
            <Text style={styles.fleetLabel}>Duration</Text>
          </View>
        </View>

        {/* Utilisation bar */}
        <View style={styles.utilBlock}>
          <View style={styles.utilHeader}>
            <Text style={styles.utilLabel}>Utilisation</Text>
            <Text style={[styles.utilPct, { color: availColor }]}>
              {totalUnits > 0 ? Math.round((rentedOut / totalUnits) * 100) : 0}%
            </Text>
          </View>
          <View style={styles.utilTrack}>
            <View
              style={[styles.utilFill, {
                width: `${totalUnits > 0 ? (rentedOut / totalUnits) * 100 : 0}%`,
                backgroundColor: availColor,
              }]}
            />
          </View>
        </View>

        <Text style={styles.descText} numberOfLines={1}>{item.description}</Text>
        <View style={styles.divider} />

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(item)} activeOpacity={0.8}>
            <Text style={styles.editBtnText}>✏️  Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(item.id)} activeOpacity={0.8}>
            <Text style={styles.deleteBtnText}>🗑️  Delete</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onView(item)} activeOpacity={0.8} style={{ flex: 1 }}>
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
  const flatListRef = useRef(null);


   useEffect(() => {
    fetchInventory(mode);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [mode]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchInventory(mode);
    });
    return unsubscribe;
  }, [navigation, mode]);

  const isRental = mode === 'rental';
  const [matTab, setMatTab] = useState('All');
  const [rentTab, setRentTab] = useState('All');
  const [search, setSearch] = useState('');
  const [viewProduct, setViewProduct] = useState(null);
  const [deleteProductItem, setDeleteProductItem] = useState(null);

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

  const handleEdit = (item) => {
    if (isRental) {
      navigation.navigate('EditEquipment', { item });
    } else {
      navigation.navigate('EditProduct', { item });
    }
  };

  const handleView = (item) => {
    setViewProduct(item);
  };

  const handleDelete = (id) => {
    const product = inventory.find((p) => p.id === id);
    if (product) {
      setDeleteProductItem(product);
    }
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
        ref={flatListRef}
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
            <RentalCard item={item} onToggleStatus={handleToggle} onDelete={handleDelete} onEdit={handleEdit} onView={handleView} />
          ) : (
            <MaterialCard item={item} onToggleStatus={handleToggle} onDelete={handleDelete} onEdit={handleEdit} onView={handleView} />
          )
        }
      />

      {/* View Details Modal */}
      {viewProduct && (
        <Modal
          visible={!!viewProduct}
          transparent
          animationType="fade"
          onRequestClose={() => setViewProduct(null)}
        >
          <Pressable 
            style={styles.modalOverlay} 
            onPress={() => setViewProduct(null)}
          >
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              {/* Header / Image Section */}
             {/* Header / Image Section */}
              <View style={styles.modalHeader}>
                <ImageCarousel
                  images={viewProduct.images && viewProduct.images.length > 0 ? viewProduct.images : (viewProduct.image ? [viewProduct.image] : [])}
                  height={220}
                  placeholderBg={colors.surfaceElevated}
                  placeholderEmoji={viewProduct.type === 'rental' ? '🏗️' : '📦'}
                  placeholderLabel={viewProduct.category || ''}
                  placeholderColor={colors.textMuted}
                />
                <TouchableOpacity style={styles.modalCloseIconBtn} onPress={() => setViewProduct(null)}>
                  <Text style={styles.modalCloseIconText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
                {/* Product Title and Brand */}
                <Text style={styles.modalTitle}>{viewProduct.name}</Text>
                {viewProduct.brand ? (
                  <Text style={styles.modalBrand}>Brand: {viewProduct.brand}</Text>
                ) : null}

                {/* Category & Status tags */}
                <View style={styles.modalBadgeRow}>
                  <View style={styles.modalCategoryBadge}>
                    <Text style={styles.modalCategoryText}>
                      {viewProduct.category}
                    </Text>
                  </View>
                  <View style={[styles.modalStatusBadge, { backgroundColor: viewProduct.active ? colors.greenSoft : colors.redSoft }]}>
                    <Text style={[styles.modalStatusText, { color: viewProduct.active ? colors.green : colors.red }]}>
                      {viewProduct.active ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalDivider} />

                {/* Grid Specifications */}
                <View style={styles.modalGrid}>
                  {viewProduct.type === 'rental' ? (
                    <>
                      <View style={styles.modalGridCell}>
                        <Text style={styles.modalCellLabel}>Rental Rate</Text>
                        <Text style={styles.modalCellValue}>₹{(viewProduct.rentalPrice || viewProduct.price || 0).toLocaleString('en-IN')}/day</Text>
                      </View>
                      <View style={styles.modalGridCell}>
                        <Text style={styles.modalCellLabel}>Security Deposit</Text>
                        <Text style={styles.modalCellValue}>₹{(viewProduct.deposit || 0).toLocaleString('en-IN')}</Text>
                      </View>
                      <View style={styles.modalGridCell}>
                        <Text style={styles.modalCellLabel}>Min Rental Days</Text>
                        <Text style={styles.modalCellValue}>{viewProduct.minRentalDays || 1} days</Text>
                      </View>
                      <View style={styles.modalGridCell}>
                        <Text style={styles.modalCellLabel}>Total Fleet</Text>
                        <Text style={styles.modalCellValue}>{viewProduct.stock} units</Text>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.modalGridCell}>
                        <Text style={styles.modalCellLabel}>Price</Text>
                        <Text style={styles.modalCellValue}>₹{(viewProduct.price || 0).toLocaleString('en-IN')}</Text>
                      </View>
                      <View style={styles.modalGridCell}>
                        <Text style={styles.modalCellLabel}>Unit</Text>
                        <Text style={styles.modalCellValue}>{viewProduct.unit || 'piece'}</Text>
                      </View>
                      <View style={styles.modalGridCell}>
                        <Text style={styles.modalCellLabel}>Stock Status</Text>
                        <Text style={styles.modalCellValue}>{viewProduct.stock} in stock</Text>
                      </View>
                      <View style={styles.modalGridCell}>
                        <Text style={styles.modalCellLabel}>SKU</Text>
                        <Text style={styles.modalCellValue}>{viewProduct.sku || '—'}</Text>
                      </View>
                    </>
                  )}
                </View>

                {/* Description */}
                <Text style={styles.modalSectionTitle}>Description</Text>
                <Text style={styles.modalDescText}>
                  {viewProduct.description || 'No description provided for this listing.'}
                </Text>
              </ScrollView>

              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setViewProduct(null)}>
                <Text style={styles.modalCloseBtnText}>Close Details</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteProductItem && (
        <Modal
          visible={!!deleteProductItem}
          transparent
          animationType="fade"
          onRequestClose={() => setDeleteProductItem(null)}
        >
          <Pressable 
            style={styles.modalOverlay} 
            onPress={() => setDeleteProductItem(null)}
          >
            <View style={styles.confirmContent} onStartShouldSetResponder={() => true}>
              <View style={styles.warningIconBg}>
                <Text style={styles.warningIconText}>⚠️</Text>
              </View>
              <Text style={styles.confirmTitle}>Delete Listing?</Text>
              <Text style={styles.confirmMessage}>
                Are you sure you want to permanently delete <Text style={styles.confirmBoldText}>"{deleteProductItem.name}"</Text>? This action cannot be undone and will remove the listing from the store.
              </Text>

              <View style={styles.confirmActions}>
                <TouchableOpacity 
                  style={styles.confirmCancelBtn} 
                  onPress={() => setDeleteProductItem(null)}
                >
                  <Text style={styles.confirmCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.confirmDeleteBtn} 
                  onPress={async () => {
                    const productId = deleteProductItem.id;
                    setDeleteProductItem(null); // Close the modal instantly
                    try {
                      await deleteProduct(productId);
                    } catch (e) {
                      if (Platform.OS === 'web') {
                        alert(`Failed to delete listing: ${e.message}`);
                      } else {
                        Alert.alert('Error', `Failed to delete listing: ${e.message}`);
                      }
                    }
                  }}
                >
                  <Text style={styles.confirmDeleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Modal>
      )}
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
  card: { backgroundColor: colors.surface, borderRadius: 20, marginBottom: 16, borderWidth: 1, borderColor: colors.border, elevation: 4, shadowColor: colors.cardShadow, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.09, shadowRadius: 10 },
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
  viewBtn: { paddingVertical: 10, borderRadius: 12, alignItems: 'center', width: '100%' },
  viewBtnText: { fontSize: 11, fontWeight: '700', color: colors.white },

  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 15, color: colors.textMuted, fontWeight: '600', marginTop: 12 },

  // Modals Styles
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: colors.surface, width: '100%', maxWidth: 500, borderRadius: 24, paddingBottom: 20, overflow: 'hidden', elevation: 10, shadowColor: colors.black, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, maxHeight: '85%' },
  modalHeader: { height: 200, width: '100%', position: 'relative', backgroundColor: colors.surfaceElevated },
  modalImage: { width: '100%', height: '100%' },
  modalPlaceholderBg: { flex: 1, backgroundColor: colors.accentAmberSoft, justifyContent: 'center', alignItems: 'center' },
  modalPlaceholderEmoji: { fontSize: 72 },
  modalCloseIconBtn: { position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  modalCloseIconText: { fontSize: 16, color: colors.white, fontWeight: '700' },
  modalScrollBody: { padding: 20 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, marginBottom: 4 },
  modalBrand: { fontSize: 14, color: colors.textSecondary, fontWeight: '600', marginBottom: 12 },
  modalBadgeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  modalCategoryBadge: { backgroundColor: colors.surfaceElevated, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  modalCategoryText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  modalStatusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  modalStatusText: { fontSize: 12, fontWeight: '700' },
  modalDivider: { height: 1, backgroundColor: colors.borderLight, marginBottom: 16 },
  modalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  modalGridCell: { width: '47%', backgroundColor: colors.surfaceElevated, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  modalCellLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  modalCellValue: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  modalSectionTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, marginBottom: 8 },
  modalDescText: { fontSize: 13, color: colors.textSecondary, lineHeight: 20, marginBottom: 20 },
  modalCloseBtn: { marginHorizontal: 20, backgroundColor: colors.textPrimary, paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  modalCloseBtnText: { fontSize: 14, fontWeight: '700', color: colors.white },

  // Confirm / Destructive Modal
  confirmContent: { backgroundColor: colors.surface, width: '90%', maxWidth: 400, borderRadius: 24, padding: 24, alignItems: 'center', elevation: 10, shadowColor: colors.black, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20 },
  warningIconBg: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.redSoft, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  warningIconText: { fontSize: 32 },
  confirmTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: 8 },
  confirmMessage: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  confirmBoldText: { fontWeight: '700', color: colors.textPrimary },
  confirmActions: { flexDirection: 'row', width: '100%', gap: 12 },
  confirmCancelBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, paddingVertical: 12, borderRadius: 14, alignItems: 'center', backgroundColor: colors.surfaceElevated },
  confirmCancelText: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  confirmDeleteBtn: { flex: 1, backgroundColor: colors.red, paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  confirmDeleteText: { fontSize: 14, fontWeight: '700', color: colors.white },
});

export default InventoryScreen;