import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import CategoryButton     from '../components/CategoryButton';
import LabourCategoryCard from '../components/LabourCategoryCard';
import MaterialCard       from '../components/MaterialCard';
import SectionHeader      from '../components/SectionHeader';
import SkillWorkerCard    from '../components/SkillWorkerCard';
import RentalCard         from '../components/RentalCard';
import { SectionLoader, ErrorState, EmptyState, WorkerListSkeleton, CategoryGridSkeleton, MaterialGridSkeleton, RentalGridSkeleton } from '../components/LoadingState';

import useAppStore from '../store/useAppStore';
import { colors } from '../theme/colors';
import SavedAddressSheet from '../components/SavedAddressSheet';

const CATEGORIES = [
  { key: 'Labour',   label: 'Book\nLabour',   icon: 'account-hard-hat',        color: '#F0A500' },
  { key: 'Material', label: 'Order\nMaterial', icon: 'package-variant', color: '#F0A500' },
  { key: 'Rental',   label: 'Book\nRental',   icon: 'excavator',       color: '#F0A500' },
];

// ─── Skill Search Results View ────────────────────────────────────────────────
const SkillSearchView = React.memo(({ query, onClear }) => {
  const navigation    = useNavigation();
  const searchWorkers = useAppStore((s) => s.searchWorkers);
  const labourLoading = useAppStore((s) => s.labourLoading);
  const labourError   = useAppStore((s) => s.labourError);
  const fetchLabour   = useAppStore((s) => s.fetchLabourData);
  const [selected, setSelected] = useState([]);

  const results = useMemo(() => searchWorkers(query), [searchWorkers, query]);

  const toggleWorker = useCallback((worker) => {
    setSelected((prev) =>
      prev.find((w) => w.id === worker.id)
        ? prev.filter((w) => w.id !== worker.id)
        : [...prev, worker]
    );
  }, []);

  const totalPerDay = useMemo(() => 
    selected.reduce((sum, w) => sum + (Number(w.pricePerDay) || 0), 0),
    [selected]
  );

  const handleCheckout = useCallback(() => {
    navigation.navigate('LabourCheckout', {
      selectedWorkers: selected,
      category: 'Service',
    });
  }, [navigation, selected]);

  const renderItem = useCallback(({ item }) => (
    <SkillWorkerCard
      worker={item}
      isSelected={!!selected.find((w) => w.id === item.id)}
      onToggle={toggleWorker}
    />
  ), [selected, toggleWorker]);

  const listHeader = useMemo(() => (
    <View style={styles.skillSearchHeader}>
      <Text style={styles.skillResultCount}>
        {results.length} worker{results.length !== 1 ? 's' : ''} found for "{query}"
      </Text>
      <TouchableOpacity onPress={onClear} activeOpacity={0.7}>
        <Text style={styles.skillClearText}>Clear ✕</Text>
      </TouchableOpacity>
    </View>
  ), [results.length, query, onClear]);

  const listEmpty = useMemo(() => (
    <EmptyState
      emoji="🔍"
      title="No workers found"
      subtitle={`Try searching "plumbing", "painting", "wiring" etc.`}
    />
  ), []);

  if (labourLoading) return <WorkerListSkeleton />;
  if (labourError)   return <ErrorState message={labourError} onRetry={fetchLabour} />;

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.skillList}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={listHeader}
        renderItem={renderItem}
        ListEmptyComponent={listEmpty}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        extraData={selected}
      />
      {selected.length > 0 && (
        <View style={styles.bottomBar}>
          <View style={styles.bottomBarInfo}>
            <Text style={styles.selectedCount}>
              {selected.length} worker{selected.length > 1 ? 's' : ''} selected
            </Text>
            <Text style={styles.totalPrice}>₹{totalPerDay.toLocaleString()}/day</Text>
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
    </View>
  );
});

// ─── Labour Grid ──────────────────────────────────────────────────────────────
const LabourView = React.memo(({ search, onSearchChange, onClearSearch }) => {
  const navigation      = useNavigation();
  const labourCategories = useAppStore((s) => s.labourCategories);
  const labourLoading   = useAppStore((s) => s.labourLoading);
  const labourError     = useAppStore((s) => s.labourError);
  const fetchLabour     = useAppStore((s) => s.fetchLabourData);

  const handlePress = useCallback((item) => {
    navigation.navigate('WorkersNearby', { category: item.label });
  }, [navigation]);

  const renderItem = useCallback(({ item }) => (
    <LabourCategoryCard
      item={item}
      isSelected={false}
      onPress={handlePress}
    />
  ), [handlePress]);

  const listHeader = useMemo(() => (
    <View>
      <View style={[styles.materialSearchWrapper, { marginTop: 4 }]}>
        <View style={styles.searchIconBadge}>
          <MaterialCommunityIcons name="magnify" size={16} color={colors.accentAmber} />
        </View>
        <TextInput
          style={styles.materialSearchInput}
          placeholder="Search services, skills..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={onSearchChange}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={onClearSearch} activeOpacity={0.7}>
            <Text style={styles.searchClear}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  ), [search, onSearchChange, onClearSearch]);

  const listEmpty = useMemo(() => (
    <EmptyState emoji="👷" title="No categories available" />
  ), []);

  const listFooter = useMemo(() => (
    <View style={{ height: 20 }} />
  ), []);

  if (labourLoading) return <CategoryGridSkeleton />;
  if (labourError)   return <ErrorState message={labourError} onRetry={fetchLabour} />;

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={labourCategories}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.labourList}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={listFooter}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
      />
    </View>
  );
});

// ─── Material View ────────────────────────────────────────────────────────────
const MaterialView = React.memo(() => {
  const navigation      = useNavigation();
  const searchMaterials = useAppStore((s) => s.searchMaterials);
  const materials       = useAppStore((s) => s.materials);  // subscribe so list re-renders on load
  const materialsLoading = useAppStore((s) => s.materialsLoading);
  const materialsError  = useAppStore((s) => s.materialsError);
  const fetchMaterials  = useAppStore((s) => s.fetchMaterials);
  const cart            = useAppStore((s) => s.cart);
  const addToCart       = useAppStore((s) => s.addToCart);
  const getCartItems    = useAppStore((s) => s.getCartItems);
  const getCartItemCount = useAppStore((s) => s.getCartItemCount);

  const [query, setQuery] = useState('');
  const filtered     = useMemo(() => searchMaterials(query), [materials, searchMaterials, query]);
  const totalItems   = useMemo(
    () => Object.values(cart).reduce((a, b) => (Number(a) || 0) + (Number(b) || 0), 0),
    [cart]
  );
  // Compute total inline using subscribed `materials` + `cart` so it
  // reacts to both changing (fixes stale ₹0 bug when API loads after cart is populated)
  const totalPrice   = useMemo(
    () =>
      materials
        .filter((m) => (Number(cart[m.id]) || 0) > 0)
        .reduce((sum, m) => sum + (Number(m.price) || 0) * (Number(cart[m.id]) || 0), 0),
    [materials, cart]
  );

  const handleUpdateQuantity = useCallback((id, newQty) => {
    addToCart({ id, _setQty: newQty });
  }, [addToCart]);

  const handleImagePress = useCallback((item) => {
    navigation.navigate('MaterialDetail', { item });
  }, [navigation]);

  const handleCheckout = useCallback(() => {
    navigation.navigate('MaterialCheckout', {
      cartItems: getCartItems(),
      cart,
    });
  }, [navigation, getCartItems, cart]);

  const handleClearQuery = useCallback(() => setQuery(''), []);

  const handleAddMaterialToCart = useCallback((item) => {
    addToCart(item);
    Alert.alert('Added to Cart', `${item.name} added to your cart.`, [{ text: 'OK' }]);
  }, [addToCart]);

  const renderItem = useCallback(({ item }) => (
    <View style={styles.materialCardWrapper}>
      <MaterialCard
        {...item}
        quantity={Number(cart[item.id]) || 0}
        onUpdate={handleUpdateQuantity}
        onImagePress={handleImagePress}
        onAddToCart={handleAddMaterialToCart}
      />
    </View>
  ), [cart, handleUpdateQuantity, handleImagePress, handleAddMaterialToCart]);

  const listHeader = useMemo(() => (
    <View>
      <View style={[styles.materialSearchRow, { marginTop: 4 }]}>
        <View style={[styles.materialSearchWrapper, { flex: 1, marginHorizontal: 0 }]}>
          <View style={styles.searchIconBadge}>
            <MaterialCommunityIcons name="magnify" size={16} color={colors.accentAmber} />
          </View>
          <TextInput
            style={styles.materialSearchInput}
            placeholder="Search materials, sellers..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClearQuery} activeOpacity={0.7}>
              <Text style={styles.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.filterBtn} activeOpacity={0.8}>
          <View style={styles.filterIconBadge}>
            <MaterialCommunityIcons name="tune-variant" size={13} color="#16A34A" />
          </View>
          <Text style={styles.filterBtnText}>Filter</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [query, handleClearQuery]);

  const listEmpty = useMemo(() => (
    <EmptyState
      emoji="🧱"
      title="No materials found"
      subtitle="Try a different search term"
    />
  ), []);

  const contentContainerStyle = useMemo(() => [
    styles.materialGridList,
    totalItems > 0 && { paddingBottom: 100 },
  ], [totalItems]);

  if (materialsLoading) return <MaterialGridSkeleton />;
  if (materialsError)   return <ErrorState message={materialsError} onRetry={fetchMaterials} />;

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.materialGridRow}
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        extraData={cart}
      />
      {totalItems > 0 && (
        <View style={styles.materialCheckoutBar}>
          <View style={styles.materialCheckoutLeft}>
            <View style={styles.materialCheckoutBadge}>
              <Text style={styles.materialCheckoutBadgeText}>{totalItems}</Text>
            </View>
            <View>
              <Text style={styles.materialCheckoutLabel}>
                {totalItems} item{totalItems > 1 ? 's' : ''} added
              </Text>
              <Text style={styles.materialCheckoutTotal}>₹{totalPrice.toLocaleString()}</Text>
            </View>
          </View>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.materialCheckoutBtn}
          >
            <TouchableOpacity
              style={styles.materialCheckoutBtnTouch}
              activeOpacity={0.85}
              onPress={handleCheckout}
            >
              <Text style={styles.materialCheckoutBtnText}>Checkout →</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}
    </View>
  );
});


// ─── Rental View ──────────────────────────────────────────────────────────────
const RentalView = React.memo(() => {
  const navigation        = useNavigation();
  const filterRentalItems = useAppStore((s) => s.filterRentalItems);
  const rentalItems       = useAppStore((s) => s.rentalItems);
  const rentalCategories  = useAppStore((s) => s.rentalCategories);
  const rentalLoading     = useAppStore((s) => s.rentalLoading);
  const rentalError       = useAppStore((s) => s.rentalError);
  const fetchRental       = useAppStore((s) => s.fetchRentalData);
  const addToRentalCart   = useAppStore((s) => s.addToRentalCart);

  const handleAddToCart = useCallback((item) => {
    addToRentalCart(item);
    Alert.alert('Added to Cart', `${item.name} added to your cart.`, [{ text: 'OK' }]);
  }, [addToRentalCart]);

  const [query,       setQuery]       = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [showFilter,  setShowFilter]  = useState(false);

  const filtered  = useMemo(() => filterRentalItems(selectedCat, query), [rentalItems, filterRentalItems, selectedCat, query]);
  const activeCat = useMemo(() => rentalCategories.find((c) => c.id === selectedCat), [rentalCategories, selectedCat]);

  const handleClearQuery = useCallback(() => setQuery(''), []);
  const handleOpenFilter = useCallback(() => setShowFilter(true), []);
  const handleCloseFilter = useCallback(() => setShowFilter(false), []);
  const handleClearCat = useCallback(() => setSelectedCat('all'), []);

  const handleRentalPress = useCallback((item) => {
    navigation.navigate('RentalDetail', { item });
  }, [navigation]);

  const handleSelectCat = useCallback((id) => {
    setSelectedCat(id);
    setShowFilter(false);
  }, []);

  const renderItem = useCallback(({ item }) => (
    <View style={styles.rentalCardWrapper}>
      <RentalCard
        item={item}
        onPress={handleRentalPress}
        onAddToCart={handleAddToCart}
      />
    </View>
  ), [handleRentalPress, handleAddToCart]);

  const renderCatItem = useCallback(({ item: cat }) => (
    <TouchableOpacity
      key={cat.id}
      style={[styles.catCard, selectedCat === cat.id && styles.catCardSelected]}
      onPress={() => handleSelectCat(cat.id)}
      activeOpacity={0.75}
    >
      <Text style={styles.catEmoji}>{cat.emoji}</Text>
      <Text style={[styles.catLabel, selectedCat === cat.id && styles.catLabelSelected]}>
        {cat.label}
      </Text>
      {selectedCat === cat.id && <View style={styles.catSelectedDot} />}
    </TouchableOpacity>
  ), [selectedCat, handleSelectCat]);

  const listEmpty = useMemo(() => (
    <EmptyState
      emoji="🏗️"
      title="No equipment found"
      subtitle="Try a different filter or search term"
    />
  ), []);

  if (rentalLoading) return <RentalGridSkeleton />;
  if (rentalError)   return <ErrorState message={rentalError} onRetry={fetchRental} />;

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.rentalTopBar}>
        <View style={styles.rentalSearchBar}>
          <View style={styles.searchIconBadge}>
            <MaterialCommunityIcons name="magnify" size={16} color={colors.accentAmber} />
          </View>
          <TextInput
            style={styles.rentalSearchInput}
            placeholder="Search equipment..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClearQuery} activeOpacity={0.7}>
              <Text style={styles.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, selectedCat !== 'all' && styles.filterBtnActive]}
          onPress={handleOpenFilter}
          activeOpacity={0.8}
        >
          <View style={styles.filterIconBadge}>
            <MaterialCommunityIcons name="tune-variant" size={13} color="#16A34A" />
          </View>
          <Text style={[styles.filterBtnText, selectedCat !== 'all' && styles.filterBtnTextActive]}>
            {selectedCat !== 'all' ? activeCat?.label : 'Filter'}
          </Text>
        </TouchableOpacity>
      </View>

      {selectedCat !== 'all' && (
        <View style={styles.activeCatRow}>
          <Text style={styles.activeCatEmoji}>{activeCat?.emoji}</Text>
          <Text style={styles.activeCatLabel}>{activeCat?.label}</Text>
          <TouchableOpacity onPress={handleClearCat} activeOpacity={0.7}>
            <Text style={styles.activeCatClear}>✕ Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.rentalGridRow}
        contentContainerStyle={styles.rentalGridList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={listEmpty}
        renderItem={renderItem}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilter}
        transparent
        animationType="slide"
        onRequestClose={handleCloseFilter}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleCloseFilter}
        >
          <TouchableOpacity style={styles.modalSheet} activeOpacity={1}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Filter by Category</Text>
            <Text style={styles.modalSub}>Select a category to filter equipment</Text>
            
            <FlatList
              data={rentalCategories}
              keyExtractor={(item) => item.id}
              renderItem={renderCatItem}
              numColumns={3}
              columnWrapperStyle={{ gap: 12, marginBottom: 12 }}
              contentContainerStyle={{ paddingVertical: 10 }}
              scrollEnabled={false}
              extraData={selectedCat}
            />

            <TouchableOpacity
              onPress={handleCloseFilter}
              style={styles.modalCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCancelText}>Close</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
});


// ─── Main Screen ──────────────────────────────────────────────────────────────
const BookingScreen = () => {
  const [activeCategory, setActiveCategory] = useState('Labour');
  const [search,         setSearch]         = useState('');
  const [activeSearch,   setActiveSearch]   = useState('');

  const handleClearSearch = useCallback(() => {
    setSearch('');
    setActiveSearch('');
  }, []);

  const handleSearchChange = useCallback((t) => {
    setSearch(t);
    setActiveSearch(t);
  }, []);

  const handleCategoryPress = useCallback((catKey) => {
    setActiveCategory(catKey);
    handleClearSearch();
  }, [handleClearSearch]);


  const isSearching = useMemo(() => activeSearch.trim().length > 0, [activeSearch]);

  const userLocationText    = useAppStore((s) => s.userLocationText);
  const userLat             = useAppStore((s) => s.userLat);
  const userLng             = useAppStore((s) => s.userLng);
  const setUserLocation     = useAppStore((s) => s.setUserLocation);

  const [addressSheetVisible, setAddressSheetVisible] = useState(false);

  const handleAddressSelect = useCallback((addr) => {
    setUserLocation({
      latitude:     addr.latitude,
      longitude:    addr.longitude,
      locationText: addr.address,
    });
  }, [setUserLocation]);

  const displayLocation = userLocationText || 'Set Location';

  const navigation = useNavigation();
  const rentalCartCount = useAppStore((s) => s.getRentalCartCount());
  const materialCartCount = useAppStore((s) => s.getCartItemCount());
  const totalCartCount = rentalCartCount + materialCartCount;
  const walletBalance = useAppStore((s) => s.walletBalance);

  const header = useMemo(() => (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => setAddressSheetVisible(true)}
        activeOpacity={0.75}
        style={styles.headerLocationBtn}
      >
        <View style={styles.headerMetaRow}>
          <MaterialCommunityIcons name="map-marker" size={12} color={colors.danger} />
          <Text style={styles.headerMeta}>Deliver to</Text>
        </View>
        <Text style={styles.headerLocation} numberOfLines={2}>{displayLocation}</Text>
      </TouchableOpacity>

      {/* Wallet balance chip */}
      <TouchableOpacity style={[styles.walletChip, { marginTop: 1 }]} activeOpacity={0.8}>
        <View style={styles.walletIconBadge}>
          <MaterialCommunityIcons name="wallet" size={12} color="#F0A500" />
        </View>
        <Text style={styles.walletAmount}>₹{walletBalance}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.notifBtn}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('CartTab')}
      >
        <View style={styles.cartIconBadge}>
          <MaterialCommunityIcons name="cart" size={18} color="#2F80ED" />
        </View>
        {totalCartCount > 0 && (
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{totalCartCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  ), [displayLocation, activeCategory, totalCartCount, navigation, walletBalance]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {header}

      <View style={styles.fixedSection}>
        <View style={styles.tabsWrapper}>
          {!isSearching && (
            <View style={styles.categoryRow}>
              {CATEGORIES.map((cat) => (
                <CategoryButton
                  key={cat.key}
                  label={cat.label}
                  icon={cat.icon}
                  color={cat.color}
                  isSelected={activeCategory === cat.key}
                  onPress={() => handleCategoryPress(cat.key)}
                />
              ))}
            </View>
          )}
        </View>

      </View>

      <View style={styles.dynamicSection}>
        {isSearching ? (
          <SkillSearchView query={activeSearch} onClear={handleClearSearch} />
        ) : (
          <>
            {activeCategory === 'Labour'   && (
              <LabourView
                search={search}
                onSearchChange={handleSearchChange}
                onClearSearch={handleClearSearch}
              />
            )}
            {activeCategory === 'Material' && <MaterialView />}
            {activeCategory === 'Rental'   && <RentalView />}
          </>
        )}
      </View>
      <SavedAddressSheet
        visible={addressSheetVisible}
        onClose={() => setAddressSheetVisible(false)}
        onSelect={handleAddressSelect}
        currentLat={userLat}
        currentLng={userLng}
        currentAddress={userLocationText}
      />
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.accentYellowSoft },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 18,
    backgroundColor: colors.accentYellowSoft,
  },
  headerLocationBtn: {
    flex: 1,
    marginRight: 14,
    paddingTop: 1,
  },
  headerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 5,
  },
  headerMeta: {
    fontSize: 10.5,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  headerLocation: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.1,
    lineHeight: 19,
  },
  walletChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },

  walletAmount: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.accentAmber,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  fixedSection: {
    paddingHorizontal: 20,
    backgroundColor: colors.accentYellowSoft,
  },
  tabsWrapper: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 2,
    borderWidth: 1.3,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  searchIcon: { marginRight: 10 },
  walletIconBadge: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(240,165,0,0.16)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 5,
  },
  cartIconBadge: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(47,128,237,0.14)',
    alignItems: 'center', justifyContent: 'center',
  },
  searchIconBadge: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.accentYellowSoft,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 8,
  },
  filterIconBadge: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(22,163,74,0.14)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 4,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.textPrimary },
  searchClear: { fontSize: 14, color: colors.textMuted, fontWeight: '700', paddingLeft: 8 },
  categoryRow: { flexDirection: 'row', alignItems: 'center' },
  dynamicSection: { flex: 1, backgroundColor: colors.background },

  // Skill search
  skillList: { paddingTop: 16, paddingHorizontal: 20, paddingBottom: 120 },
  skillSearchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  skillResultCount: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  skillClearText: { fontSize: 13, fontWeight: '600', color: colors.accentAmber },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
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

  // Labour
  labourList: { paddingTop: 10, paddingBottom: 30, paddingHorizontal: 14 },
  gridRow: { justifyContent: 'space-between' },
  continueWrapper: { marginTop: 12, marginHorizontal: 6, marginBottom: 10 },
  continueBtn: { borderRadius: 16, overflow: 'hidden' },
  continueTouchable: { paddingVertical: 16, alignItems: 'center' },
  continueBtnText: { color: colors.textPrimary, fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
  continueOutlineBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  continueOutlineBtnText: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },

  // Material
  materialGridList: { paddingTop: 10, paddingBottom: 30, paddingHorizontal: 12 },
  materialGridRow: { justifyContent: 'space-between' },
  materialCardWrapper: { flex: 1, margin: 6 },
  materialSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 8,
    gap: 10,
  },
  materialSearchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1.3,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  materialSearchInput: { flex: 1, fontSize: 14, color: colors.textPrimary },
  materialCheckoutBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 20,
    paddingVertical: 14,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  materialCheckoutLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  materialCheckoutBadge: {
    width: 36, height: 36,
    borderRadius: 12,
    backgroundColor: colors.accentYellowSoft,
    borderWidth: 1,
    borderColor: colors.accentYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  materialCheckoutBadgeText: { fontSize: 15, fontWeight: '800', color: colors.accentAmber },
  materialCheckoutLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '600', marginBottom: 2 },
  materialCheckoutTotal: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  materialCheckoutBtn: { borderRadius: 14, overflow: 'hidden' },
  materialCheckoutBtnTouch: { paddingHorizontal: 22, paddingVertical: 13, alignItems: 'center' },
  materialCheckoutBtnText: { fontSize: 14, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.3 },

  // Rental
  rentalTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 10,
  },
  rentalSearchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1.3,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  rentalSearchInput: { flex: 1, fontSize: 14, color: colors.textPrimary },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1.3,
    borderColor: colors.border,
  },
  filterBtnActive: { backgroundColor: 'rgba(22,163,74,0.08)', borderColor: '#16A34A' },

  filterBtnText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  filterBtnTextActive: { color: '#16A34A' },
  activeCatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 8,
  },
  activeCatEmoji: { fontSize: 16 },
  activeCatLabel: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, flex: 1 },
  activeCatClear: { fontSize: 12, fontWeight: '600', color: colors.accentAmber },
  rentalGridList: { paddingHorizontal: 12, paddingBottom: 30 },
  rentalGridRow: { justifyContent: 'space-between' },
  rentalCardWrapper: { width: '47%', margin: '1.5%' },
  catCard: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.border,
    position: 'relative',
  },
  catCardSelected: { backgroundColor: '#FFFDF0', borderColor: colors.accentYellow },
  catEmoji: { fontSize: 28, marginBottom: 8 },
  catLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, textAlign: 'center' },
  catLabelSelected: { color: colors.accentAmber },
  catSelectedDot: {
    position: 'absolute',
    top: 8, right: 8,
    width: 8, height: 8,
    borderRadius: 4,
    backgroundColor: colors.accentAmber,
  },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 36,
  },
  modalHandle: {
    width: 40, height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', marginBottom: 6 },
  modalSub: { fontSize: 13, color: colors.textMuted, textAlign: 'center', fontWeight: '500', marginBottom: 32 },
  modalConfirmBtn: { borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  modalCancel: { paddingVertical: 12, alignItems: 'center' },
  modalCancelText: { fontSize: 14, color: colors.textMuted, fontWeight: '600' },
});

export default BookingScreen;