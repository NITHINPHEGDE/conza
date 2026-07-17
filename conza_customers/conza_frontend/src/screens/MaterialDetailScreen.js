import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { materialDescriptions, materialOffers } from '../data/dummyData';
import useAppStore from '../store/useAppStore';

const { width } = Dimensions.get('window');


// ─── Quantity Dialog ──────────────────────────────────────────────────────────
const QuantityDialog = React.memo(({ visible, item, onClose, onConfirm }) => {
  const [qty, setQty] = useState(1);

  const handleConfirm = useCallback(() => {
    onConfirm(qty);
    setQty(1);
  }, [onConfirm, qty]);

  const handleClose = useCallback(() => {
    setQty(1);
    onClose();
  }, [onClose]);

  const handleMinus = useCallback(() => setQty((q) => Math.max(1, q - 1)), []);
  const handlePlus = useCallback(() => setQty((q) => q + 1), []);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={styles.dialogOverlay}
        activeOpacity={1}
        onPress={handleClose}
      >
        <TouchableOpacity style={styles.dialogSheet} activeOpacity={1}>
          <View style={styles.dialogHandle} />

          <Text style={styles.dialogTitle}>How many do you need?</Text>
          <Text style={styles.dialogSub} numberOfLines={1}>{item?.name}</Text>

          {/* Counter */}
          <View style={styles.counterRow}>
            <TouchableOpacity
              style={styles.counterBtn}
              onPress={handleMinus}
              activeOpacity={0.75}
            >
              <Text style={styles.counterBtnText}>−</Text>
            </TouchableOpacity>

            <View style={styles.counterDisplay}>
              <Text style={styles.counterValue}>{qty}</Text>
              <Text style={styles.counterUnit}>{item?.unit}</Text>
            </View>

            <TouchableOpacity
              style={styles.counterBtn}
              onPress={handlePlus}
              activeOpacity={0.75}
            >
              <Text style={styles.counterBtnText}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Total preview */}
          <View style={styles.dialogTotalRow}>
            <Text style={styles.dialogTotalLabel}>Total</Text>
            <Text style={styles.dialogTotalValue}>
              ₹{item ? (item.price * qty).toLocaleString() : 0}
            </Text>
          </View>

          {/* Confirm */}
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.dialogConfirmBtn}
          >
            <TouchableOpacity
              style={styles.dialogConfirmTouch}
              activeOpacity={0.85}
              onPress={handleConfirm}
            >
              <Text style={styles.dialogConfirmText}>
                Proceed to Checkout →
              </Text>
            </TouchableOpacity>
          </LinearGradient>

          <TouchableOpacity
            onPress={handleClose}
            style={styles.dialogCancel}
            activeOpacity={0.7}
          >
            <Text style={styles.dialogCancelText}>Cancel</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
const MaterialDetailScreen = ({ route, navigation }) => {
  const { item } = route.params || {};
  const addToCart = useAppStore((s) => s.addToCart);
  
  const [showDialog, setShowDialog]                 = useState(false);
  const [cartAdded, setCartAdded]                   = useState(false);
  const [showReturnTerms, setShowReturnTerms]       = useState(false);
  const [showReplacementTerms, setShowReplacementTerms] = useState(false);
  const [activeImageIndex, setActiveImageIndex]     = useState(0);

  if (!item) return null;

  const offer       = materialOffers[item.id];
  const description = materialDescriptions[item.id] || 'High quality construction material sourced from certified suppliers.';
  const discountedPrice = useMemo(() => Math.round(item.price * 0.95), [item.price]);

  // Vendor can upload up to 5 images per product — fall back to the single
  // `image` field for older/dummy data that predates the multi-image array.
  const images = useMemo(
    () => (Array.isArray(item.images) && item.images.length ? item.images : (item.image ? [item.image] : [])),
    [item.images, item.image]
  );

  const handleImageScroll = useCallback((e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveImageIndex(idx);
  }, []);

  const handleBuyNowConfirm = useCallback((qty) => {
    setShowDialog(false);
    navigation.navigate('MaterialCheckout', {
      cartItems: [item],
      cart: { [item.id]: qty },
    });
  }, [item, navigation]);

  const handleAddToCart = useCallback(() => {
    addToCart(item);
    setCartAdded(true);
    setTimeout(() => setCartAdded(false), 2000);
  }, [addToCart, item]);

  const openDialog = useCallback(() => setShowDialog(true), []);
  const closeDialog = useCallback(() => setShowDialog(false), []);
  const openReturnTerms = useCallback(() => setShowReturnTerms(true), []);
  const closeReturnTerms = useCallback(() => setShowReturnTerms(false), []);
  const openReplacementTerms = useCallback(() => setShowReplacementTerms(true), []);
  const closeReplacementTerms = useCallback(() => setShowReplacementTerms(false), []);

  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);

  const buyButtonColors = useMemo(() => 
    item.inStock ? [colors.gradientStart, colors.gradientEnd] : ['#ccc', '#bbb'],
    [item.inStock]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Back button — floats over image */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={handleGoBack}
        activeOpacity={0.8}
      >
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Hero Image ── */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleImageScroll}
            scrollEventThrottle={16}
          >
            {images.map((uri, idx) => (
              <Image
                key={`${uri}-${idx}`}
                source={{ uri }}
                style={[styles.image, { width }]}
                resizeMode="contain"
              />
            ))}
          </ScrollView>

          {/* Pagination dots — only shown when there's more than one image */}
          {images.length > 1 && (
            <View style={styles.imageDots} pointerEvents="none">
              {images.map((_, idx) => (
                <View
                  key={idx}
                  style={[styles.imageDot, idx === activeImageIndex && styles.imageDotActive]}
                />
              ))}
            </View>
          )}

          {/* Dark gradient overlay at bottom of image */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.62)']}
            style={styles.imageOverlay}
            pointerEvents="none"
          >
            {/* Seller + Rating pinned to bottom of image */}
            <View style={styles.imageFooter}>
              <View style={styles.sellerRow}>
                <Text style={styles.sellerIcon}>🏪</Text>
                <Text style={styles.sellerName}>{item.seller}</Text>
              </View>
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingStar}>⭐</Text>
                <Text style={styles.ratingValue}>{item.rating}</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Stock badge */}
          <View style={[styles.stockBadge, { backgroundColor: item.inStock ? 'rgba(34,197,94,0.92)' : 'rgba(224,59,59,0.92)' }]}>
            <View style={styles.stockDot} />
            <Text style={styles.stockText}>{item.inStock ? 'In Stock' : 'Out of Stock'}</Text>
          </View>
        </View>

        {/* ── Product Info ── */}
        <View style={styles.infoSection}>

          {/* Name */}
          <Text style={styles.productName}>{item.name}</Text>

          {/* Price + Offer */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{item.price}</Text>
            <Text style={styles.priceUnit}>{item.unit}</Text>
            {offer && (
              <View style={styles.offerBadge}>
                <Text style={styles.offerText}>🎁 {offer}</Text>
              </View>
            )}
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Description */}
          <Text style={styles.descTitle}>About this product</Text>
          <Text style={styles.description}>{description}</Text>

          {/* Specs row */}
          <View style={styles.specsRow}>
            <View style={styles.specItem}>
              <Text style={styles.specIcon}>🚚</Text>
              <Text style={styles.specLabel}>Fast Delivery</Text>
            </View>
            <View style={styles.specDivider} />
            <View style={styles.specItem}>
              <Text style={styles.specIcon}>✅</Text>
              <Text style={styles.specLabel}>BIS Certified</Text>
            </View>
            {item.returnable && (
              <>
                <View style={styles.specDivider} />
                <View style={styles.specItem}>
                  <Text style={styles.specIcon}>🔁</Text>
                  <Text style={styles.specLabel}>Easy Returns</Text>
                </View>
              </>
            )}
            {item.replaceable && (
              <>
                <View style={styles.specDivider} />
                <View style={styles.specItem}>
                  <Text style={styles.specIcon}>🔄</Text>
                  <Text style={styles.specLabel}>Replaceable</Text>
                </View>
              </>
            )}
          </View>

          {/* Terms & Conditions dialog triggers — only if returnable or replaceable */}
          {(item.returnable || item.replaceable) && (
            <View style={styles.termsRow}>
              {item.returnable && (
                <TouchableOpacity
                  style={styles.termsBtn}
                  activeOpacity={0.8}
                  onPress={openReturnTerms}
                >
                  <Text style={styles.termsBtnIcon}>↩️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.termsBtnTitle}>Return Terms</Text>
                    <Text style={styles.termsBtnSub}>Tap to view conditions</Text>
                  </View>
                  <Text style={styles.termsBtnArrow}>›</Text>
                </TouchableOpacity>
              )}
              {item.replaceable && (
                <TouchableOpacity
                  style={styles.termsBtn}
                  activeOpacity={0.8}
                  onPress={openReplacementTerms}
                >
                  <Text style={styles.termsBtnIcon}>🔄</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.termsBtnTitle}>Replacement Terms</Text>
                    <Text style={styles.termsBtnSub}>Tap to view conditions</Text>
                  </View>
                  <Text style={styles.termsBtnArrow}>›</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Bottom Buttons ── */}
      <View style={styles.bottomBar}>
        {/* Add to Cart — white/outline */}
        <TouchableOpacity
          style={[styles.cartBtn, cartAdded && styles.cartBtnAdded]}
          onPress={handleAddToCart}
          activeOpacity={0.8}
        >
          <Text style={[styles.cartBtnText, cartAdded && styles.cartBtnTextAdded]}>
            {cartAdded ? '✓ Added' : '🛒 Add to Cart'}
          </Text>
        </TouchableOpacity>

        {/* Buy Now — yellow gradient */}
        <LinearGradient
          colors={buyButtonColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.buyBtn}
        >
          <TouchableOpacity
            style={styles.buyBtnTouch}
            activeOpacity={0.85}
            disabled={!item.inStock}
            onPress={openDialog}
          >
            <Text style={styles.buyBtnText}>
              {item.inStock ? 'Buy Now ⚡' : 'Out of Stock'}
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* ── Quantity Dialog ── */}
      <QuantityDialog
        visible={showDialog}
        item={item}
        onClose={closeDialog}
        onConfirm={handleBuyNowConfirm}
      />

      {/* Return Terms Modal */}
      <Modal visible={showReturnTerms} transparent animationType="slide" onRequestClose={closeReturnTerms}>
        <TouchableOpacity style={styles.dialogOverlay} activeOpacity={1} onPress={closeReturnTerms}>
          <TouchableOpacity style={styles.dialogSheet} activeOpacity={1}>
            <View style={styles.dialogHandle} />
            <Text style={styles.termsModalIcon}>↩️</Text>
            <Text style={styles.termsModalTitle}>Return Terms & Conditions</Text>
            <Text style={styles.termsModalText}>{item.returnPolicy}</Text>
            <TouchableOpacity style={styles.termsModalCloseBtn} onPress={closeReturnTerms} activeOpacity={0.8}>
              <Text style={styles.termsModalCloseBtnText}>Got it</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Replacement Terms Modal */}
      <Modal visible={showReplacementTerms} transparent animationType="slide" onRequestClose={closeReplacementTerms}>
        <TouchableOpacity style={styles.dialogOverlay} activeOpacity={1} onPress={closeReplacementTerms}>
          <TouchableOpacity style={styles.dialogSheet} activeOpacity={1}>
            <View style={styles.dialogHandle} />
            <Text style={styles.termsModalIcon}>🔄</Text>
            <Text style={styles.termsModalTitle}>Replacement Terms & Conditions</Text>
            <Text style={styles.termsModalText}>{item.replacementPolicy}</Text>
            <TouchableOpacity style={styles.termsModalCloseBtn} onPress={closeReplacementTerms} activeOpacity={0.8}>
              <Text style={styles.termsModalCloseBtnText}>Got it</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  backBtn: {
    position: 'absolute',
    top: 54,
    left: 16,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 6,
  },
  backArrow: { fontSize: 18, color: colors.textPrimary, fontWeight: '700' },

  scroll: { paddingBottom: 20 },

  // Image
  imageContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
    backgroundColor: colors.surfaceElevated,
  },
  image: { width: '100%', height: '100%' },
  imageDots: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  imageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  imageDotActive: {
    width: 18,
    backgroundColor: '#FFFFFF',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  imageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sellerIcon: { fontSize: 14 },
  sellerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  ratingStar: { fontSize: 12 },
  ratingValue: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },

  stockBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  stockDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  stockText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  // Info section
  infoSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  productName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.1,
    marginBottom: 10,
    lineHeight: 28,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
    flexWrap: 'wrap',
  },
  price: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.accentAmber,
  },
  priceUnit: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
    marginTop: 4,
  },
  offerBadge: {
    backgroundColor: colors.accentYellowSoft,
    borderWidth: 1,
    borderColor: colors.accentYellow,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  offerText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accentAmber,
  },

  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginBottom: 18,
  },

  descTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    fontWeight: '400',
    marginBottom: 20,
  },

  // Specs
  specsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 10,
  },
  specItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  specIcon: { fontSize: 20 },
  specLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  specDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  cartBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cartBtnAdded: {
    borderColor: '#22C55E',
    backgroundColor: 'rgba(34,197,94,0.08)',
  },
  cartBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cartBtnTextAdded: {
    color: '#22C55E',
  },
  buyBtn: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  buyBtnTouch: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },

  // Quantity Dialog
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  dialogSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
  dialogHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 22,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  dialogSub: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 28,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 24,
  },
  counterBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.accentYellowSoft,
    borderWidth: 1.5,
    borderColor: colors.accentYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnText: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.accentAmber,
    lineHeight: 30,
  },
  counterDisplay: { alignItems: 'center', minWidth: 80 },
  counterValue: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 56,
  },
  counterUnit: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
    marginTop: 2,
  },
  dialogTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.accentYellowSoft,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(245,200,66,0.3)',
  },
  dialogTotalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  dialogTotalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.accentAmber,
  },
  dialogConfirmBtn: { borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  dialogConfirmTouch: { paddingVertical: 16, alignItems: 'center' },
  dialogConfirmText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
  dialogCancel: { paddingVertical: 10, alignItems: 'center' },
  dialogCancelText: { fontSize: 14, color: colors.textMuted, fontWeight: '600' },
  termsRow: {
    gap: 10,
    marginBottom: 10,
  },
  termsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  termsBtnIcon: { fontSize: 20 },
  termsBtnTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  termsBtnSub: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  termsBtnArrow: {
    fontSize: 22,
    color: colors.textMuted,
    fontWeight: '300',
    lineHeight: 26,
  },
  termsModalIcon: {
    fontSize: 36,
    textAlign: 'center',
    marginBottom: 10,
  },
  termsModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  termsModalText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    fontWeight: '400',
    marginBottom: 24,
    textAlign: 'center',
  },
  termsModalCloseBtn: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  termsModalCloseBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});

export default MaterialDetailScreen;