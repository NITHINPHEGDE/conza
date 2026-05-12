import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../theme/colors';

const LoginScreen = ({ navigation }) => {
  const [phone,    setPhone]    = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useAuth();

  const handleLogin = async () => {
    await login(phone, password);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          style={styles.logoBox}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <Text style={styles.logoEmoji}>🏗️</Text>
        </LinearGradient>

        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.sub}>Login to continue</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="+91 9876543210"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          style={styles.btn}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        >
          <TouchableOpacity style={styles.btnTouch} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Login →</Text>
            }
          </TouchableOpacity>
        </LinearGradient>

        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.switchText}>
            Don't have an account? <Text style={styles.switchLink}>Sign Up</Text>
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  logoBox: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 28 },
  logoEmoji: { fontSize: 38 },
  title: { fontSize: 28, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', marginBottom: 6 },
  sub:   { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginBottom: 32 },
  error: { backgroundColor: '#FEE2E2', color: '#DC2626', padding: 12, borderRadius: 12, marginBottom: 16, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: 6 },
  input: { backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: colors.textPrimary },
  btn:   { borderRadius: 16, overflow: 'hidden', marginTop: 8, marginBottom: 24 },
  btnTouch: { paddingVertical: 16, alignItems: 'center' },
  btnText: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  switchText: { textAlign: 'center', color: colors.textMuted, fontSize: 14 },
  switchLink: { color: colors.accentGreen, fontWeight: '700' },
});

export default LoginScreen;