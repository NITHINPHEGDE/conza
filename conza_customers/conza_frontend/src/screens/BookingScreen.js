import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  ScrollView,
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

const TRUCK_IMAGE = require('../../assets/images/delivery_truck.jpg');
const TRACTOR_IMAGE = require('../../assets/images/rental_tractor.jpg');

const CATEGORIES = [
  { key: 'Labour',   label: 'Book\nLabour',   icon: 'account-hard-hat', color: '#F59E0B' },
  { key: 'Material', label: 'Order\nMaterial', icon: 'cube-outline',    color: '#F59E0B' },
  { key: 'Rental',   label: 'Book\nRental',   icon: 'excavator',        color: '#F59E0B' },
];

const MATERIAL_CATEGORIES_DATA = [
  { id: 'all',              label: 'All',               icon: 'view-grid-outline' },
  { id: 'cement',           label: 'Cement',            icon: 'sack' },
  { id: 'steel',            label: 'Steel',             icon: 'reorder-horizontal' },
  { id: 'bricks_blocks',    label: 'Bricks &\nBlocks',  icon: 'wall' },
  { id: 'sand_aggregate',   label: 'Sand &\nAggregate', icon: 'grain' },
  { id: 'electrical',       label: 'Electrical',        icon: 'lightning-bolt-circle' },
  { id: 'plumbing',         label: 'Plumbing',          icon: 'pipe-wrench' },
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
    <View style={{ marginHorizontal: -34 }}>
      <View style={[styles.materialSearchWrapper, { marginTop: 4, marginHorizontal: 14 }]}>
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
      <View style={{ height: 17 }} />
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
  const filterMaterials = useAppStore((s) => s.filterMaterials);
  const materials       = useAppStore((s) => s.materials);  // subscribe so list re-renders on load
  const materialCategories = useAppStore((s) => s.materialCategories);
  const materialsLoading = useAppStore((s) => s.materialsLoading);
  const materialsFetched = useAppStore((s) => s.materialsFetched);
  const materialsError  = useAppStore((s) => s.materialsError);
  const fetchMaterials  = useAppStore((s) => s.fetchMaterials);
  const cart            = useAppStore((s) => s.cart);
  const addToCart       = useAppStore((s) => s.addToCart);
  const getCartItems    = useAppStore((s) => s.getCartItems);
  const getCartItemCount = useAppStore((s) => s.getCartItemCount);

  const [query,       setQuery]       = useState('');
  const [selectedCat, setSelectedCat] = useState('all');

  // Self-heals the "skeleton → No materials found" glitch: if this tab is
  // opened before/around the app-boot fetchMaterials() call has actually
  // populated data (or resolved with a stale/empty result), re-trigger the
  // fetch on mount instead of leaving the empty state stuck until the user
  // manually navigates away and back.
  useEffect(() => {
    if (!materialsLoading && (!materialsFetched || materials.length === 0)) {
      fetchMaterials();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered     = useMemo(() => filterMaterials(selectedCat, query), [materials, filterMaterials, selectedCat, query]);
  const activeCat    = useMemo(() => materialCategories.find((c) => c.id === selectedCat), [materialCategories, selectedCat]);
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
  const handleClearCat = useCallback(() => setSelectedCat('all'), []);

  // Selecting a category tile no longer opens/closes a modal — categories
  // stay permanently visible above the material grid, exactly like tapping
  // a chip just re-filters the list in place.
  const handleSelectCat = useCallback((id) => {
    setSelectedCat((prev) => (prev === id ? 'all' : id));
  }, []);

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

  // Always-visible category grid tile (replaces the old Filter-modal chip).
  const renderCategoryTile = useCallback((cat) => {
    const isSelected = selectedCat === cat.id;
    return (
      <TouchableOpacity
        key={cat.id}
        style={styles.categoryTile}
        onPress={() => handleSelectCat(cat.id)}
        activeOpacity={0.75}
      >
        <View style={[styles.categoryTileImageWrap, isSelected && styles.categoryTileImageWrapSelected]}>
          {cat.image ? (
            <Image source={{ uri: cat.image }} style={styles.categoryTileImage} />
          ) : (
            <Text style={styles.categoryTileEmoji}>{cat.emoji}</Text>
          )}
        </View>
        <Text
          style={[styles.categoryTileLabel, isSelected && styles.categoryTileLabelSelected]}
          numberOfLines={2}
        >
          {cat.label}
        </Text>
      </TouchableOpacity>
    );
  }, [selectedCat, handleSelectCat]);

  const listHeader = useMemo(() => (
    <View>
      {/* Search + Filter row */}
      <View style={styles.mSearchRow}>
        <View style={styles.mSearchBox}>
          <MaterialCommunityIcons name="magnify" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.mSearchInput}
            placeholder="Search materials, brands, or categories..."
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClearQuery} activeOpacity={0.7}>
              <MaterialCommunityIcons name="close-circle" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.mFilterBtn} activeOpacity={0.8}>
          <MaterialCommunityIcons name="tune-variant" size={17} color="#374151" />
          <Text style={styles.mFilterText}>Filter</Text>
          <View style={styles.mFilterDot} />
        </TouchableOpacity>
      </View>

      {/* Bulk Order Banner */}
      <TouchableOpacity style={styles.bulkBanner} activeOpacity={0.88}>
        <View style={styles.bulkBannerLeft}>
          <Image source={TRUCK_IMAGE} style={styles.bulkImage} resizeMode="contain" />
          <View style={{ flex: 1 }}>
            <Text style={styles.bulkTitle} numberOfLines={1}>Bulk Order? Get better prices</Text>
            <Text style={styles.bulkSub} numberOfLines={1}>Save more on bulk purchases</Text>
          </View>
        </View>
        <View style={styles.bulkQuoteBtn}>
          <Text style={styles.bulkQuoteText}>Get Quote →</Text>
        </View>
      </TouchableOpacity>

      {/* Shop by Category */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeaderTitle}>Shop by Category</Text>
        <TouchableOpacity onPress={handleClearCat} activeOpacity={0.7}>
          <Text style={styles.sectionHeaderLink}>View all &gt;</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScrollContent}>
        {/* "All" square */}
        <TouchableOpacity
          style={styles.circCatItem}
          onPress={() => setSelectedCat('all')}
          activeOpacity={0.75}
        >
          <View style={[styles.circCatIcon, selectedCat === 'all' && styles.circCatIconActive]}>
            <MaterialCommunityIcons
              name="view-grid-outline"
              size={24}
              color={selectedCat === 'all' ? '#F59E0B' : '#4B5563'}
            />
          </View>
          <Text style={[styles.circCatLabel, selectedCat === 'all' && styles.circCatLabelActive]}>All</Text>
        </TouchableOpacity>

        {/* Dynamic categories (backend categories or defaults) */}
        {(materialCategories && materialCategories.length > 1
          ? materialCategories.filter((c) => c.id !== 'all')
          : MATERIAL_CATEGORIES_DATA.filter((c) => c.id !== 'all')
        ).map((cat) => {
          const isSelected = selectedCat === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={styles.circCatItem}
              onPress={() => handleSelectCat(cat.id)}
              activeOpacity={0.75}
            >
              <View style={[styles.circCatIcon, isSelected && styles.circCatIconActive]}>
                {cat.image ? (
                  <Image source={{ uri: cat.image }} style={styles.circCatImage} resizeMode="contain" />
                ) : cat.icon ? (
                  <MaterialCommunityIcons
                    name={cat.icon}
                    size={24}
                    color={isSelected ? '#F59E0B' : '#4B5563'}
                  />
                ) : (
                  <Text style={styles.circCatEmoji}>{cat.emoji || '🧱'}</Text>
                )}
              </View>
              <Text
                style={[styles.circCatLabel, isSelected && styles.circCatLabelActive]}
                numberOfLines={2}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Top Picks header */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeaderTitle}>
          {selectedCat !== 'all' ? (activeCat?.label || 'Materials') : 'Top Picks for You'}
        </Text>
        <View style={styles.sortRow}>
          <Text style={styles.sortText}>Sort by: </Text>
          <Text style={styles.sortValue}>Popular ▾</Text>
        </View>
      </View>
    </View>
  ), [query, handleClearQuery, selectedCat, activeCat, handleClearCat]);

  const listEmpty = useMemo(() => (
    materialsFetched ? (
      <EmptyState
        emoji="🧱"
        title="No materials found"
        subtitle="Try a different filter or search term"
      />
    ) : null
  ), [materialsFetched]);

  const contentContainerStyle = useMemo(() => [
    styles.materialGridList,
    { paddingBottom: totalItems > 0 ? 120 : 64 },
  ], [totalItems]);

  if (materialsLoading || (!materialsFetched && materials.length === 0)) return <MaterialGridSkeleton />;
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

      {/* Statically fixed sleek and slender trust banner */}
      <View style={[styles.fixedSlenderTrustBar, totalItems > 0 && { bottom: 64 }]}>
        {[
          { icon: 'shield-check-outline', title: '100% Genuine\nMaterials', sub: 'Quality checked' },
          { icon: 'medal-outline',        title: 'Best Price\nGuarantee',   sub: "We'll match it" },
          { icon: 'truck-fast-outline',  title: 'On-time\nDelivery',       sub: 'At your site' },
          { icon: 'face-agent',          title: 'Expert\nSupport',         sub: '24/7 assistance' },
        ].map((item, i) => (
          <View key={i} style={styles.fixedSlenderTrustItem}>
            <View style={styles.fixedSlenderTrustIconCircle}>
              <MaterialCommunityIcons name={item.icon} size={12} color="#D97706" />
            </View>
            <Text style={styles.fixedSlenderTrustTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.fixedSlenderTrustSub} numberOfLines={1}>{item.sub}</Text>
          </View>
        ))}
      </View>

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
  const rentalCart        = useAppStore((s) => s.rentalCart);

  const rentalCartCount = rentalCart.length;
  const rentalCartTotal = useMemo(
    () => rentalCart.reduce((sum, r) => sum + (Number(r.pricePerDay) || 0), 0),
    [rentalCart]
  );

  const handleAddToCart = useCallback((item) => {
    addToRentalCart(item);
    Alert.alert('Added to Cart', `${item.name || 'Equipment'} added to your cart.`, [{ text: 'OK' }]);
  }, [addToRentalCart]);

  const handleRentalCheckoutBar = useCallback(() => {
    navigation.navigate('CartTab');
  }, [navigation]);

  const [query,       setQuery]       = useState('');
  const [selectedCat, setSelectedCat] = useState('all');

  const filtered  = useMemo(() => filterRentalItems(selectedCat, query), [rentalItems, filterRentalItems, selectedCat, query]);
  const activeCat = useMemo(() => rentalCategories.find((c) => c.id === selectedCat), [rentalCategories, selectedCat]);

  const handleClearQuery = useCallback(() => setQuery(''), []);
  const handleClearCat = useCallback(() => setSelectedCat('all'), []);

  const handleRentalPress = useCallback((item) => {
    navigation.navigate('RentalDetail', { item });
  }, [navigation]);

  // Selecting a category tile no longer opens/closes a modal — categories
  // stay permanently visible above the equipment grid, exactly like
  // MaterialView. Tapping a tile filters the grid below; tapping the
  // active tile again clears the filter.
  const handleSelectCat = useCallback((id) => {
    setSelectedCat((prev) => (prev === id ? 'all' : id));
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

  // Always-visible category grid tile (replaces the old Filter-modal chip).
  const renderCategoryTile = useCallback((cat) => {
    const isSelected = selectedCat === cat.id;
    return (
      <TouchableOpacity
        key={cat.id}
        style={styles.categoryTile}
        onPress={() => handleSelectCat(cat.id)}
        activeOpacity={0.75}
      >
        <View style={[styles.categoryTileImageWrap, isSelected && styles.categoryTileImageWrapSelected]}>
          {cat.image ? (
            <Image source={{ uri: cat.image }} style={styles.categoryTileImage} />
          ) : (
            <Text style={styles.categoryTileEmoji}>{cat.emoji}</Text>
          )}
        </View>
        <Text
          style={[styles.categoryTileLabel, isSelected && styles.categoryTileLabelSelected]}
          numberOfLines={2}
        >
          {cat.label}
        </Text>
      </TouchableOpacity>
    );
  }, [selectedCat, handleSelectCat]);

  const listHeader = useMemo(() => (
    <View>
      {/* Search + Filter row */}
      <View style={styles.mSearchRow}>
        <View style={styles.mSearchBox}>
          <MaterialCommunityIcons name="magnify" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.mSearchInput}
            placeholder="Search equipment, brands, or categories..."
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClearQuery} activeOpacity={0.7}>
              <MaterialCommunityIcons name="close-circle" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.mFilterBtn} activeOpacity={0.8}>
          <MaterialCommunityIcons name="tune-variant" size={17} color="#374151" />
          <Text style={styles.mFilterText}>Filter</Text>
        </TouchableOpacity>
      </View>

      {/* Rental Inquiry Banner */}
      <TouchableOpacity style={styles.bulkBanner} activeOpacity={0.88}>
        <View style={styles.bulkBannerLeft}>
          <Image source={TRACTOR_IMAGE} style={styles.bulkImage} resizeMode="contain" />
          <View style={{ flex: 1 }}>
            <Text style={styles.bulkTitle} numberOfLines={1}>Need equipment long-term?</Text>
            <Text style={styles.bulkSub} numberOfLines={1}>Get custom rental packages</Text>
          </View>
        </View>
        <View style={styles.bulkQuoteBtn}>
          <Text style={styles.bulkQuoteText}>Get Quote →</Text>
        </View>
      </TouchableOpacity>

      {/* Shop by Category */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeaderTitle}>Browse Equipment</Text>
        <TouchableOpacity onPress={handleClearCat} activeOpacity={0.7}>
          <Text style={styles.sectionHeaderLink}>View all &gt;</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScrollContent}>
        <TouchableOpacity
          style={styles.circCatItem}
          onPress={() => setSelectedCat('all')}
          activeOpacity={0.75}
        >
          <View style={[styles.circCatIcon, selectedCat === 'all' && styles.circCatIconActive]}>
            <MaterialCommunityIcons
              name="view-grid-outline"
              size={22}
              color={selectedCat === 'all' ? '#F59E0B' : '#4B5563'}
            />
          </View>
          <Text style={[styles.circCatLabel, selectedCat === 'all' && styles.circCatLabelActive]}>All</Text>
        </TouchableOpacity>
        {rentalCategories
          .filter((cat) => cat.id !== 'all')
          .map((cat) => {
            const isSelected = selectedCat === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={styles.circCatItem}
                onPress={() => handleSelectCat(cat.id)}
                activeOpacity={0.75}
              >
                <View style={[styles.circCatIcon, isSelected && styles.circCatIconActive]}>
                  {cat.image ? (
                    <Image source={{ uri: cat.image }} style={styles.circCatImage} />
                  ) : (
                    <Text style={styles.circCatEmoji}>{cat.emoji}</Text>
                  )}
                </View>
                <Text style={[styles.circCatLabel, isSelected && styles.circCatLabelActive]} numberOfLines={2}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
      </ScrollView>

      {/* Available Equipment header */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeaderTitle}>
          {selectedCat !== 'all' ? (activeCat?.label || 'Equipment') : 'Available Equipment'}
        </Text>
        <View style={styles.sortRow}>
          <Text style={styles.sortText}>Sort by: </Text>
          <Text style={styles.sortValue}>Popular ▾</Text>
        </View>
      </View>
    </View>
  ), [query, handleClearQuery, selectedCat, activeCat, rentalCategories, renderCategoryTile, handleClearCat]);

  const listEmpty = useMemo(() => (
    <EmptyState
      emoji="🏗️"
      title="No equipment found"
      subtitle="Try a different filter or search term"
    />
  ), []);

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.rentalGridRow}
        contentContainerStyle={[styles.rentalGridList, { paddingBottom: rentalCartCount > 0 ? 120 : 64 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        renderItem={renderItem}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
      />

      {/* Statically fixed sleek and slender trust banner */}
      <View style={[styles.fixedSlenderTrustBar, rentalCartCount > 0 && { bottom: 64 }]}>
        {[
          { icon: 'shield-check-outline', title: 'Verified\nEquipment', sub: 'Safety checked' },
          { icon: 'medal-outline',        title: 'Best Rates\nGuaranteed', sub: 'Competitive price' },
          { icon: 'truck-fast-outline',  title: 'On-site\nDelivery',     sub: 'At your site' },
          { icon: 'face-agent',          title: 'Expert\nSupport',       sub: '24/7 assistance' },
        ].map((item, i) => (
          <View key={i} style={styles.fixedSlenderTrustItem}>
            <View style={styles.fixedSlenderTrustIconCircle}>
              <MaterialCommunityIcons name={item.icon} size={12} color="#D97706" />
            </View>
            <Text style={styles.fixedSlenderTrustTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.fixedSlenderTrustSub} numberOfLines={1}>{item.sub}</Text>
          </View>
        ))}
      </View>

      {/* Rental cart checkout bar — mirrors MaterialView's bar exactly */}
      {rentalCartCount > 0 && (
        <View style={styles.materialCheckoutBar}>
          <View style={styles.materialCheckoutLeft}>
            <View style={styles.materialCheckoutBadge}>
              <Text style={styles.materialCheckoutBadgeText}>{rentalCartCount}</Text>
            </View>
            <View>
              <Text style={styles.materialCheckoutLabel}>
                {rentalCartCount} item{rentalCartCount > 1 ? 's' : ''} added
              </Text>
              <Text style={styles.materialCheckoutTotal}>₹{rentalCartTotal.toLocaleString()}/day</Text>
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
              onPress={handleRentalCheckoutBar}
            >
              <Text style={styles.materialCheckoutBtnText}>View Cart →</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}
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

  const header = useMemo(() => {
    return (
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => setAddressSheetVisible(true)}
          activeOpacity={0.75}
          style={styles.headerLocationBtn}
        >
          <View style={styles.headerMetaRow}>
            <MaterialCommunityIcons name="map-marker" size={13} color="#EF4444" />
            <Text style={styles.headerMeta}>Deliver to</Text>
          </View>
          <Text style={styles.headerLocationLine1} numberOfLines={1}>Sri Maregowda Circle,</Text>
          <View style={styles.headerLocationLine2Row}>
            <Text style={styles.headerLocationLine2} numberOfLines={1}>Bengaluru, Karnataka</Text>
            <MaterialCommunityIcons name="chevron-down" size={15} color="#374151" />
          </View>
        </TouchableOpacity>

        {/* Wallet balance chip */}
        <TouchableOpacity
          style={styles.walletChip}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Wallet')}
        >
          <MaterialCommunityIcons name="wallet-outline" size={17} color="#F59E0B" />
          <Text style={styles.walletAmount}>₹{walletBalance || 0}</Text>
        </TouchableOpacity>

        {/* Cart pill */}
        <TouchableOpacity
          style={styles.notifBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('CartTab')}
        >
          <MaterialCommunityIcons name="cart-outline" size={20} color="#111827" />
          {totalCartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{totalCartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  }, [totalCartCount, navigation, walletBalance]);

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
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: '#FAFAFA',
  },
  headerLocationBtn: {
    flex: 1,
    marginRight: 10,
  },
  headerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 2,
  },
  headerMeta: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  headerLocationLine1: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 18,
  },
  headerLocationLine2Row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  headerLocationLine2: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    lineHeight: 16,
  },
  walletChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 7,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  walletAmount: { fontSize: 13.5, fontWeight: '800', color: '#111827' },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: { fontSize: 9.5, fontWeight: '800', color: '#FFFFFF' },
  fixedSection: {
    paddingHorizontal: 16,
    backgroundColor: '#FAFAFA',
  },
  tabsWrapper: {
    paddingBottom: 10,
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
  labourList: { paddingTop: 17, paddingBottom: 30, paddingHorizontal: 34 },
  gridRow: { gap: 34 },
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
  materialGridList: { paddingTop: 10, paddingBottom: 16, paddingHorizontal: 12 },
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

  // New Material/Rental header styles
  mSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 10,
  },
  mSearchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  mSearchInput: { flex: 1, fontSize: 13, color: '#111827', includeFontPadding: false },
  mFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mFilterText: { fontSize: 12.5, fontWeight: '500', color: '#374151' },
  mFilterDot: {
    width: 5, height: 5, borderRadius: 2.5,
    backgroundColor: colors.accentAmber,
  },

  // Bulk Order Banner
  bulkBanner: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  bulkBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 },
  bulkImage: { width: 34, height: 34, borderRadius: 6 },
  bulkTitle: { fontSize: 11.5, fontWeight: '600', color: '#92400E', lineHeight: 14 },
  bulkSub: { fontSize: 10, color: '#B45309', fontWeight: '400', lineHeight: 12, marginTop: 1 },
  bulkQuoteBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderWidth: 1,
    borderColor: '#F59E0B',
    flexShrink: 0,
  },
  bulkQuoteText: { fontSize: 10.5, fontWeight: '600', color: '#D97706' },

  // Section header row
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 8,
  },
  sectionHeaderTitle: { fontSize: 14.5, fontWeight: '600', color: '#111827' },
  sectionHeaderLink: { fontSize: 12.5, fontWeight: '400', color: '#6B7280' },

  // Sort row
  sortRow: { flexDirection: 'row', alignItems: 'center' },
  sortText: { fontSize: 11.5, color: '#6B7280', fontWeight: '400' },
  sortValue: { fontSize: 11.5, color: '#D97706', fontWeight: '600' },

  // Square category tiles
  catScrollContent: { paddingHorizontal: 14, paddingBottom: 12, gap: 10 },
  circCatItem: { alignItems: 'center', width: 68 },
  circCatIcon: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  circCatIconActive: {
    backgroundColor: '#FFFBEB',
    borderColor: '#F59E0B',
    borderWidth: 1.5,
  },
  circCatEmoji: { fontSize: 24 },
  circCatImage: { width: 42, height: 42, borderRadius: 8 },
  circCatLabel: {
    fontSize: 10.5,
    fontWeight: '500',
    color: '#475569',
    textAlign: 'center',
    lineHeight: 13,
  },
  circCatLabelActive: { color: '#D97706', fontWeight: '600' },

  // Statically fixed sleek & slender trust banner
  fixedSlenderTrustBar: {
    position: 'absolute',
    bottom: 4,
    left: 8,
    right: 8,
    backgroundColor: '#FFFDF9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 5,
    paddingHorizontal: 4,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  fixedSlenderTrustItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 1,
  },
  fixedSlenderTrustIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  fixedSlenderTrustTitle: {
    fontSize: 8.5,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
    lineHeight: 10.5,
  },
  fixedSlenderTrustSub: {
    fontSize: 7.5,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 9.5,
  },
  materialCheckoutBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 18,
    paddingVertical: 12,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
  },
  materialCheckoutLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  materialCheckoutBadge: {
    width: 32, height: 32,
    borderRadius: 10,
    backgroundColor: colors.accentYellowSoft,
    borderWidth: 1,
    borderColor: colors.accentYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  materialCheckoutBadgeText: { fontSize: 13, fontWeight: '700', color: colors.accentAmber },
  materialCheckoutLabel: { fontSize: 11.5, color: colors.textSecondary, fontWeight: '500', marginBottom: 1 },
  materialCheckoutTotal: { fontSize: 15.5, fontWeight: '700', color: colors.textPrimary },
  materialCheckoutBtn: { borderRadius: 12, overflow: 'hidden' },
  materialCheckoutBtnTouch: { paddingHorizontal: 20, paddingVertical: 11, alignItems: 'center' },
  materialCheckoutBtnText: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, letterSpacing: 0.2 },

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
  activeCatImage: { width: 20, height: 20, borderRadius: 10 },
  activeCatLabel: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, flex: 1 },
  activeCatClear: { fontSize: 12, fontWeight: '600', color: colors.accentAmber },
  rentalGridList: { paddingTop: 10, paddingHorizontal: 12, paddingBottom: 16 },
  rentalGridRow: { justifyContent: 'space-between' },
  rentalCardWrapper: { flex: 1, margin: 6 },
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
  catImage: { width: 40, height: 40, borderRadius: 20, marginBottom: 8 },
  catLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, textAlign: 'center' },
  catLabelSelected: { color: colors.accentAmber },
  catSelectedDot: {
    position: 'absolute',
    top: 8, right: 8,
    width: 8, height: 8,
    borderRadius: 4,
    backgroundColor: colors.accentAmber,
  },

  // Always-visible category banners — horizontally scrollable
  categoryGridTwoRow: {
    flexDirection: 'column',
    flexWrap: 'wrap',
    height: 188,
    rowGap: 14,
    columnGap: 14,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  categoryGridOneRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    columnGap: 14,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  categoryTile: { width: 76, alignItems: 'center' },
  categoryTileImageWrap: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 1.3,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  categoryTileImageWrapSelected: {
    backgroundColor: '#FFFDF0',
    borderColor: colors.accentYellow,
    borderWidth: 2,
  },
  categoryTileImage: { width: 38, height: 38, borderRadius: 8, resizeMode: 'cover' },
  categoryTileEmoji: { fontSize: 22 },
  categoryTileLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 13,
  },
  categoryTileLabelSelected: { color: colors.accentAmber },

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