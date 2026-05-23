// conzavf/src/screens/auth/RegisterScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient }    from 'expo-linear-gradient';
import { registerSeller }    from '../../services/authService';
import useVendorStore        from '../../store/useVendorStore';
import { colors }            from '../../theme/colors';

const Field = ({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType }) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType || 'default'}
      autoCapitalize="none"
      autoCorrect={false}
    />
  </View>
);

const RegisterScreen = ({ navigation }) => {
  const insets    = useSafeAreaInsets();
  const setSeller = useVendorStore((s) => s.setSeller);
  const initSocketListeners = useVendorStore((s) => s.initSocketListeners);

  const [name,       setName]       = useState('');
  const [phone,      setPhone]      = useState('');
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [shopName,   setShopName]   = useState('');
  const [city,       setCity]       = useState('');
  const [sellerType, setSellerType] = useState('both'); // 'material' | 'rental' | 'both'
  const [loading,    setLoading]    = useState(false);

  const handleRegister = async () => {
    if (!name || !phone || !password || !shopName) {
      Alert.alert('Missing Fields', 'Name, phone, password, and shop name are required.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const seller = await registerSeller({ name, phone, email, password, shopName, city, sellerType });
      setSeller(seller);
      initSocketListeners();
    } catch (err) {
      Alert.alert('Registration Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const TypeBtn = ({ value, label }) => (
    <TouchableOpacity
      style={[styles.typeBtn, sellerType === value && styles.typeBtnActive]}
      onPress={() => setSellerType(value)}
    >
      <Text style={[styles.typeBtnText, sellerType === value && styles.typeBtnTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Create Seller Account</Text>
          <Text style={styles.subtitle}>Join thousands of vendors on Conza</Text>
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
          <Field label="Full Name"   value={name}     onChangeText={setName}     placeholder="Your full name" />
          <Field label="Phone"       value={phone}     onChangeText={setPhone}    placeholder="10-digit mobile" keyboardType="phone-pad" />
          <Field label="Email"       value={email}     onChangeText={setEmail}    placeholder="Optional email" keyboardType="email-address" />
          <Field label="Shop Name"   value={shopName}  onChangeText={setShopName} placeholder="Business / shop name" />
          <Field label="City"        value={city}      onChangeText={setCity}     placeholder="Your city" />
          <Field label="Password"    value={password}  onChangeText={setPassword} placeholder="Min 6 characters" secureTextEntry />

          <Text style={styles.typeLabel}>What do you sell?</Text>
          <View style={styles.typeRow}>
            <TypeBtn value="material" label="🧱 Materials" />
            <TypeBtn value="rental"   label="🏗️ Rentals"   />
            <TypeBtn value="both"     label="🔁 Both"       />
          </View>

          <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              {loading
                ? <ActivityIndicator color="#FFF" />
                : <Text style={styles.btnText}>Create Account</Text>
              }
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.switchLink}>
            <Text style={styles.switchText}>Already have an account? <Text style={styles.switchAccent}>Sign In</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen:           { flex: 1, backgroundColor: colors.background },
  header:           { padding: 28, paddingBottom: 36 },
  backBtn:          { marginBottom: 16 },
  backText:         { color: 'rgba(255,255,255,0.8)', fontWeight: '600', fontSize: 14 },
  title:            { fontSize: 26, fontWeight: '900', color: '#FFF' },
  subtitle:         { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 6 },
  form:             { padding: 24, paddingBottom: 48 },
  fieldWrap:        { marginBottom: 18 },
  label:            { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  input:            { backgroundColor: colors.inputBg, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 16, height: 52, fontSize: 15, color: colors.textPrimary },
  typeLabel:        { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: 10 },
  typeRow:          { flexDirection: 'row', gap: 10, marginBottom: 24 },
  typeBtn:          { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.surface },
  typeBtnActive:    { backgroundColor: colors.accentAmberSoft, borderColor: colors.accentAmber },
  typeBtnText:      { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  typeBtnTextActive:{ color: colors.accentAmber },
  btn:              { borderRadius: 16, overflow: 'hidden', marginBottom: 20 },
  btnGradient:      { paddingVertical: 18, alignItems: 'center' },
  btnText:          { fontSize: 16, fontWeight: '800', color: '#FFF' },
  switchLink:       { alignItems: 'center' },
  switchText:       { fontSize: 14, color: colors.textSecondary },
  switchAccent:     { color: colors.accentAmber, fontWeight: '700' },
});

export default RegisterScreen;