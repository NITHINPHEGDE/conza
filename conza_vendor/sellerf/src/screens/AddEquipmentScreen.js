import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Image, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../theme/colors';

const CATEGORIES = [
    'Concrete Equipment', 'Scaffolding', 'Earthmoving',
    'Lifting Equipment', 'Compaction', 'Power Tools',
    'Lighting', 'Formwork', 'Safety Equipment', 'Other',
];

const CATEGORY_EMOJI = {
    'Concrete Equipment': '🏗️',
    'Scaffolding': '🪜',
    'Earthmoving': '🚜',
    'Lifting Equipment': '🏋️',
    'Compaction': '🔨',
    'Power Tools': '🔧',
    'Lighting': '💡',
    'Formwork': '🪵',
    'Safety Equipment': '🦺',
    'Other': '📦',
};

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

    const [images, setImages] = useState([]);
    const [name, setName] = useState('');
    const [brand, setBrand] = useState('');
    const [category, setCategory] = useState('');
    const [unit, setUnit] = useState('unit');
    const [pricePerDay, setPricePerDay] = useState('');
    const [deposit, setDeposit] = useState('');
    const [totalUnits, setTotalUnits] = useState('');
    const [sku, setSku] = useState('');
    const [description, setDescription] = useState('');
    const [minDays, setMinDays] = useState('');
    const [maxDays, setMaxDays] = useState('');
    const [weight, setWeight] = useState('');
    const [dimensions, setDimensions] = useState('');

    const handlePickImages = async () => {
        if (images.length >= MAX_IMAGES) {
            Alert.alert('Limit Reached', `Maximum ${MAX_IMAGES} images allowed.`);
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

    const handleAdd = () => {
        if (!name.trim()) { Alert.alert('Missing Field', 'Please enter equipment name.'); return; }
        if (!category) { Alert.alert('Missing Field', 'Please select a category.'); return; }
        if (!pricePerDay.trim()) { Alert.alert('Missing Field', 'Please enter price per day.'); return; }
        if (!totalUnits.trim()) { Alert.alert('Missing Field', 'Please enter total units.'); return; }
        Alert.alert('Success', 'Equipment added successfully! (Demo)', [
            { text: 'OK', onPress: () => navigation.goBack() },
        ]);
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
                <Text style={styles.headerTitle}>Add Equipment</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >

                {/* ── Images ── */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Equipment Images</Text>
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
                    {images.length === 0 && (
                        <Text style={styles.imageHint}>First image will be the main equipment photo</Text>
                    )}
                </View>

                {/* ── Basic Info ── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Basic Information</Text>

                    <Field label="Equipment Name *">
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Concrete Mixer 500L"
                            placeholderTextColor={colors.textMuted}
                            value={name}
                            onChangeText={setName}
                        />
                    </Field>

                    <Field label="Brand / Manufacturer">
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Ajax, Schwing"
                            placeholderTextColor={colors.textMuted}
                            value={brand}
                            onChangeText={setBrand}
                        />
                    </Field>

                    <Field label="SKU / Equipment Code">
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. MXR-001"
                            placeholderTextColor={colors.textMuted}
                            value={sku}
                            onChangeText={setSku}
                            autoCapitalize="characters"
                        />
                    </Field>

                    <Field label="Description">
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Describe the equipment, capacity, features..."
                            placeholderTextColor={colors.textMuted}
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </Field>
                </View>

                {/* ── Category ── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Category *</Text>
                    <View style={styles.chipGrid}>
                        {CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat}
                                style={[styles.chip, category === cat && styles.chipActive]}
                                onPress={() => setCategory(cat)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.chipEmoji}>{CATEGORY_EMOJI[cat]}</Text>
                                <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                                    {cat}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* ── Rental Pricing ── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Rental Pricing</Text>

                    <View style={styles.rowInputs}>
                        <View style={styles.halfField}>
                            <Text style={styles.fieldLabel}>Price per Day (₹) *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="0.00"
                                placeholderTextColor={colors.textMuted}
                                value={pricePerDay}
                                onChangeText={setPricePerDay}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={styles.halfField}>
                            <Text style={styles.fieldLabel}>Security Deposit (₹)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="0.00"
                                placeholderTextColor={colors.textMuted}
                                value={deposit}
                                onChangeText={setDeposit}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>

                    <View style={styles.rowInputs}>
                        <View style={styles.halfField}>
                            <Text style={styles.fieldLabel}>Min Rental Days</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="1"
                                placeholderTextColor={colors.textMuted}
                                value={minDays}
                                onChangeText={setMinDays}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={styles.halfField}>
                            <Text style={styles.fieldLabel}>Max Rental Days</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="30"
                                placeholderTextColor={colors.textMuted}
                                value={maxDays}
                                onChangeText={setMaxDays}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>
                </View>

                {/* ── Fleet ── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Fleet & Unit</Text>

                    <Field label="Total Units Available *">
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 3"
                            placeholderTextColor={colors.textMuted}
                            value={totalUnits}
                            onChangeText={setTotalUnits}
                            keyboardType="numeric"
                        />
                    </Field>

                    <Text style={[styles.fieldLabel, { marginBottom: 8 }]}>Unit Type</Text>
                    <View style={styles.unitRow}>
                        {UNITS.map((u) => (
                            <TouchableOpacity
                                key={u}
                                style={[styles.unitChip, unit === u && styles.unitChipActive]}
                                onPress={() => setUnit(u)}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.chipText, unit === u && styles.chipTextActive]}>{u}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* ── Specs ── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Specifications</Text>
                    <View style={styles.rowInputs}>
                        <View style={styles.halfField}>
                            <Text style={styles.fieldLabel}>Weight</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. 250 kg"
                                placeholderTextColor={colors.textMuted}
                                value={weight}
                                onChangeText={setWeight}
                            />
                        </View>
                        <View style={styles.halfField}>
                            <Text style={styles.fieldLabel}>Dimensions</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. 1.2m × 0.8m"
                                placeholderTextColor={colors.textMuted}
                                value={dimensions}
                                onChangeText={setDimensions}
                            />
                        </View>
                    </View>
                </View>

                {/* ── Buttons ── */}
                <View style={styles.buttonsRow}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.addBtnWrap} onPress={handleAdd} activeOpacity={0.85}>
                        <LinearGradient
                            colors={[colors.gradientStart, colors.gradientEnd]}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={styles.addBtn}
                        >
                            <Text style={styles.addBtnText}>+ Add Equipment</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },

    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingBottom: 14,
        backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
    backIcon: { fontSize: 24, color: colors.textPrimary, fontWeight: '300', lineHeight: 28 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },

    scroll: { padding: 16, paddingBottom: 50 },

    section: {
        backgroundColor: colors.surface, borderRadius: 18, padding: 16, marginBottom: 14,
        borderWidth: 1, borderColor: colors.border,
        elevation: 2, shadowColor: colors.cardShadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6,
    },
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
    imageHint: { fontSize: 11, color: colors.textMuted, marginTop: 10, textAlign: 'center' },

    field: { marginBottom: 12 },
    fieldLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 6, letterSpacing: 0.2 },
    input: {
        backgroundColor: colors.surfaceElevated, borderRadius: 12,
        paddingHorizontal: 14, paddingVertical: 12,
        fontSize: 13, color: colors.textPrimary, fontWeight: '500',
        borderWidth: 1, borderColor: colors.border,
    },
    textArea: { minHeight: 90, paddingTop: 12 },

    rowInputs: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    halfField: { flex: 1 },

    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border },
    chipActive: { backgroundColor: colors.accentAmberSoft, borderColor: colors.accentAmber },
    chipEmoji: { fontSize: 12 },
    chipText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
    chipTextActive: { color: colors.accentAmber, fontWeight: '800' },

    unitRow: { flexDirection: 'row', gap: 8 },
    unitChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border },
    unitChipActive: { backgroundColor: colors.accentAmberSoft, borderColor: colors.accentAmber },

    buttonsRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
    cancelBtn: { flex: 1, paddingVertical: 15, borderRadius: 14, alignItems: 'center', backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border },
    cancelBtnText: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
    addBtnWrap: { flex: 2 },
    addBtn: { paddingVertical: 15, borderRadius: 14, alignItems: 'center' },
    addBtnText: { fontSize: 14, fontWeight: '800', color: colors.white },
});

export default AddEquipmentScreen;