// src/screens/auth/LoginScreen.js
import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { login, forgotPassword } from '../../services/authService';
import { colors } from '../../theme/colors';

const GRAD_START = { x: 0, y: 0 };
const GRAD_END   = { x: 1, y: 0 };

// ── Reusable input ────────────────────────────────────────────────────────────
const Field = React.memo(({
  label, value, onChangeText, placeholder, secureTextEntry,
  keyboardType, autoCapitalize, rightElement, error,
}) => (
  <View style={fieldStyles.wrap}>
    <Text style={fieldStyles.label}>{label}</Text>
    <View style={[fieldStyles.inputRow, error && fieldStyles.inputError]}>
      <TextInput
        style={fieldStyles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType || 'default'}
        autoCapitalize={autoCapitalize || 'none'}
        autoCorrect={false}
      />
      {rightElement}
    </View>
    {error ? <Text style={fieldStyles.errorText}>{error}</Text> : null}
  </View>
));

const fieldStyles = StyleSheet.create({
  wrap:        { marginBottom: 18 },
  label:       { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: 8, letterSpacing: 0.2 },
  inputRow:    { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBg, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 16 },
  input:       { flex: 1, height: 52, fontSize: 15, color: colors.textPrimary, fontWeight: '500' },
  inputError:  { borderColor: colors.danger },
  errorText:   { fontSize: 12, color: colors.danger, marginTop: 6, fontWeight: '500' },
});

// ── Screen ────────────────────────────────────────────────────────────────────
const LoginScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword]     = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [errors, setErrors]         = useState({});
  const [loading, setLoading]       = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotId, setForgotId]     = useState('');
  const [forgotMsg, setForgotMsg]   = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const validate = useCallback(() => {
    const e = {};
    if (!identifier.trim()) e.identifier = 'Enter your username or phone number.';
    if (!password)          e.password   = 'Enter your password.';
    else if (password.length < 6) e.password = 'Password must be at least 6 characters.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [identifier, password]);

  const handleLogin = useCallback(async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      const user = await login(identifier.trim(), password);
      // Merge user into partner store
      navigation.replace('MainApp', { user });
    } catch (err) {
      const msg = err.message;
      if (msg.includes('password')) setErrors({ password: msg });
      else setErrors({ identifier: msg });
    } finally {
      setLoading(false);
    }
  }, [identifier, password, validate, navigation]);

  const handleForgot = useCallback(async () => {
    if (!forgotId.trim()) {
      setForgotMsg('Please enter your username, phone, or email.');
      return;
    }
    setForgotLoading(true);
    setForgotMsg('');
    try {
      const res = await forgotPassword(forgotId.trim());
      setForgotMsg(res.hint);
    } catch (err) {
      setForgotMsg(err.message);
    } finally {
      setForgotLoading(false);
    }
  }, [forgotId]);

  const togglePass    = useCallback(() => setShowPass((p) => !p), []);
  const goBack        = useCallback(() => navigation.goBack(), [navigation]);
  const openForgot    = useCallback(() => { setForgotMode(true); setForgotMsg(''); }, []);
  const closeForgot   = useCallback(() => { setForgotMode(false); setForgotMsg(''); setForgotId(''); }, []);
  const goSignUp      = useCallback(() => navigation.navigate('SignUp'), [navigation]);

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
          <Text style={styles.headerTitle}>Welcome Back</Text>
          <View style={styles.spacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.subtitle}>Log in to your Conza Partner account</Text>

          {/* Forgot Password Modal */}
          {forgotMode ? (
            <View style={styles.forgotCard}>
              <Text style={styles.forgotTitle}>Reset Password</Text>
              <Text style={styles.forgotSub}>
                Enter your username, phone, or email and we'll send reset instructions.
              </Text>
              <View style={[fieldStyles.inputRow, { marginBottom: 14 }]}>
                <TextInput
                  style={fieldStyles.input}
                  value={forgotId}
                  onChangeText={setForgotId}
                  placeholder="Username / Phone / Email"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {!!forgotMsg && (
                <Text style={[
                  styles.forgotMsg,
                  forgotMsg.includes('sent') || forgotMsg.includes('Reset')
                    ? styles.forgotSuccess
                    : styles.forgotError,
                ]}>
                  {forgotMsg}
                </Text>
              )}
              <TouchableOpacity
                onPress={handleForgot}
                activeOpacity={0.85}
                disabled={forgotLoading}
              >
                <LinearGradient
                  colors={[colors.gradientStart, colors.gradientEnd]}
                  start={GRAD_START} end={GRAD_END}
                  style={styles.submitBtn}
                >
                  {forgotLoading
                    ? <ActivityIndicator color={colors.textPrimary} />
                    : <Text style={styles.submitBtnText}>Send Instructions</Text>
                  }
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity onPress={closeForgot} style={styles.cancelLink}>
                <Text style={styles.cancelLinkText}>← Back to Login</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Field
                label="Username or Phone Number"
                value={identifier}
                onChangeText={setIdentifier}
                placeholder="Enter username or phone"
                error={errors.identifier}
                keyboardType="email-address"
              />

              <Field
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry={!showPass}
                error={errors.password}
                rightElement={
                  <TouchableOpacity onPress={togglePass} style={styles.eyeBtn}>
                    <Text style={styles.eyeText}>{showPass ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                }
              />

              <TouchableOpacity onPress={openForgot} style={styles.forgotLink}>
                <Text style={styles.forgotLinkText}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleLogin}
                activeOpacity={0.88}
                disabled={loading}
                style={styles.btnWrap}
              >
                <LinearGradient
                  colors={[colors.gradientStart, colors.gradientEnd]}
                  start={GRAD_START} end={GRAD_END}
                  style={styles.submitBtn}
                >
                  {loading
                    ? <ActivityIndicator color={colors.textPrimary} />
                    : <Text style={styles.submitBtnText}>Log In →</Text>
                  }
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.signupRow}>
                <Text style={styles.signupText}>Don't have an account? </Text>
                <TouchableOpacity onPress={goSignUp}>
                  <Text style={styles.signupAccent}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex:         { flex: 1, backgroundColor: colors.background },
  screen:       { flex: 1, backgroundColor: colors.background },
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface },
  backBtn:      { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon:     { fontSize: 28, color: colors.textPrimary, fontWeight: '300', lineHeight: 32 },
  headerTitle:  { fontSize: 17, fontWeight: '800', color: colors.textPrimary },
  spacer:       { width: 40 },
  content:      { padding: 24, paddingBottom: 60 },
  subtitle:     { fontSize: 14, color: colors.textSecondary, marginBottom: 28, lineHeight: 20 },
  eyeBtn:       { padding: 8 },
  eyeText:      { fontSize: 18 },
  forgotLink:   { alignSelf: 'flex-end', marginTop: -8, marginBottom: 24 },
  forgotLinkText:{ fontSize: 13, fontWeight: '700', color: colors.accentAmber },
  btnWrap:      { marginTop: 8 },
  submitBtn:    { borderRadius: 16, paddingVertical: 17, alignItems: 'center' },
  submitBtnText:{ fontSize: 16, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.4 },
  signupRow:    { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  signupText:   { fontSize: 14, color: colors.textSecondary },
  signupAccent: { fontSize: 14, fontWeight: '800', color: colors.accentAmber },
  forgotCard:   { backgroundColor: colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.border, gap: 4 },
  forgotTitle:  { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: 6 },
  forgotSub:    { fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginBottom: 16 },
  forgotMsg:    { fontSize: 13, fontWeight: '600', marginBottom: 12, lineHeight: 18 },
  forgotSuccess:{ color: colors.statusGreen },
  forgotError:  { color: colors.danger },
  cancelLink:   { alignSelf: 'center', marginTop: 14, paddingVertical: 6 },
  cancelLinkText:{ fontSize: 13, color: colors.textMuted, fontWeight: '600' },
});

export default LoginScreen;