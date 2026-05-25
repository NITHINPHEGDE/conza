import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Image, Alert, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import useVendorStore from '../store/useVendorStore';
import { colors } from '../theme/colors';
import { uploadImagesToCloudinary } from '../utils/cloudinary';

const CATEGORIES = [
  'Cement', 'Steel', 'Sand', 'Bricks',
  'Aggregate', 'Timber', 'Paint', 'Plumbing', 'Electrical', 'Other',
];

const UNITS = ['bag', 'piece', 'ton', 'kg', 'litre', 'box', 'roll', 'sheet', 'set', 'meter'];

const MAX_IMAGES = 5;

const Field = ({ label, children }) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {children}
  </View>
);

const EditProductScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { updateProduct } = useVendorStore();
  const item = route.params?.item;

  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  // Pre-fill from existing item
  // images array may contain existing Cloudinary URLs + newly picked local URIs
  const [images, setImages] = useState(item?.images || (item?.image ? [item.image] : []));
  const [name, setName] = useState(item?.name || '');
  const [brand, setBrand] = useState(item?.brand || '');
  const [category, setCategory] = useState(item?.category || '');
  const [unit, setUnit] = useState(item?.unit || '');
  const [price, setPrice] = useState(item?.price != null ? String(item.price) : '');
  const [stock, setStock] = useState(item?.stock != null ? String(item.stock) : '');
  const [sku, setSku] = useState(item?.sku || '');
  const [description, setDescription] = useState(item?.description || '');
  const [minOrder, setMinOrder] = useState(item?.minOrder != null ? String(item.minOrder) : '');
  const [weight, setWeight] = useState(item?.weight || '');
  const [hsn, setHsn] = useState(item?.hsnCode || '');

  const isCloudinaryUrl = (uri) =>
    uri.startsWith('http://') || uri.startsWith('https://');

  const handlePickImages = async () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert('Limit Reached', `You can upload a maximum of ${MAX_IMAGES} images.`);
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - images.length,
      quality: 0.8,
    });
    if (!result.canceled) {
      const picked = result.assets.map((a) => a.uri);
      setImages((prev) => [...prev, ...picked].slice(0, MAX_IMAGES));
    }
  };

  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Missing Field', 'Please enter a product name.'); return; }
    if (!category)    { Alert.alert('Missing Field', 'Please select a category.');    return; }
    if (!price)       { Alert.alert('Missing Field', 'Please enter a price.');         return; }

    setLoading(true);
    try {
      // Split images into existing Cloudinary URLs vs new local URIs
      const existingUrls = images.filter(isCloudinaryUrl);
      const newLocalUris = images.filter((u) => !isCloudinaryUrl(u));

      let newUrls = [];
      if (newLocalUris.length > 0) {
        setUploadProgress('Uploading new images...');
        newUrls = await uploadImagesToCloudinary(
          newLocalUris,
          (done, total) => setUploadProgress(`Uploading image ${done} of ${total}...`)
        );
      }

      setUploadProgress('Saving changes...');

      await updateProduct(item.id, {
        title:       name,
        brand,
        category,
        unit,
        price:       parseFloat(price),
        stock:       parseInt(stock || '0'),
        sku,
        description,
        minOrder:    parseInt(minOrder || '1'),
        weight,
        hsnCode:     hsn,
        images:      [...existingUrls, ...newUrls],
      });

      Alert.alert('Product Updated', `${name} has been updated.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
      setUploadProgress('');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Product</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* Images */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Product Images</Text>
            <Text style={styles.sectionSub}>{images.length}/{MAX_IMAGES} uploaded</Text>
          </View>
          <View style={styles.imageGrid}>
            {images.map((uri, index) => (
              <View key={index} style={styles.imageThumbWrap}>
                <Image source={{ uri }} style={styles.imageThumb} resizeMode="cover" />
                {index === 0 && (
                  <View style={styles.primaryBadge}>
                    <Text style={styles.primaryBadgeText}>Main</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.removeImageBtn} onPress={() => handleRemoveImage(index)}>
                  <Text style={styles.removeImageIcon}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            {images.length < MAX_IMAGES && (
              <TouchableOpacity style={styles.addImageBtn} onPress={handlePickImages} activeOpacity={0.8}>
                <Text style={styles.addImageIcon}>📷</Text>
                <Text style={styles.addImageText}>Add Photo</Text>
                <Text style={styles.addImageSub}>{MAX_IMAGES - images.length} left</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <Field label="Product Name *">
            <TextInput style={styles.input} placeholder="e.g. Portland Cement 50kg"
              placeholderTextColor={colors.textMuted} value={name} onChangeText={setName} />
          </Field>
          <Field label="Brand / Manufacturer">
            <TextInput style={styles.input} placeholder="e.g. UltraTech, TATA Steel"
              placeholderTextColor={colors.textMuted} value={brand} onChangeText={setBrand} />
          </Field>
          <Field label="SKU / Product Code">
            <TextInput style={styles.input} placeholder="e.g. CEM-001"
              placeholderTextColor={colors.textMuted} value={sku} onChangeText={setSku}
              autoCapitalize="characters" />
          </Field>
          <Field label="Description">
            <TextInput style={[styles.input, styles.textArea]}
              placeholder="Describe the product, grade, specifications..."
              placeholderTextColor={colors.textMuted} value={description}
              onChangeText={setDescription} multiline numberOfLines={4} textAlignVertical="top" />
          </Field>
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category *</Text>
          <View style={styles.chipGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity key={cat}
                style={[styles.chip, category === cat && styles.chipActive]}
                onPress={() => setCategory(cat)} activeOpacity={0.8}>
                <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Pricing & Stock */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing & Stock</Text>
          <View style={styles.rowInputs}>
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>Unit Price (₹) *</Text>
              <TextInput style={styles.input} placeholder="0.00"
                placeholderTextColor={colors.textMuted} value={price}
                onChangeText={setPrice} keyboardType="numeric" />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>Stock Quantity *</Text>
              <TextInput style={styles.input} placeholder="0"
                placeholderTextColor={colors.textMuted} value={stock}
                onChangeText={setStock} keyboardType="numeric" />
            </View>
          </View>
          <Field label="Minimum Order Quantity">
            <TextInput style={styles.input} placeholder="e.g. 10"
              placeholderTextColor={colors.textMuted} value={minOrder}
              onChangeText={setMinOrder} keyboardType="numeric" />
          </Field>
        </View>

        {/* Unit */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Unit of Measurement *</Text>
          <View style={styles.chipGrid}>
            {UNITS.map((u) => (
              <TouchableOpacity key={u}
                style={[styles.chip, unit === u && styles.chipActive]}
                onPress={() => setUnit(u)} activeOpacity={0.8}>
                <Text style={[styles.chipText, unit === u && styles.chipTextActive]}>{u}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Additional Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Details</Text>
          <View style={styles.rowInputs}>
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>Weight per Unit</Text>
              <TextInput style={styles.input} placeholder="e.g. 50 kg"
                placeholderTextColor={colors.textMuted} value={weight} onChangeText={setWeight} />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>HSN Code</Text>
              <TextInput style={styles.input} placeholder="e.g. 2523"
                placeholderTextColor={colors.textMuted} value={hsn} onChangeText={setHsn}
                keyboardType="numeric" />
            </View>
          </View>
        </View>

        {loading && uploadProgress ? (
          <Text style={{ textAlign: 'center', color: colors.textMuted, marginBottom: 12, fontSize: 13 }}>
            {uploadProgress}
          </Text>
        ) : null}

        {/* Buttons */}
        <View style={styles.buttonsRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtnWrap} onPress={handleSave} activeOpacity={0.85} disabled={loading}>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.saveBtn}
            >
              {loading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator color={colors.white} />
                  {uploadProgress ? (
                    <Text style={[styles.saveBtnText, { fontSize: 13 }]}>{uploadProgress}</Text>
                  ) : null}
                </View>
              ) : (
                <Text style={styles.saveBtnText}>Save Changes</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 14, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  backIcon: { fontSize: 24, color: colors.textPrimary, fontWeight: '300', lineHeight: 28 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  scroll: { padding: 16, paddingBottom: 50 },
  section: { backgroundColor: colors.surface, borderRadius: 18, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: colors.border, elevation: 2, shadowColor: colors.cardShadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, marginBottom: 14 },
  sectionSub: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  imageThumbWrap: { width: 90, height: 90, borderRadius: 14, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: colors.border },
  imageThumb: { width: '100%', height: '100%' },
  primaryBadge: { position: 'absolute', bottom: 4, left: 4, backgroundColor: colors.accentAmber, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 },
  primaryBadgeText: { fontSize: 8, fontWeight: '800', color: colors.white },
  removeImageBtn: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  removeImageIcon: { fontSize: 9, color: colors.white, fontWeight: '800' },
  addImageBtn: { width: 90, height: 90, borderRadius: 14, borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceElevated, gap: 2 },
  addImageIcon: { fontSize: 22 },
  addImageText: { fontSize: 10, fontWeight: '700', color: colors.textSecondary },
  addImageSub: { fontSize: 9, color: colors.textMuted },
  field: { marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 6, letterSpacing: 0.2 },
  input: { backgroundColor: colors.surfaceElevated, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 13, color: colors.textPrimary, fontWeight: '500', borderWidth: 1, borderColor: colors.border },
  textArea: { minHeight: 90, paddingTop: 12 },
  rowInputs: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  halfField: { flex: 1 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.accentAmberSoft, borderColor: colors.accentAmber },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  chipTextActive: { color: colors.accentAmber, fontWeight: '800' },
  buttonsRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 15, borderRadius: 14, alignItems: 'center', backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border },
  cancelBtnText: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  saveBtnWrap: { flex: 2 },
  saveBtn: { paddingVertical: 15, borderRadius: 14, alignItems: 'center' },
  saveBtnText: { fontSize: 14, fontWeight: '800', color: colors.white },
});

export default EditProductScreen;
