import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Image, Alert, KeyboardAvoidingView, Platform,
    ActivityIndicator, FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import useVendorStore from '../store/useVendorStore';
import { colors } from '../theme/colors';
import { uploadImagesToCloudinary } from '../utils/cloudinary';
import { categoryService } from '../services/categoryService';
import { catalogueService } from '../services/catalogueService';

const FALLBACK_CATEGORIES = [
    { id: 'concrete_equipment', name: 'Concrete Equipment', emoji: '&#128935;&#65039;' },
    { id: 'scaffolding',        name: 'Scaffolding',        emoji: '&#129692;' },
    { id: 'earthmoving',        name: 'Earthmoving',        emoji: '&#128668;' },
    { id: 'lifting_equipment',  name: 'Lifting Equipment',  emoji: '&#127947;' },
    { id: 'compaction',         name: 'Compaction',         emoji: '&#128296;' },
    { id: 'power_tools',        name: 'Power Tools',        emoji: '&#128295;' },
    { id: 'lighting',           name: 'Lighting',           emoji: '&#128161;' },
    { id: 'formwork',           name: 'Formwork',           emoji: '&#129397;' },
    { id: 'safety_equipment',   name: 'Safety Equipment',   emoji: '&#129398;' },
    { id: 'other',              name: 'Other',              emoji: '&#128230;' },
];

const UNITS = ['unit', 'set', 'pair', 'piece'];
const MAX_IMAGES = 5;

const Field = ({ label, children }) => (
    <View style={styles.field}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {children}
    </View>
);

const AddEquipmentScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { addProduct } = useVendorStore();

    // 'catalogue' | 'manual'
    const [tab, setTab] = useState('catalogue');

    const [loading,        setLoading]        = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');

    const [categories,  setCategories]  = useState(FALLBACK_CATEGORIES);
    const [catsLoading, setCatsLoading] = useState(true);

    useEffect(() => {
        categoryService.getRentalCategories()
            .then((c) => {
                if (c.length) setCategories(c.map((x) => ({ id: x.id, name: x.name, image: x.image || null, emoji: '&#128230;' })));
            })
            .catch(() => {})
            .finally(() => setCatsLoading(false));
    }, []);

    // Form state
    const [images,      setImages]      = useState([]);
    const [name,        setName]        = useState('');
    const [brand,       setBrand]       = useState('');
    const [category,    setCategory]    = useState('');
    const [unit,        setUnit]        = useState('unit');
    const [mrpPerDay,   setMrpPerDay]   = useState('');
    const [pricePerDay, setPricePerDay] = useState('');
    const [deposit,     setDeposit]     = useState('');
    const [totalUnits,  setTotalUnits]  = useState('');
    const [sku,         setSku]         = useState('');
    const [description, setDescription] = useState('');
    const [minDays,     setMinDays]     = useState('');
    const [weight,      setWeight]      = useState('');
    const [dimensions,  setDimensions]  = useState('');

    // Catalogue state
    const [catItems,   setCatItems]   = useState([]);
    const [catLoading, setCatLoading] = useState(false);
    const [catSearch,  setCatSearch]  = useState('');
    const [selected,   setSelected]   = useState(null);
    const searchTimer = useRef(null);

    const fetchCatalogue = (q = '') => {
        setCatLoading(true);
        catalogueService.getRentalCatalogue(q)
            .then(setCatItems)
            .catch(() => setCatItems([]))
            .finally(() => setCatLoading(false));
    };

    useEffect(() => { fetchCatalogue(); }, []);

    const onSearchChange = (t) => {
        setCatSearch(t);
        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => fetchCatalogue(t), 400);
    };

    const onSelectItem = (item) => {
        setSelected(item);
        setName(item.title || item.name || '');
        setBrand(item.brand || '');
        setCategory(item.category || '');
        setDescription(item.description || '');
        setUnit(item.unit || 'unit');
        setMrpPerDay(''); setPricePerDay(''); setDeposit('');
        setTotalUnits(''); setMinDays(''); setWeight('');
        setDimensions(''); setSku(''); setImages([]);
    };

    const onClearSelected = () => {
        setSelected(null);
        setName(''); setBrand(''); setCategory(''); setDescription(''); setUnit('unit');
    };

    const pickImages = async () => {
        if (images.length >= MAX_IMAGES) { Alert.alert('Limit Reached', `Max ${MAX_IMAGES} images.`); return; }
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission Denied', 'Allow photo library access.'); return; }
        const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            selectionLimit: MAX_IMAGES - images.length,
            quality: 0.8,
        });
        if (!res.canceled) setImages((p) => [...p, ...res.assets.map((a) => a.uri)].slice(0, MAX_IMAGES));
    };

    const removeImage = (i) => setImages((p) => p.filter((_, idx) => idx !== i));

    const handleAdd = async () => {
        if (!name.trim())        { Alert.alert('Missing', 'Enter equipment name.'); return; }
        if (!category)           { Alert.alert('Missing', 'Select a category.'); return; }
        if (!mrpPerDay.trim())   { Alert.alert('Missing', 'Enter M.R.P. per day.'); return; }
        if (!pricePerDay.trim()) { Alert.alert('Missing', 'Enter discount price per day.'); return; }
        if (parseFloat(mrpPerDay) < parseFloat(pricePerDay)) { Alert.alert('Invalid', 'M.R.P. cannot be less than discount price.'); return; }
        if (!totalUnits.trim())  { Alert.alert('Missing', 'Enter total units available.'); return; }

        setLoading(true);
        try {
            let imageUrls = [];
            if (images.length > 0) {
                setUploadProgress('Uploading images...');
                imageUrls = await uploadImagesToCloudinary(images, (d, t) => setUploadProgress(`Uploading ${d}/${t}...`));
            }
            setUploadProgress('Saving...');
            await addProduct({
                title: name, brand, category, unit,
                type: 'rental',
                price: parseFloat(pricePerDay), mrp: parseFloat(mrpPerDay),
                rentalPrice: parseFloat(pricePerDay),
                deposit: deposit ? parseFloat(deposit) : 0,
                minRentalDays: minDays ? parseInt(minDays) : 1,
                stock: parseInt(totalUnits),
                sku, description, weight, images: imageUrls,
            });
            navigation.navigate('InventoryList');
        } catch (err) {
            Alert.alert('Error', err.message);
        } finally {
            setLoading(false);
            setUploadProgress('');
        }
    };

    const discount = mrpPerDay && pricePerDay && parseFloat(mrpPerDay) > parseFloat(pricePerDay)
        ? Math.round(((parseFloat(mrpPerDay) - parseFloat(pricePerDay)) / parseFloat(mrpPerDay)) * 100)
        : null;

    return (
        <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backIcon}>&#8249;</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add Equipment</Text>
                <View style={{ width: 36 }} />
            </View>

            {/* Tabs */}
            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tab, tab === 'catalogue' && styles.tabActive]}
                    onPress={() => setTab('catalogue')}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.tabText, tab === 'catalogue' && styles.tabTextActive]}>From Catalogue</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, tab === 'manual' && styles.tabActive]}
                    onPress={() => setTab('manual')}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.tabText, tab === 'manual' && styles.tabTextActive]}>Add Manually</Text>
                </TouchableOpacity>
            </View>

            {/* ── CATALOGUE TAB: browse ── */}
            {tab === 'catalogue' && !selected && (
                <View style={{ flex: 1 }}>
                    <View style={styles.searchWrap}>
                        <Text style={styles.searchIcon}>&#128269;</Text>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search equipment..."
                            placeholderTextColor={colors.textMuted}
                            value={catSearch}
                            onChangeText={onSearchChange}
                        />
                        {catSearch.length > 0 && (
                            <TouchableOpacity onPress={() => { setCatSearch(''); fetchCatalogue(''); }}>
                                <Text style={styles.searchClear}>&#x2715;</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {catLoading ? (
                        <View style={styles.centered}>
                            <ActivityIndicator size="large" color={colors.accentAmber} />
                        </View>
                    ) : catItems.length === 0 ? (
                        <View style={styles.centered}>
                            <Text style={styles.emptyEmoji}>&#128230;</Text>
                            <Text style={styles.emptyText}>No equipment found</Text>
                            <Text style={styles.emptySub}>Try a different search</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={catItems}
                            keyExtractor={(item) => item._id || item.id || String(Math.random())}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.catRow} onPress={() => onSelectItem(item)} activeOpacity={0.75}>
                                    {item.images?.[0]
                                        ? <Image source={{ uri: item.images[0] }} style={styles.catRowImg} />
                                        : <View style={[styles.catRowImg, styles.catRowImgFallback]}><Text style={{ fontSize: 20 }}>&#128230;</Text></View>
                                    }
                                    <View style={styles.catRowInfo}>
                                        <Text style={styles.catRowName} numberOfLines={1}>{item.title || item.name}</Text>
                                        {item.brand ? <Text style={styles.catRowBrand}>{item.brand}</Text> : null}
                                        <View style={styles.catRowTags}>
                                            {item.category ? <View style={styles.tag}><Text style={styles.tagText}>{item.category}</Text></View> : null}
                                            {item.unit    ? <View style={styles.tag}><Text style={styles.tagText}>/{item.unit}</Text></View> : null}
                                        </View>
                                    </View>
                                    <Text style={styles.catRowArrow}>&#8250;</Text>
                                </TouchableOpacity>
                            )}
                        />
                    )}
                </View>
            )}

            {/* ── CATALOGUE TAB: item selected → pricing form ── */}
            {tab === 'catalogue' && selected && (
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    {/* Selected banner */}
                    <View style={styles.selectedBanner}>
                        {selected.images?.[0]
                            ? <Image source={{ uri: selected.images[0] }} style={styles.selectedImg} />
                            : <View style={[styles.selectedImg, styles.catRowImgFallback]}><Text style={{ fontSize: 20 }}>&#128230;</Text></View>
                        }
                        <View style={{ flex: 1 }}>
                            <Text style={styles.selectedLabel}>From Catalogue</Text>
                            <Text style={styles.selectedName} numberOfLines={1}>{selected.title || selected.name}</Text>
                            {selected.brand ? <Text style={styles.selectedBrand}>{selected.brand}</Text> : null}
                        </View>
                        <TouchableOpacity onPress={onClearSelected} style={styles.changeBtn}>
                            <Text style={styles.changeBtnText}>Change</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Rental Pricing */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Rental Pricing</Text>
                        <View style={styles.row}>
                            <View style={styles.half}>
                                <Text style={styles.fieldLabel}>M.R.P. / Day (&#8377;) *</Text>
                                <TextInput style={styles.input} placeholder="0" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={mrpPerDay} onChangeText={setMrpPerDay} />
                            </View>
                            <View style={styles.half}>
                                <Text style={styles.fieldLabel}>Discount / Day (&#8377;) *</Text>
                                <TextInput style={styles.input} placeholder="0" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={pricePerDay} onChangeText={setPricePerDay} />
                            </View>
                        </View>
                        {discount ? <Text style={styles.discountHint}>{discount}% OFF shown to customers</Text> : null}
                        <View style={styles.row}>
                            <View style={styles.half}>
                                <Text style={styles.fieldLabel}>Security Deposit (&#8377;)</Text>
                                <TextInput style={styles.input} placeholder="0" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={deposit} onChangeText={setDeposit} />
                            </View>
                            <View style={styles.half}>
                                <Text style={styles.fieldLabel}>Min. Rental Days</Text>
                                <TextInput style={styles.input} placeholder="1" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={minDays} onChangeText={setMinDays} />
                            </View>
                        </View>
                    </View>

                    {/* Stock & Availability */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Stock &amp; Availability</Text>
                        <Field label="Total Units Available *">
                            <TextInput style={styles.input} placeholder="e.g. 3" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={totalUnits} onChangeText={setTotalUnits} />
                        </Field>
                        <Field label="Unit Type">
                            <View style={styles.unitRow}>
                                {UNITS.map((u) => (
                                    <TouchableOpacity key={u} style={[styles.unitChip, unit === u && styles.unitChipActive]} onPress={() => setUnit(u)}>
                                        <Text style={[styles.unitChipText, unit === u && styles.unitChipTextActive]}>{u}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </Field>
                    </View>

                    {/* Additional Details */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Additional Details</Text>
                        <Field label="SKU / Model Number">
                            <TextInput style={styles.input} placeholder="e.g. CM-500-2024" placeholderTextColor={colors.textMuted} value={sku} onChangeText={setSku} />
                        </Field>
                        <View style={styles.row}>
                            <View style={styles.half}>
                                <Text style={styles.fieldLabel}>Weight</Text>
                                <TextInput style={styles.input} placeholder="e.g. 250 kg" placeholderTextColor={colors.textMuted} value={weight} onChangeText={setWeight} />
                            </View>
                            <View style={styles.half}>
                                <Text style={styles.fieldLabel}>Dimensions</Text>
                                <TextInput style={styles.input} placeholder="e.g. 1.2m x 0.8m" placeholderTextColor={colors.textMuted} value={dimensions} onChangeText={setDimensions} />
                            </View>
                        </View>
                    </View>

                    {/* Photos */}
                    <View style={styles.section}>
                        <View style={styles.sectionRow}>
                            <Text style={styles.sectionTitle}>Photos</Text>
                            <Text style={styles.sectionCount}>{images.length}/{MAX_IMAGES}</Text>
                        </View>
                        <View style={styles.imageGrid}>
                            {images.map((uri, i) => (
                                <View key={i} style={styles.thumb}>
                                    <Image source={{ uri }} style={styles.thumbImg} resizeMode="cover" />
                                    {i === 0 && <View style={styles.mainBadge}><Text style={styles.mainBadgeText}>Main</Text></View>}
                                    <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(i)}>
                                        <Text style={styles.removeBtnText}>&#x2715;</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                            {images.length < MAX_IMAGES && (
                                <TouchableOpacity style={styles.addImgBtn} onPress={pickImages} activeOpacity={0.8}>
                                    <Text style={styles.addImgIcon}>&#128247;</Text>
                                    <Text style={styles.addImgText}>Add</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        {images.length === 0 && <Text style={styles.imgHint}>First photo will be the main image</Text>}
                    </View>

                    {/* Submit */}
                    <TouchableOpacity style={styles.submitWrap} onPress={handleAdd} activeOpacity={0.85} disabled={loading}>
                        <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitBtn}>
                            {loading
                                ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <ActivityIndicator color={colors.white} size="small" />
                                    {uploadProgress ? <Text style={styles.submitText}>{uploadProgress}</Text> : null}
                                  </View>
                                : <Text style={styles.submitText}>Add Equipment</Text>
                            }
                        </LinearGradient>
                    </TouchableOpacity>
                </ScrollView>
            )}

            {/* ── MANUAL TAB ── */}
            {tab === 'manual' && (
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                    {/* Basic Info */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Basic Information</Text>
                        <Field label="Equipment Name *">
                            <TextInput style={styles.input} placeholder="e.g. Concrete Mixer 500L" placeholderTextColor={colors.textMuted} value={name} onChangeText={setName} />
                        </Field>
                        <Field label="Brand / Manufacturer">
                            <TextInput style={styles.input} placeholder="e.g. Schwing Stetter" placeholderTextColor={colors.textMuted} value={brand} onChangeText={setBrand} />
                        </Field>
                        <Field label="SKU / Model Number">
                            <TextInput style={styles.input} placeholder="e.g. CM-500-2024" placeholderTextColor={colors.textMuted} value={sku} onChangeText={setSku} />
                        </Field>
                        <Field label="Description">
                            <TextInput style={[styles.input, styles.textArea]} placeholder="Describe equipment, condition, features..." placeholderTextColor={colors.textMuted} value={description} onChangeText={setDescription} multiline numberOfLines={3} textAlignVertical="top" />
                        </Field>
                    </View>

                    {/* Category */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Category *</Text>
                        {catsLoading
                            ? <ActivityIndicator size="small" color={colors.accentAmber} style={{ marginVertical: 10 }} />
                            : <View style={styles.chipGrid}>
                                {categories.map((cat) => (
                                    <TouchableOpacity key={cat.id} style={[styles.chip, category === cat.name && styles.chipActive]} onPress={() => setCategory(cat.name)} activeOpacity={0.8}>
                                        {cat.image
                                            ? <Image source={{ uri: cat.image }} style={styles.chipImg} />
                                            : <Text style={{ fontSize: 12 }}>{cat.emoji}</Text>
                                        }
                                        <Text style={[styles.chipText, category === cat.name && styles.chipTextActive]} numberOfLines={1}>{cat.name}</Text>
                                    </TouchableOpacity>
                                ))}
                              </View>
                        }
                    </View>

                    {/* Unit */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Unit Type</Text>
                        <View style={styles.unitRow}>
                            {UNITS.map((u) => (
                                <TouchableOpacity key={u} style={[styles.unitChip, unit === u && styles.unitChipActive]} onPress={() => setUnit(u)} activeOpacity={0.8}>
                                    <Text style={[styles.unitChipText, unit === u && styles.unitChipTextActive]}>{u}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Rental Pricing */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Rental Pricing</Text>
                        <View style={styles.row}>
                            <View style={styles.half}>
                                <Text style={styles.fieldLabel}>M.R.P. / Day (&#8377;) *</Text>
                                <TextInput style={styles.input} placeholder="0" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={mrpPerDay} onChangeText={setMrpPerDay} />
                            </View>
                            <View style={styles.half}>
                                <Text style={styles.fieldLabel}>Discount / Day (&#8377;) *</Text>
                                <TextInput style={styles.input} placeholder="0" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={pricePerDay} onChangeText={setPricePerDay} />
                            </View>
                        </View>
                        {discount ? <Text style={styles.discountHint}>{discount}% OFF shown to customers</Text> : null}
                        <View style={styles.row}>
                            <View style={styles.half}>
                                <Text style={styles.fieldLabel}>Security Deposit (&#8377;)</Text>
                                <TextInput style={styles.input} placeholder="0" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={deposit} onChangeText={setDeposit} />
                            </View>
                            <View style={styles.half}>
                                <Text style={styles.fieldLabel}>Min. Rental Days</Text>
                                <TextInput style={styles.input} placeholder="1" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={minDays} onChangeText={setMinDays} />
                            </View>
                        </View>
                    </View>

                    {/* Stock */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Stock &amp; Availability</Text>
                        <Field label="Total Units Available *">
                            <TextInput style={styles.input} placeholder="e.g. 3" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={totalUnits} onChangeText={setTotalUnits} />
                        </Field>
                    </View>

                    {/* Additional */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Additional Details</Text>
                        <View style={styles.row}>
                            <View style={styles.half}>
                                <Text style={styles.fieldLabel}>Weight</Text>
                                <TextInput style={styles.input} placeholder="e.g. 250 kg" placeholderTextColor={colors.textMuted} value={weight} onChangeText={setWeight} />
                            </View>
                            <View style={styles.half}>
                                <Text style={styles.fieldLabel}>Dimensions</Text>
                                <TextInput style={styles.input} placeholder="e.g. 1.2m x 0.8m" placeholderTextColor={colors.textMuted} value={dimensions} onChangeText={setDimensions} />
                            </View>
                        </View>
                    </View>

                    {/* Photos */}
                    <View style={styles.section}>
                        <View style={styles.sectionRow}>
                            <Text style={styles.sectionTitle}>Photos</Text>
                            <Text style={styles.sectionCount}>{images.length}/{MAX_IMAGES}</Text>
                        </View>
                        <View style={styles.imageGrid}>
                            {images.map((uri, i) => (
                                <View key={i} style={styles.thumb}>
                                    <Image source={{ uri }} style={styles.thumbImg} resizeMode="cover" />
                                    {i === 0 && <View style={styles.mainBadge}><Text style={styles.mainBadgeText}>Main</Text></View>}
                                    <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(i)}>
                                        <Text style={styles.removeBtnText}>&#x2715;</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                            {images.length < MAX_IMAGES && (
                                <TouchableOpacity style={styles.addImgBtn} onPress={pickImages} activeOpacity={0.8}>
                                    <Text style={styles.addImgIcon}>&#128247;</Text>
                                    <Text style={styles.addImgText}>Add</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        {images.length === 0 && <Text style={styles.imgHint}>First photo will be the main image</Text>}
                    </View>

                    {/* Submit */}
                    <TouchableOpacity style={styles.submitWrap} onPress={handleAdd} activeOpacity={0.85} disabled={loading}>
                        <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitBtn}>
                            {loading
                                ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <ActivityIndicator color={colors.white} size="small" />
                                    {uploadProgress ? <Text style={styles.submitText}>{uploadProgress}</Text> : null}
                                  </View>
                                : <Text style={styles.submitText}>Add Equipment</Text>
                            }
                        </LinearGradient>
                    </TouchableOpacity>
                </ScrollView>
            )}
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },

    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingBottom: 12,
        backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    backBtn:     { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
    backIcon:    { fontSize: 24, color: colors.textPrimary, fontWeight: '300', lineHeight: 28 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },

    tabBar: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderBottomWidth: 1, borderBottomColor: colors.border,
        paddingHorizontal: 16, paddingTop: 4,
    },
    tab:           { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabActive:     { borderBottomColor: colors.accentAmber },
    tabText:       { fontSize: 13, fontWeight: '600', color: colors.textMuted },
    tabTextActive: { color: colors.accentAmber, fontWeight: '800' },

    searchWrap: {
        flexDirection: 'row', alignItems: 'center',
        marginHorizontal: 16, marginVertical: 12,
        backgroundColor: colors.surface, borderRadius: 12,
        paddingHorizontal: 12, paddingVertical: 10,
        borderWidth: 1, borderColor: colors.border, gap: 8,
    },
    searchIcon:  { fontSize: 14, color: colors.textMuted },
    searchInput: { flex: 1, fontSize: 13, color: colors.textPrimary, fontWeight: '500' },
    searchClear: { fontSize: 13, color: colors.textMuted, paddingHorizontal: 4 },

    listContent: { paddingHorizontal: 16, paddingBottom: 40 },

    catRow:            { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 14, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: colors.border, gap: 10 },
    catRowImg:         { width: 52, height: 52, borderRadius: 10 },
    catRowImgFallback: { backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
    catRowInfo:        { flex: 1 },
    catRowName:        { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
    catRowBrand:       { fontSize: 11, color: colors.textMuted, marginBottom: 4 },
    catRowTags:        { flexDirection: 'row', gap: 5 },
    tag:               { backgroundColor: colors.surfaceElevated, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: colors.border },
    tagText:           { fontSize: 10, color: colors.textMuted, fontWeight: '500' },
    catRowArrow:       { fontSize: 20, color: colors.textMuted },

    centered:   { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
    emptyEmoji: { fontSize: 36 },
    emptyText:  { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
    emptySub:   { fontSize: 12, color: colors.textMuted },

    scroll: { padding: 16, paddingBottom: 50 },

    selectedBanner: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.surface, borderRadius: 14, padding: 12, marginBottom: 14,
        borderWidth: 1.5, borderColor: colors.accentAmber, gap: 10,
    },
    selectedImg:   { width: 48, height: 48, borderRadius: 10 },
    selectedLabel: { fontSize: 9, fontWeight: '700', color: colors.accentAmber, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 2 },
    selectedName:  { fontSize: 13, fontWeight: '800', color: colors.textPrimary },
    selectedBrand: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
    changeBtn:     { backgroundColor: colors.surfaceElevated, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: colors.border },
    changeBtnText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },

    section:      { backgroundColor: colors.surface, borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
    sectionRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 13, fontWeight: '800', color: colors.textPrimary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.4 },
    sectionCount: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },

    field:      { marginBottom: 10 },
    fieldLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, marginBottom: 5, letterSpacing: 0.2 },
    input: {
        backgroundColor: colors.surfaceElevated, borderRadius: 10,
        paddingHorizontal: 12, paddingVertical: 11,
        fontSize: 13, color: colors.textPrimary, fontWeight: '500',
        borderWidth: 1, borderColor: colors.border,
    },
    textArea: { minHeight: 80, paddingTop: 10, textAlignVertical: 'top' },

    row:  { flexDirection: 'row', gap: 10, marginBottom: 10 },
    half: { flex: 1 },

    discountHint: { fontSize: 11, fontWeight: '700', color: colors.success, marginBottom: 10, marginTop: -4 },

    chipGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
    chip:          { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border },
    chipActive:    { backgroundColor: colors.accentAmberSoft, borderColor: colors.accentAmber },
    chipImg:       { width: 16, height: 16, borderRadius: 8 },
    chipText:      { fontSize: 12, fontWeight: '600', color: colors.textMuted },
    chipTextActive:{ color: colors.accentAmber, fontWeight: '800' },

    unitRow:           { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
    unitChip:          { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border },
    unitChipActive:    { backgroundColor: colors.accentAmberSoft, borderColor: colors.accentAmber },
    unitChipText:      { fontSize: 12, fontWeight: '600', color: colors.textMuted },
    unitChipTextActive:{ color: colors.accentAmber, fontWeight: '800' },

    imageGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    thumb:          { width: 80, height: 80, borderRadius: 12, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: colors.border },
    thumbImg:       { width: '100%', height: '100%' },
    mainBadge:      { position: 'absolute', bottom: 3, left: 3, backgroundColor: colors.accentAmber, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
    mainBadgeText:  { fontSize: 7, fontWeight: '800', color: colors.white },
    removeBtn:      { position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
    removeBtnText:  { fontSize: 8, color: colors.white, fontWeight: '800' },
    addImgBtn:      { width: 80, height: 80, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceElevated, gap: 3 },
    addImgIcon:     { fontSize: 20 },
    addImgText:     { fontSize: 10, fontWeight: '600', color: colors.textMuted },
    imgHint:        { fontSize: 11, color: colors.textMuted, marginTop: 8, textAlign: 'center' },

    submitWrap: { marginTop: 4 },
    submitBtn:  { paddingVertical: 15, borderRadius: 14, alignItems: 'center' },
    submitText: { fontSize: 15, fontWeight: '800', color: colors.white },
});

export default AddEquipmentScreen;