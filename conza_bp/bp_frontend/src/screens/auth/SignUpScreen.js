// src/screens/auth/SignUpScreen.js
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, ScrollView, ActivityIndicator, KeyboardAvoidingView,
  Platform, Image, Alert,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { signUp } from '../../services/authService';
import usePartnerStore from '../../store/usePartnerStore';
import { updateProfileImageAPI, getCategoriesAPI } from '../../services/workerService';
import { uploadImageToCloudinary } from '../../utils/cloudinary';
import { colors } from '../../theme/colors';

const GRAD_START = { x: 0, y: 0 };
const GRAD_END   = { x: 1, y: 0 };

// ── Field component ───────────────────────────────────────────────────────────
const Field = React.memo(({
  label, value, onChangeText, placeholder, secureTextEntry,
  keyboardType, multiline, numberOfLines, rightElement,
  error, optional,
}) => (
  <View style={fStyles.wrap}>
    <View style={fStyles.labelRow}>
      <Text style={fStyles.label}>{label}</Text>
      {optional && <Text style={fStyles.optional}>(optional)</Text>}
    </View>
    <View style={[
      fStyles.inputRow,
      multiline && fStyles.inputMulti,
      error && fStyles.inputError,
    ]}>
      <TextInput
        style={[fStyles.input, multiline && fStyles.inputTextMulti]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType || 'default'}
        autoCapitalize={label === 'Full Name' ? 'words' : 'none'}
        autoCorrect={false}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
      {rightElement}
    </View>
    {error ? <Text style={fStyles.errorText}>{error}</Text> : null}
  </View>
));

const fStyles = StyleSheet.create({
  wrap:           { marginBottom: 20 },
  labelRow:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  label:          { fontSize: 13, fontWeight: '700', color: colors.textPrimary, letterSpacing: 0.2 },
  optional:       { fontSize: 11, color: colors.textMuted, fontWeight: '500' },
  inputRow:       { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBg, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 16 },
  inputMulti:     { alignItems: 'flex-start', paddingVertical: 12 },
  input:          { flex: 1, height: 52, fontSize: 15, color: colors.textPrimary, fontWeight: '500' },
  inputTextMulti: { height: 90, lineHeight: 22 },
  inputError:     { borderColor: colors.danger },
  errorText:      { fontSize: 12, color: colors.danger, marginTop: 6, fontWeight: '500' },
});

// ── Section header ────────────────────────────────────────────────────────────
const SectionHeader = React.memo(({ title, subtitle }) => (
  <View style={secStyles.wrap}>
    <Text style={secStyles.title}>{title}</Text>
    {subtitle && <Text style={secStyles.sub}>{subtitle}</Text>}
  </View>
));

const secStyles = StyleSheet.create({
  wrap:  { marginTop: 8, marginBottom: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginBottom: 4 },
  sub:   { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
const SignUpScreen = ({ navigation }) => {
  const insets  = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const setWorker       = usePartnerStore((s) => s.setWorker);
  const syncOnlineState = usePartnerStore((s) => s.syncOnlineState);

  const [form, setForm] = useState({
    fullName: '', username: '', password: '', confirmPassword: '',
    phone: '', category: '', skills: [],
    location: '', experience: '', bio: '', availability: true,
    email: '', profileImage: null,
  });

  const [errors, setErrors]         = useState({});
  const [loading, setLoading]       = useState(false);
  const [showPass, setShowPass]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [skillInput, setSkillInput]   = useState('');
  const [imgUploading, setImgUploading] = useState(false);

  const [categories, setCategories]         = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // The category the partner picked, including its admin-set pricing —
  // shown read-only so the partner knows their rate before submitting.
  const selectedCategory = categories.find((c) => c.name === form.category) || null;

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await getCategoriesAPI();
        if (isMounted) setCategories(res.categories || []);
      } catch (err) {
        console.error('[SignUp] Failed to load categories:', err);
      } finally {
        if (isMounted) setCategoriesLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const set = useCallback((key) => (val) =>
    setForm((prev) => ({ ...prev, [key]: val })),
  []);

  // ── Image picker ────────────────────────────────────────────────────────────
  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to upload a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],

      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImgUploading(true);
      try {
        // Upload image directly to Cloudinary using signed signature
        const url = await uploadImageToCloudinary(result.assets[0].uri);
        setForm((prev) => ({ ...prev, profileImage: url }));
      } catch (err) {
        console.error('[SignUp] Image pick/upload error:', err);
        Alert.alert('Upload failed', err.message || 'Could not upload image. Please try again.');
      } finally {
        setImgUploading(false);
      }
    }
  }, []);

  // ── Skills ──────────────────────────────────────────────────────────────────
  const addSkill = useCallback(() => {
    const s = skillInput.trim();
    if (!s) return;
    if (form.skills.length >= 5) {
      Alert.alert('Limit reached', 'You can add up to 5 skills.');
      return;
    }
    if (form.skills.includes(s)) {
      Alert.alert('Duplicate', 'This skill is already added.');
      return;
    }
    setForm((prev) => ({ ...prev, skills: [...prev.skills, s] }));
    setSkillInput('');
  }, [skillInput, form.skills]);

  const removeSkill = useCallback((skill) => {
    setForm((prev) => ({ ...prev, skills: prev.skills.filter((s) => s !== skill) }));
  }, []);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = useCallback(() => {
    const e = {};
    if (!form.fullName.trim())  e.fullName  = 'Full name is required.';
    if (!form.username.trim())  e.username  = 'Username is required.';
    else if (form.username.length < 3) e.username = 'Username must be at least 3 characters.';
    else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) e.username = 'Only letters, numbers, and underscores.';

    if (!form.password)         e.password  = 'Password is required.';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters.';

    if (!form.confirmPassword)  e.confirmPassword = 'Please confirm your password.';
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match.';

    if (!form.phone.trim())     e.phone     = 'Phone number is required.';
    else if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Enter a valid 10-digit Indian mobile number.';

    if (!form.category)         e.category  = 'Please select a category.';
    if (!form.location.trim())  e.location  = 'Location is required.';

    if (form.experience && isNaN(Number(form.experience)))
      e.experience = 'Enter a valid number.';

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Enter a valid email address.';

    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form]);

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!validate()) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    setLoading(true);
    try {
      const worker = await signUp({
        fullName:    form.fullName.trim(),
        username:    form.username.trim(),
        password:    form.password,
        phone:       form.phone.trim(),
        category:    form.category,
        skills:      form.skills,
        locationText: form.location.trim(),
        experience:  form.experience ? Number(form.experience) : null,
        bio:         form.bio.trim(),
        availability:form.availability,
        email:       form.email.trim() || null,
        profileImage:form.profileImage,
        rating:      5.0,
        totalJobs:   0,
        memberSince: new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
      });
      setWorker(worker);
      syncOnlineState(false);
      navigation.replace('MainApp');
    } catch (err) {
      const msg = err.message;
      if (msg.toLowerCase().includes('phone'))    setErrors({ phone: msg });
      else if (msg.toLowerCase().includes('username')) setErrors({ username: msg });
      else if (msg.toLowerCase().includes('email'))    setErrors({ email: msg });
      else Alert.alert('Sign Up Failed', msg);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } finally {
      setLoading(false);
    }
  }, [form, validate, navigation]);

  const toggleAvailability = useCallback(
    () => setForm((prev) => ({ ...prev, availability: !prev.availability })),
    [],
  );
  const togglePass    = useCallback(() => setShowPass((p) => !p),    []);
  const toggleConfirm = useCallback(() => setShowConfirm((p) => !p), []);
  const goBack        = useCallback(() => navigation.goBack(),        [navigation]);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Account</Text>
          <View style={styles.spacer} />
        </View>

        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Profile Photo ────────────────────────────────────────── */}
          <SectionHeader title="Profile Photo" subtitle="Add a photo so customers can recognise you" />
          <View style={styles.photoSection}>
            <TouchableOpacity onPress={pickImage} activeOpacity={0.85} style={styles.photoBtn}>
              {imgUploading ? (
                <View style={styles.photoPlaceholder}>
                  <ActivityIndicator color={colors.accentAmber} />
                  <Text style={styles.photoHint}>Uploading...</Text>
                </View>
              ) : form.profileImage ? (
                <Image source={{ uri: form.profileImage }} style={styles.photoImage} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoIcon}>📷</Text>
                  <Text style={styles.photoHint}>Tap to upload</Text>
                </View>
              )}
            </TouchableOpacity>
            {form.profileImage && (
              <TouchableOpacity onPress={pickImage} style={styles.changePhotoBtn}>
                <Text style={styles.changePhotoText}>Change Photo</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ── Account Info ─────────────────────────────────────────── */}
          <SectionHeader title="Account Info" />
          <Field label="Full Name"  value={form.fullName}  onChangeText={set('fullName')}  placeholder="e.g. Ravi Kumar"       error={errors.fullName} />
          <Field label="Username"   value={form.username}  onChangeText={set('username')}  placeholder="e.g. ravi_kumar"       error={errors.username} />
          <Field
            label="Password" value={form.password} onChangeText={set('password')}
            placeholder="Min 6 characters" secureTextEntry={!showPass} error={errors.password}
            rightElement={
              <TouchableOpacity onPress={togglePass} style={styles.eyeBtn}>
                <Text style={styles.eyeText}>{showPass ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            }
          />
          <Field
            label="Confirm Password" value={form.confirmPassword} onChangeText={set('confirmPassword')}
            placeholder="Re-enter password" secureTextEntry={!showConfirm} error={errors.confirmPassword}
            rightElement={
              <TouchableOpacity onPress={toggleConfirm} style={styles.eyeBtn}>
                <Text style={styles.eyeText}>{showConfirm ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            }
          />

          {/* ── Contact ──────────────────────────────────────────────── */}
          <SectionHeader title="Contact Details" />
          <Field label="Phone Number" value={form.phone} onChangeText={set('phone')} placeholder="10-digit mobile number" keyboardType="phone-pad" error={errors.phone} />
          <Field label="Email ID" value={form.email} onChangeText={set('email')} placeholder="your@email.com" keyboardType="email-address" error={errors.email} optional />

          {/* ── Professional ─────────────────────────────────────────── */}
          <SectionHeader title="Professional Info" subtitle="This helps customers find the right person" />

          {/* Category */}
          <View style={fStyles.wrap}>
            <Text style={fStyles.label}>Category</Text>
            {categoriesLoading ? (
              <ActivityIndicator color={colors.accentAmber} style={{ marginTop: 8 }} />
            ) : (
              <View style={styles.categoryGrid}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setForm((prev) => ({ ...prev, category: cat.name }))}
                    style={[styles.catChip, form.category === cat.name && styles.catChipActive]}
                    activeOpacity={0.8}
                  >
                    {cat.image ? (
                      <Image source={{ uri: cat.image }} style={styles.catChipImage} />
                    ) : null}
                    <Text style={[styles.catChipText, form.category === cat.name && styles.catChipTextActive]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {!categoriesLoading && categories.length === 0 && (
              <Text style={fStyles.errorText}>No categories available yet. Please check back later.</Text>
            )}
            {errors.category && <Text style={fStyles.errorText}>{errors.category}</Text>}
          </View>

          {/* Admin-set pricing preview — read-only, cannot be edited here */}
          {!!selectedCategory && (
            <View style={styles.priceInfoBox}>
              <Text style={styles.priceInfoTitle}>Pricing for {selectedCategory.name}</Text>
              <Text style={styles.priceInfoSub}>
                Set by Conza admin. All partners in this category are charged the same rate.
              </Text>
              <View style={styles.priceInfoRow}>
                <View style={styles.priceInfoItem}>
                  <Text style={styles.priceInfoLabel}>Per Hour</Text>
                  <Text style={styles.priceInfoValue}>₹{selectedCategory.perHourCharge || 0}</Text>
                </View>
                <View style={styles.priceInfoItem}>
                  <Text style={styles.priceInfoLabel}>Per Day</Text>
                  <Text style={styles.priceInfoValue}>₹{selectedCategory.perDayCharge || 0}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Skills */}
          <View style={fStyles.wrap}>
            <View style={fStyles.labelRow}>
              <Text style={fStyles.label}>Skills</Text>
              <Text style={fStyles.optional}>(up to 5)</Text>
            </View>
            <View style={[fStyles.inputRow, { marginBottom: 10 }]}>
              <TextInput
                style={fStyles.input}
                value={skillInput}
                onChangeText={setSkillInput}
                placeholder="e.g. Pipe fitting, Leak repair"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
                onSubmitEditing={addSkill}
                returnKeyType="done"
              />
              <TouchableOpacity
                onPress={addSkill}
                style={[styles.addSkillBtn, form.skills.length >= 5 && styles.addSkillBtnDisabled]}
                disabled={form.skills.length >= 5}
              >
                <Text style={styles.addSkillBtnText}>+ Add</Text>
              </TouchableOpacity>
            </View>
            {form.skills.length > 0 && (
              <View style={styles.skillsWrap}>
                {form.skills.map((skill) => (
                  <View key={skill} style={styles.skillTag}>
                    <Text style={styles.skillTagText}>{skill}</Text>
                    <TouchableOpacity onPress={() => removeSkill(skill)} style={styles.skillRemove}>
                      <Text style={styles.skillRemoveText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            <Text style={styles.skillsCount}>{form.skills.length}/5 skills added</Text>
          </View>

          <Field label="Location / Address" value={form.location} onChangeText={set('location')} placeholder="e.g. Whitefield, Bangalore" error={errors.location} />
          <Field label="Experience (in years)" value={form.experience} onChangeText={set('experience')} placeholder="e.g. 5" keyboardType="numeric" error={errors.experience} optional />
          <Field label="Bio / Description" value={form.bio} onChangeText={set('bio')} placeholder="Tell customers about your work and expertise..." multiline numberOfLines={4} optional />

          {/* Availability */}
          <View style={styles.availRow}>
            <View>
              <Text style={styles.availLabel}>Availability Status</Text>
              <Text style={styles.availSub}>
                {form.availability ? 'You will receive new job requests' : 'You won\'t receive new requests'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={toggleAvailability}
              style={[styles.toggle, form.availability && styles.toggleOn]}
              activeOpacity={0.8}
            >
              <View style={[styles.toggleThumb, form.availability && styles.toggleThumbOn]} />
            </TouchableOpacity>
          </View>

          {/* Submit */}
          <TouchableOpacity
            onPress={handleSubmit}
            activeOpacity={0.88}
            disabled={loading || imgUploading}
            style={styles.submitWrap}
          >
            <LinearGradient
              colors={
                loading || imgUploading
                  ? [colors.surfaceElevated, colors.border]
                  : [colors.gradientStart, colors.gradientEnd]
              }
              start={GRAD_START} end={GRAD_END}
              style={styles.submitBtn}
            >
              {loading
                ? <ActivityIndicator color={colors.textPrimary} />
                : <Text style={styles.submitBtnText}>Create Account →</Text>
              }
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={goBack}>
              <Text style={styles.loginAccent}>Log In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex:           { flex: 1, backgroundColor: colors.background },
  screen:         { flex: 1, backgroundColor: colors.background },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface },
  backBtn:        { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon:       { fontSize: 28, color: colors.textPrimary, fontWeight: '300', lineHeight: 32 },
  headerTitle:    { fontSize: 17, fontWeight: '800', color: colors.textPrimary },
  spacer:         { width: 40 },
  content:        { padding: 24, paddingBottom: 60 },
  photoSection:   { alignItems: 'center', marginBottom: 24 },
  photoBtn:       { width: 110, height: 110, borderRadius: 36, overflow: 'hidden', borderWidth: 2, borderColor: colors.accentYellow, borderStyle: 'dashed' },
  photoImage:     { width: '100%', height: '100%' },
  photoPlaceholder:{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentYellowSoft, gap: 6 },
  photoIcon:      { fontSize: 32 },
  photoHint:      { fontSize: 12, fontWeight: '600', color: colors.accentAmber },
  changePhotoBtn: { marginTop: 12, paddingVertical: 6, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: colors.accentYellow, backgroundColor: colors.accentYellowSoft },
  changePhotoText:{ fontSize: 12, fontWeight: '700', color: colors.accentAmber },
  eyeBtn:         { padding: 8 },
  eyeText:        { fontSize: 18 },
  categoryGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  catChip:        { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface },
  catChipActive:  { borderColor: colors.accentYellow, backgroundColor: colors.accentYellowSoft },
  catChipImage:   { width: 22, height: 22, borderRadius: 11 },
  catChipText:    { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  catChipTextActive:{ color: colors.accentAmber, fontWeight: '700' },
  priceInfoBox:   { backgroundColor: colors.accentYellowSoft, borderRadius: 14, borderWidth: 1, borderColor: colors.accentYellow, padding: 16, marginBottom: 20 },
  priceInfoTitle: { fontSize: 13, fontWeight: '800', color: colors.textPrimary, marginBottom: 2 },
  priceInfoSub:   { fontSize: 11, color: colors.textMuted, fontWeight: '500', marginBottom: 12 },
  priceInfoRow:   { flexDirection: 'row', gap: 12 },
  priceInfoItem:  { flex: 1, backgroundColor: colors.surface, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border },
  priceInfoLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600', marginBottom: 2 },
  priceInfoValue: { fontSize: 16, color: colors.accentAmber, fontWeight: '800' },
  addSkillBtn:    { backgroundColor: colors.accentYellowSoft, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: colors.accentYellow, marginLeft: 8 },
  addSkillBtnDisabled: { opacity: 0.4 },
  addSkillBtnText:{ fontSize: 13, fontWeight: '700', color: colors.accentAmber },
  skillsWrap:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  skillTag:       { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceElevated, borderRadius: 20, paddingLeft: 14, paddingRight: 8, paddingVertical: 7, gap: 8, borderWidth: 1, borderColor: colors.border },
  skillTagText:   { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  skillRemove:    { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.dangerSoft, alignItems: 'center', justifyContent: 'center' },
  skillRemoveText:{ fontSize: 10, fontWeight: '800', color: colors.danger },
  skillsCount:    { fontSize: 11, color: colors.textMuted, fontWeight: '500' },
  availRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 24 },
  availLabel:     { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  availSub:       { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  toggle:         { width: 52, height: 30, borderRadius: 15, backgroundColor: colors.border, justifyContent: 'center', padding: 3 },
  toggleOn:       { backgroundColor: colors.statusGreen },
  toggleThumb:    { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.white },
  toggleThumbOn:  { alignSelf: 'flex-end' },
  submitWrap:     { marginTop: 8 },
  submitBtn:      { borderRadius: 16, paddingVertical: 17, alignItems: 'center' },
  submitBtnText:  { fontSize: 16, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.4 },
  loginRow:       { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  loginText:      { fontSize: 14, color: colors.textSecondary },
  loginAccent:    { fontSize: 14, fontWeight: '800', color: colors.accentAmber },
});

export default SignUpScreen;