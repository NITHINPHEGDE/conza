// conzavf/src/screens/auth/LoginScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient }    from 'expo-linear-gradient';
import { loginSeller }       from '../../services/authService';
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

const LoginScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const setSeller = useVendorStore((s) => s.setSeller);
  const initSocketListeners = useVendorStore((s) => s.initSocketListeners);

  const [phone,    setPhone]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async () => {
    if (!phone.trim() || !password) {
      Alert.alert('Missing Fields', 'Please enter your phone and password.');
      return;
    }
    setLoading(true);
    try {
      const seller = await loginSeller(phone.trim(), password);
      setSeller(seller);
      initSocketListeners();
    } catch (err) {
      Alert.alert('Login Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Seller Sign In</Text>
          <Text style={styles.subtitle}>Welcome back to Conza Vendor</Text>
        </LinearGradient>

        <View style={styles.form}>
          <Field
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter registered phone"
            keyboardType="phone-pad"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
            secureTextEntry
          />

          <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              {loading
                ? <ActivityIndicator color="#FFF" />
                : <Text style={styles.btnText}>Sign In</Text>
              }
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.switchLink}>
            <Text style={styles.switchText}>Don't have an account? <Text style={styles.switchAccent}>Register</Text></Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: colors.background },
  header:      { padding: 28, paddingBottom: 36 },
  backBtn:     { marginBottom: 16 },
  backText:    { color: 'rgba(255,255,255,0.8)', fontWeight: '600', fontSize: 14 },
  title:       { fontSize: 28, fontWeight: '900', color: '#FFF' },
  subtitle:    { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 6 },
  form:        { flex: 1, padding: 24, gap: 4 },
  fieldWrap:   { marginBottom: 18 },
  label:       { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  input:       { backgroundColor: colors.inputBg, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 16, height: 52, fontSize: 15, color: colors.textPrimary },
  btn:         { borderRadius: 16, overflow: 'hidden', marginTop: 8 },
  btnGradient: { paddingVertical: 18, alignItems: 'center' },
  btnText:     { fontSize: 16, fontWeight: '800', color: '#FFF' },
  switchLink:  { marginTop: 20, alignItems: 'center' },
  switchText:  { fontSize: 14, color: colors.textSecondary },
  switchAccent:{ color: colors.accentAmber, fontWeight: '700' },
});

export default LoginScreen;