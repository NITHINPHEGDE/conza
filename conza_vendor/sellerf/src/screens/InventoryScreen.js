import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Image, Switch, ScrollView, Alert, Platform, Modal, Pressable,
  Dimensions, useWindowDimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return '23 Sep 2026, 05:14 PM';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '23 Sep 2026, 05:14 PM';
    const day = d.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedHours = hours.toString().padStart(2, '0');
    return `${day} ${month} ${year}, ${formattedHours}:${minutes} ${ampm}`;
  } catch (e) {
    return '23 Sep 2026, 05:14 PM';
  }
};

const copyToClipboard = (text, setCopied) => {
  if (!text) return;
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(text);
  }
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
};

// ── Material Product Card ─────────────────────────────────────────────────────
const MaterialCard = ({ item, onToggleStatus, onDelete, onEdit, onView }) => {
  const { width } = useWindowDimensions();
  const galleryWidth = width < 500 ? 150 : width < 750 ? 190 : width < 1000 ? 240 : 280;
  const isCompact = width < 600;
  const [activeIdx, setActiveIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const stockColor = item.stock === 0 ? '#DC2626' : item.lowStock ? '#D97706' : '#059669';
  const stockBg = item.stock === 0 ? '#FEF2F2' : item.lowStock ? '#FFFBEB' : '#F0FDF4';
  const stockBorder = item.stock === 0 ? '#FEE2E2' : item.lowStock ? '#FEF3C7' : '#DCFCE7';
  const stockIconBg = item.stock === 0 ? '#FEE2E2' : item.lowStock ? '#FEF3C7' : '#DCFCE7';
  const stockLabel = item.stock === 0 ? 'Out of Stock' : item.lowStock ? 'Low Stock' : 'In Stock';

  const catStyle = MAT_CATEGORY_COLORS[item.category] || { bg: colors.surfaceElevated, color: colors.textMuted };
  const catEmoji = MAT_CATEGORY_EMOJI[item.category] || '📦';

  const allImages = (item.images && item.images.length > 0) ? item.images : (item.image ? [item.image] : []);
  const currentImage = allImages[activeIdx] || allImages[0] || null;

  return (
    <View style={[styles.modernCard, !item.active && styles.cardInactive]}>
      {/* Top Body: ALWAYS Side-by-Side (Image to side, info to other side) */}
      <View style={styles.cardMainRow}>
        
        {/* Left Column: Image & Thumbnails */}
        <View style={[styles.galleryCol, { width: galleryWidth }]}>
          <View style={styles.mainImageBox}>
            {currentImage ? (
              <Image source={{ uri: currentImage }} style={styles.mainImage} resizeMode="cover" />
            ) : (
              <View style={[styles.mainImagePlaceholder, { backgroundColor: catStyle.bg }]}>
                <Text style={styles.placeholderEmoji}>{catEmoji}</Text>
                <Text style={[styles.placeholderCategory, { color: catStyle.color }]}>{item.category}</Text>
              </View>
            )}

            {/* Overlaid Status Pill */}
            <View style={[styles.statusBadgePill, { backgroundColor: item.active ? 'rgba(236,253,245,0.95)' : 'rgba(254,242,242,0.95)', borderColor: item.active ? '#A7F3D0' : '#FECACA' }]}>
              <View style={[styles.statusBadgeDot, { backgroundColor: item.active ? '#10B981' : '#EF4444' }]} />
              <Text style={[styles.statusBadgeText, { color: item.active ? '#065F46' : '#991B1B' }]}>
                {item.active ? 'Active' : 'Inactive'}
              </Text>
            </View>

            {/* Overlaid SKU */}
            <View style={styles.skuBadgePill}>
              <Text style={styles.skuBadgeText}>#{item.sku || '32001'}</Text>
            </View>

            {/* Expand / View Fullscreen Button */}
            <TouchableOpacity 
              style={styles.expandBtn} 
              onPress={() => onView(item)} 
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="crop-free" size={isCompact ? 14 : 17} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Thumbnails Row (Only shown when multiple images exist) */}
          {allImages.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailRow}
            >
              {allImages.slice(0, 4).map((uri, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setActiveIdx(idx)}
                  activeOpacity={0.8}
                  style={[
                    styles.thumbnailBox,
                    { width: isCompact ? 32 : 40, height: isCompact ? 32 : 40 },
                    activeIdx === idx && styles.thumbnailBoxActive,
                  ]}
                >
                  <Image source={{ uri }} style={styles.thumbnailImg} resizeMode="cover" />
                </TouchableOpacity>
              ))}
              {allImages.length > 4 && (
                <TouchableOpacity 
                  style={[styles.moreThumbBox, { width: isCompact ? 32 : 40, height: isCompact ? 32 : 40 }]} 
                  onPress={() => onView(item)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.moreThumbPlus}>+</Text>
                  <Text style={styles.moreThumbText}>{allImages.length - 4} more</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}
        </View>

        {/* Right Column: Details */}
        <View style={[styles.detailsCol, { paddingLeft: isCompact ? 10 : 16 }]}>
          {/* Header Row: Title & Top Controls */}
          <View style={styles.detailsHeaderRow}>
            <Text style={[styles.itemTitle, isCompact && { fontSize: 16 }]} numberOfLines={1}>{item.name}</Text>
            <View style={styles.topControls}>
              <View style={styles.switchControl}>
                <Switch
                  value={item.active}
                  onValueChange={() => onToggleStatus(item.id)}
                  trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                  thumbColor={item.active ? '#FFFFFF' : '#F3F4F6'}
                  style={styles.headerSwitch}
                />
                <Text style={[styles.switchText, { color: item.active ? '#059669' : '#9CA3AF' }]}>
                  {item.active ? 'Active' : 'Inactive'}
                </Text>
              </View>

              <TouchableOpacity style={styles.pillBtn} onPress={() => onEdit(item)} activeOpacity={0.7}>
                <MaterialCommunityIcons name="pencil" size={13} color="#374151" />
                <Text style={styles.pillBtnText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.pillDeleteBtn} onPress={() => onDelete(item.id)} activeOpacity={0.7}>
                <MaterialCommunityIcons name="trash-can-outline" size={13} color="#EF4444" />
                <Text style={styles.pillDeleteBtnText}>Delete</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.pillDotsBtn} onPress={() => onView(item)} activeOpacity={0.7}>
                <MaterialCommunityIcons name="dots-horizontal" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Tags Row */}
          <View style={styles.tagsRow}>
            {item.brand ? (
              <View style={styles.tagBadge}>
                <Text style={styles.tagBadgeText}>{item.brand}</Text>
              </View>
            ) : null}
            {item.category ? (
              <View style={styles.tagBadge}>
                <Text style={styles.tagBadgeText}>{item.category}</Text>
              </View>
            ) : null}
          </View>

          {/* Description */}
          <Text style={styles.descText} numberOfLines={2}>
            {item.description || 'High quality materials and hardware for furniture, doors, interior and industrial use. Durable, reliable and long-lasting.'}
          </Text>

          {/* Price & Stock Status Cards Row */}
          <View style={styles.dualCardsRow}>
            {/* Price Card */}
            <View style={styles.priceCard}>
              <Text style={styles.subCardLabel}>Price</Text>
              <View style={styles.priceValueRow}>
                <Text style={styles.priceVal}>
                  ₹{item.price?.toLocaleString('en-IN')}
                  <Text style={styles.priceUnit}>/{item.unit || 'piece'}</Text>
                </Text>
                {item.mrp && item.mrp > item.price ? (
                  <>
                    <Text style={styles.mrpVal}>₹{item.mrp.toLocaleString('en-IN')}</Text>
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountBadgeText}>{item.discountPercent}% OFF</Text>
                    </View>
                  </>
                ) : null}
              </View>
            </View>

            {/* Stock Status Card */}
            <View style={[styles.stockCard, { backgroundColor: stockBg, borderColor: stockBorder }]}>
              <View style={styles.stockCardLeft}>
                <View style={[styles.stockIconBox, { backgroundColor: stockIconBg }]}>
                  <MaterialCommunityIcons name="cube-outline" size={20} color={stockColor} />
                </View>
                <View>
                  <Text style={styles.subCardLabel}>Stock Status</Text>
                  <View style={styles.stockStatusRow}>
                    <View style={[styles.stockDot, { backgroundColor: stockColor }]} />
                    <Text style={[styles.stockStatusText, { color: stockColor }]}>{stockLabel}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.stockCardRight}>
                <Text style={styles.stockQty}>{item.stock}</Text>
                <Text style={styles.stockUnit}>{item.unit ? `${item.unit}s` : 'pieces'}</Text>
              </View>
            </View>
          </View>

          {/* Stats Bar */}
          <View style={styles.statsBar}>
            <View style={styles.statCol}>
              <MaterialCommunityIcons name="cart-outline" size={18} color="#6B7280" />
              <View style={styles.statTextWrap}>
                <Text style={styles.statValText}>{item.sold || 0}</Text>
                <Text style={styles.statLblText}>Sold</Text>
              </View>
            </View>
            <View style={styles.statDividerLine} />
            <View style={styles.statCol}>
              <MaterialCommunityIcons name="cube-outline" size={18} color="#6B7280" />
              <View style={styles.statTextWrap}>
                <Text style={styles.statValText}>{item.stock}</Text>
                <Text style={styles.statLblText}>In Stock</Text>
              </View>
            </View>
            <View style={styles.statDividerLine} />
            <View style={styles.statCol}>
              <MaterialCommunityIcons name="chart-bar" size={18} color="#6B7280" />
              <View style={styles.statTextWrap}>
                <Text style={styles.statValText}>₹{((item.price || 0) * (item.sold || 0)).toLocaleString('en-IN')}</Text>
                <Text style={styles.statLblText}>Revenue</Text>
              </View>
            </View>
          </View>

          {/* Meta Info: Product ID & Added On */}
          <View style={styles.metaInfoRow}>
            <View style={styles.metaBlockLeft}>
              <MaterialCommunityIcons name="barcode" size={20} color="#9CA3AF" />
              <View style={styles.metaTextCol}>
                <Text style={styles.metaLabel}>Product ID</Text>
                <View style={styles.idRow}>
                  <Text style={styles.idVal} numberOfLines={1}>{item.id}</Text>
                  <TouchableOpacity onPress={() => copyToClipboard(item.id, setCopied)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                    <MaterialCommunityIcons 
                      name={copied ? "check" : "content-copy"} 
                      size={13} 
                      color={copied ? "#10B981" : "#9CA3AF"} 
                    />
                  </TouchableOpacity>
                  {copied && <Text style={styles.copiedBadge}>Copied!</Text>}
                </View>
              </View>
            </View>

            <View style={styles.metaDividerLine} />

            <View style={styles.metaBlockRight}>
              <MaterialCommunityIcons name="calendar-blank-outline" size={18} color="#9CA3AF" />
              <View style={styles.metaTextCol}>
                <Text style={styles.metaLabel}>Added On</Text>
                <Text style={styles.dateVal}>{formatDate(item.createdAt)}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Bottom Full Action Buttons */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.bottomEditBtn} onPress={() => onEdit(item)} activeOpacity={0.8}>
          <MaterialCommunityIcons name="pencil" size={15} color="#374151" />
          <Text style={styles.bottomEditText}>Edit Product</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomDeleteBtn} onPress={() => onDelete(item.id)} activeOpacity={0.8}>
          <MaterialCommunityIcons name="trash-can-outline" size={15} color="#EF4444" />
          <Text style={styles.bottomDeleteText}>Delete Product</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomViewBtn} onPress={() => onView(item)} activeOpacity={0.8}>
          <LinearGradient
            colors={['#F59E0B', '#E58A00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bottomViewGradient}
          >
            <MaterialCommunityIcons name="eye-outline" size={16} color="#FFFFFF" />
            <Text style={styles.bottomViewText}>View Product</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ── Rental Equipment Card ─────────────────────────────────────────────────────
const RentalCard = ({ item, onToggleStatus, onDelete, onEdit, onView }) => {
  const { width } = useWindowDimensions();
  const galleryWidth = width < 500 ? 150 : width < 750 ? 190 : width < 1000 ? 240 : 280;
  const isCompact = width < 600;
  const [activeIdx, setActiveIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const totalUnits = item.stock ?? 0;
  const rentedOut = item.rentedOut ?? 0;
  const available = totalUnits - rentedOut;
  const allRented = available === 0;

  const availColor = allRented ? '#DC2626' : available <= 1 ? '#D97706' : '#059669';
  const availBg = allRented ? '#FEF2F2' : available <= 1 ? '#FFFBEB' : '#F0FDF4';
  const availBorder = allRented ? '#FEE2E2' : available <= 1 ? '#FEF3C7' : '#DCFCE7';
  const availIconBg = allRented ? '#FEE2E2' : available <= 1 ? '#FEF3C7' : '#DCFCE7';
  const availLabel = allRented ? 'All Rented Out' : `${available} Available`;

  const catStyle = RENTAL_CATEGORY_COLORS[item.category] || { bg: colors.surfaceElevated, color: colors.textMuted };
  const catEmoji = RENTAL_CATEGORY_EMOJI[item.category] || '📦';

  const allImages = (item.images && item.images.length > 0) ? item.images : (item.image ? [item.image] : []);
  const currentImage = allImages[activeIdx] || allImages[0] || null;

  return (
    <View style={[styles.modernCard, !item.active && styles.cardInactive]}>
      {/* Top Body: ALWAYS Side-by-Side (Image to side, info to other side) */}
      <View style={styles.cardMainRow}>
        
        {/* Left Column: Image & Thumbnails */}
        <View style={[styles.galleryCol, { width: galleryWidth }]}>
          <View style={styles.mainImageBox}>
            {currentImage ? (
              <Image source={{ uri: currentImage }} style={styles.mainImage} resizeMode="cover" />
            ) : (
              <View style={[styles.mainImagePlaceholder, { backgroundColor: catStyle.bg }]}>
                <Text style={styles.placeholderEmoji}>{catEmoji}</Text>
                <Text style={[styles.placeholderCategory, { color: catStyle.color }]}>{item.category}</Text>
              </View>
            )}

            {/* Overlaid Status Pill */}
            <View style={[styles.statusBadgePill, { backgroundColor: item.active ? 'rgba(236,253,245,0.95)' : 'rgba(254,242,242,0.95)', borderColor: item.active ? '#A7F3D0' : '#FECACA' }]}>
              <View style={[styles.statusBadgeDot, { backgroundColor: item.active ? '#10B981' : '#EF4444' }]} />
              <Text style={[styles.statusBadgeText, { color: item.active ? '#065F46' : '#991B1B' }]}>
                {item.active ? 'Active' : 'Inactive'}
              </Text>
            </View>

            {/* Overlaid SKU */}
            <View style={styles.skuBadgePill}>
              <Text style={styles.skuBadgeText}>#{item.sku || '32001'}</Text>
            </View>

            {/* Expand / View Fullscreen Button */}
            <TouchableOpacity 
              style={styles.expandBtn} 
              onPress={() => onView(item)} 
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="crop-free" size={isCompact ? 14 : 17} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Thumbnails Row (Only shown when multiple images exist) */}
          {allImages.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailRow}
            >
              {allImages.slice(0, 4).map((uri, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setActiveIdx(idx)}
                  activeOpacity={0.8}
                  style={[
                    styles.thumbnailBox,
                    { width: isCompact ? 32 : 40, height: isCompact ? 32 : 40 },
                    activeIdx === idx && styles.thumbnailBoxActive,
                  ]}
                >
                  <Image source={{ uri }} style={styles.thumbnailImg} resizeMode="cover" />
                </TouchableOpacity>
              ))}
              {allImages.length > 4 && (
                <TouchableOpacity 
                  style={[styles.moreThumbBox, { width: isCompact ? 32 : 40, height: isCompact ? 32 : 40 }]} 
                  onPress={() => onView(item)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.moreThumbPlus}>+</Text>
                  <Text style={styles.moreThumbText}>{allImages.length - 4} more</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}
        </View>

        {/* Right Column: Details */}
        <View style={[styles.detailsCol, { paddingLeft: isCompact ? 10 : 16 }]}>
          {/* Header Row: Title & Top Controls */}
          <View style={styles.detailsHeaderRow}>
            <Text style={[styles.itemTitle, isCompact && { fontSize: 16 }]} numberOfLines={1}>{item.name}</Text>
            <View style={styles.topControls}>
              <View style={styles.switchControl}>
                <Switch
                  value={item.active}
                  onValueChange={() => onToggleStatus(item.id)}
                  trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                  thumbColor={item.active ? '#FFFFFF' : '#F3F4F6'}
                  style={styles.headerSwitch}
                />
                <Text style={[styles.switchText, { color: item.active ? '#059669' : '#9CA3AF' }]}>
                  {item.active ? 'Active' : 'Inactive'}
                </Text>
              </View>

              <TouchableOpacity style={styles.pillBtn} onPress={() => onEdit(item)} activeOpacity={0.7}>
                <MaterialCommunityIcons name="pencil" size={13} color="#374151" />
                <Text style={styles.pillBtnText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.pillDeleteBtn} onPress={() => onDelete(item.id)} activeOpacity={0.7}>
                <MaterialCommunityIcons name="trash-can-outline" size={13} color="#EF4444" />
                <Text style={styles.pillDeleteBtnText}>Delete</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.pillDotsBtn} onPress={() => onView(item)} activeOpacity={0.7}>
                <MaterialCommunityIcons name="dots-horizontal" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Tags Row */}
          <View style={styles.tagsRow}>
            {item.brand ? (
              <View style={styles.tagBadge}>
                <Text style={styles.tagBadgeText}>{item.brand}</Text>
              </View>
            ) : null}
            {item.category ? (
              <View style={styles.tagBadge}>
                <Text style={styles.tagBadgeText}>{item.category}</Text>
              </View>
            ) : null}
            <View style={[styles.tagBadge, { backgroundColor: '#EEF2FF' }]}>
              <Text style={[styles.tagBadgeText, { color: '#4F46E5' }]}>🏗️ Rental</Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.descText} numberOfLines={2}>
            {item.description || 'Heavy-duty construction equipment and rental machinery available for short and long-term project requirements.'}
          </Text>

          {/* Price & Stock Status Cards Row */}
          <View style={styles.dualCardsRow}>
            {/* Rental Rate Card */}
            <View style={styles.priceCard}>
              <Text style={styles.subCardLabel}>Rental Rate</Text>
              <View style={styles.priceValueRow}>
                <Text style={styles.priceVal}>
                  ₹{(item.rentalPrice || item.price || 0).toLocaleString('en-IN')}
                  <Text style={styles.priceUnit}> /day</Text>
                </Text>
                {item.mrp && item.mrp > (item.rentalPrice || item.price || 0) ? (
                  <>
                    <Text style={styles.mrpVal}>₹{item.mrp.toLocaleString('en-IN')}</Text>
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountBadgeText}>{item.discountPercent}% OFF</Text>
                    </View>
                  </>
                ) : null}
              </View>
              <Text style={styles.depositSmallText}>Deposit: ₹{(item.deposit || 0).toLocaleString('en-IN')}</Text>
            </View>

            {/* Availability Card */}
            <View style={[styles.stockCard, { backgroundColor: availBg, borderColor: availBorder }]}>
              <View style={styles.stockCardLeft}>
                <View style={[styles.stockIconBox, { backgroundColor: availIconBg }]}>
                  <MaterialCommunityIcons name="cube-outline" size={20} color={availColor} />
                </View>
                <View>
                  <Text style={styles.subCardLabel}>Stock Status</Text>
                  <View style={styles.stockStatusRow}>
                    <View style={[styles.stockDot, { backgroundColor: availColor }]} />
                    <Text style={[styles.stockStatusText, { color: availColor }]}>{availLabel}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.stockCardRight}>
                <Text style={styles.stockQty}>{available}</Text>
                <Text style={styles.stockUnit}>of {totalUnits} units</Text>
              </View>
            </View>
          </View>

          {/* Fleet Metrics Bar */}
          <View style={styles.statsBar}>
            <View style={styles.statCol}>
              <MaterialCommunityIcons name="cube-outline" size={18} color="#6B7280" />
              <View style={styles.statTextWrap}>
                <Text style={styles.statValText}>{totalUnits}</Text>
                <Text style={styles.statLblText}>Total Fleet</Text>
              </View>
            </View>
            <View style={styles.statDividerLine} />
            <View style={styles.statCol}>
              <MaterialCommunityIcons name="truck-outline" size={18} color="#6B7280" />
              <View style={styles.statTextWrap}>
                <Text style={[styles.statValText, { color: colors.orange }]}>{rentedOut}</Text>
                <Text style={styles.statLblText}>Rented Out</Text>
              </View>
            </View>
            <View style={styles.statDividerLine} />
            <View style={styles.statCol}>
              <MaterialCommunityIcons name="calendar-clock" size={18} color="#6B7280" />
              <View style={styles.statTextWrap}>
                <Text style={styles.statValText}>{item.minRentalDays || 1}d</Text>
                <Text style={styles.statLblText}>Min Rental</Text>
              </View>
            </View>
          </View>

          {/* Meta Info: Product ID & Added On */}
          <View style={styles.metaInfoRow}>
            <View style={styles.metaBlockLeft}>
              <MaterialCommunityIcons name="barcode" size={20} color="#9CA3AF" />
              <View style={styles.metaTextCol}>
                <Text style={styles.metaLabel}>Product ID</Text>
                <View style={styles.idRow}>
                  <Text style={styles.idVal} numberOfLines={1}>{item.id}</Text>
                  <TouchableOpacity onPress={() => copyToClipboard(item.id, setCopied)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                    <MaterialCommunityIcons 
                      name={copied ? "check" : "content-copy"} 
                      size={13} 
                      color={copied ? "#10B981" : "#9CA3AF"} 
                    />
                  </TouchableOpacity>
                  {copied && <Text style={styles.copiedBadge}>Copied!</Text>}
                </View>
              </View>
            </View>

            <View style={styles.metaDividerLine} />

            <View style={styles.metaBlockRight}>
              <MaterialCommunityIcons name="calendar-blank-outline" size={18} color="#9CA3AF" />
              <View style={styles.metaTextCol}>
                <Text style={styles.metaLabel}>Added On</Text>
                <Text style={styles.dateVal}>{formatDate(item.createdAt)}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Bottom Full Action Buttons */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.bottomEditBtn} onPress={() => onEdit(item)} activeOpacity={0.8}>
          <MaterialCommunityIcons name="pencil" size={15} color="#374151" />
          <Text style={styles.bottomEditText}>Edit Product</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomDeleteBtn} onPress={() => onDelete(item.id)} activeOpacity={0.8}>
          <MaterialCommunityIcons name="trash-can-outline" size={15} color="#EF4444" />
          <Text style={styles.bottomDeleteText}>Delete Product</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomViewBtn} onPress={() => onView(item)} activeOpacity={0.8}>
          <LinearGradient
            colors={['#F59E0B', '#E58A00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bottomViewGradient}
          >
            <MaterialCommunityIcons name="eye-outline" size={16} color="#FFFFFF" />
            <Text style={styles.bottomViewText}>View Product</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
const InventoryScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { mode, canToggle } = useModeStore();

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
          {canToggle && <ModeToggle />}
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
                        {viewProduct.mrp && viewProduct.mrp > (viewProduct.rentalPrice || viewProduct.price || 0) ? (
                          <Text style={styles.modalMrpText}>₹{viewProduct.mrp.toLocaleString('en-IN')} · {viewProduct.discountPercent}% OFF</Text>
                        ) : null}
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
                        {viewProduct.mrp && viewProduct.mrp > (viewProduct.price || 0) ? (
                          <Text style={styles.modalMrpText}>₹{viewProduct.mrp.toLocaleString('en-IN')} · {viewProduct.discountPercent}% OFF</Text>
                        ) : null}
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

  // ── Modern 2-Column Card (Matches Target Design) ───────────────────────────
  modernCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardInactive: { opacity: 0.55 },

  cardMainRow: {
    width: '100%',
    flexDirection: 'row',
  },

  // Gallery Column
  galleryCol: {
    alignSelf: 'stretch',
    justifyContent: 'space-between',
  },
  mainImageBox: {
    width: '100%',
    flex: 1,
    minHeight: 140,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  mainImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  statusBadgePill: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    zIndex: 2,
  },
  statusBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  skuBadgePill: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 2,
  },
  skuBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  expandBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 2,
  },

  // Thumbnails Strip
  thumbnailRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    flexShrink: 0,
  },
  thumbnailBox: {
    width: 38,
    height: 38,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  thumbnailBoxActive: {
    borderWidth: 2,
    borderColor: '#0D9488',
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
  },
  moreThumbBox: {
    width: 38,
    height: 38,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreThumbPlus: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    lineHeight: 14,
  },
  moreThumbText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
  },

  // Details Column
  detailsCol: {
    flex: 1,
    justifyContent: 'space-between',
  },
  detailsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  itemTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    minWidth: 160,
  },
  topControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  headerSwitch: {
    transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }],
  },
  switchText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pillBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  pillDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  pillDeleteBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EF4444',
  },
  pillDotsBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tags
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    marginBottom: 6,
  },
  tagBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },

  descText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 10,
  },

  // Dual Cards Row (Price & Stock)
  dualCardsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  priceCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  subCardLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
  },
  priceValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    flexWrap: 'wrap',
  },
  priceVal: {
    fontSize: 19,
    fontWeight: '900',
    color: '#F59E0B',
  },
  priceUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  mrpVal: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
  },
  discountBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  depositSmallText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },

  stockCard: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stockCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  stockIconBox: {
    width: 30,
    height: 30,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  stockStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  stockCardRight: {
    alignItems: 'flex-end',
  },
  stockQty: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  stockUnit: {
    fontSize: 10,
    color: '#64748B',
  },

  // Stats Bar (Sold / In Stock / Revenue)
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  statCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  statTextWrap: {
    alignItems: 'flex-start',
  },
  statValText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLblText: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '500',
  },
  statDividerLine: {
    width: 1,
    height: 20,
    backgroundColor: '#E2E8F0',
  },

  // Meta Info Row (Product ID & Added On)
  metaInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  metaBlockLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    flexShrink: 1,
  },
  metaDividerLine: {
    width: 1,
    height: 22,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 10,
  },
  metaBlockRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  metaTextCol: {
    justifyContent: 'center',
  },
  metaLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  idVal: {
    fontSize: 11,
    color: '#334155',
    maxWidth: 160,
  },
  copiedBadge: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '700',
  },
  dateVal: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '500',
  },

  // Bottom Full Action Buttons Row
  bottomActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  bottomEditBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6,
  },
  bottomEditText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  bottomDeleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6,
  },
  bottomDeleteText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  bottomViewBtn: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  bottomViewGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  bottomViewText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

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
  modalMrpText: { fontSize: 11, fontWeight: '600', color: colors.textMuted, marginTop: 3, textDecorationLine: 'line-through' },
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