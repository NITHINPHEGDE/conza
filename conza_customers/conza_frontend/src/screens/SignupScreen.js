import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../theme/colors';

const SignupScreen = ({ navigation }) => {
  const [form, setForm] = useState({
    fullName: '', username: '', phone: '', email: '', password: '',
  });
  const { signup, loading, error } = useAuth();

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSignup = async () => {
    await signup(form);
  };

  const fields = [
    { key: 'fullName', label: 'Full Name',      placeholder: 'Ravi Kumar',          keyboard: 'default' },
    { key: 'username', label: 'Username',        placeholder: 'ravikumar',            keyboard: 'default' },
    { key: 'phone',    label: 'Phone Number',    placeholder: '+91 9876543210',       keyboard: 'phone-pad' },
    { key: 'email',    label: 'Email (optional)',placeholder: 'ravi@email.com',       keyboard: 'email-address' },
    { key: 'password', label: 'Password',        placeholder: 'Min 6 characters',    keyboard: 'default', secure: true },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.sub}>Join Conza Construction</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {fields.map((f) => (
          <View key={f.key} style={styles.inputGroup}>
            <Text style={styles.label}>{f.label}</Text>
            <TextInput
              style={styles.input}
              placeholder={f.placeholder}
              keyboardType={f.keyboard}
              secureTextEntry={f.secure || false}
              value={form[f.key]}
              onChangeText={(v) => update(f.key, v)}
              placeholderTextColor={colors.textMuted}
              autoCapitalize={f.key === 'email' || f.key === 'username' ? 'none' : 'words'}
            />
          </View>
        ))}

        <View style={styles.locationNote}>
          <Text style={styles.locationNoteText}>
            📍 We'll ask for location permission to find nearby workers
          </Text>
        </View>

        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          style={styles.btn}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        >
          <TouchableOpacity style={styles.btnTouch} onPress={handleSignup} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Create Account →</Text>
            }
          </TouchableOpacity>
        </LinearGradient>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.switchText}>
            Already have an account? <Text style={styles.switchLink}>Login</Text>
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 40 },
  title: { fontSize: 28, fontWeight: '800', color: colors.textPrimary, marginBottom: 6 },
  sub:   { fontSize: 14, color: colors.textMuted, marginBottom: 28 },
  error: { backgroundColor: '#FEE2E2', color: '#DC2626', padding: 12, borderRadius: 12, marginBottom: 16, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: 6 },
  input: { backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: colors.textPrimary },
  locationNote: { backgroundColor: colors.accentYellowSoft, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.accentYellow, marginBottom: 24 },
  locationNoteText: { fontSize: 13, color: colors.accentAmber, fontWeight: '600', textAlign: 'center' },
  btn:   { borderRadius: 16, overflow: 'hidden', marginBottom: 24 },
  btnTouch: { paddingVertical: 16, alignItems: 'center' },
  btnText: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  switchText: { textAlign: 'center', color: colors.textMuted, fontSize: 14 },
  switchLink: { color: colors.accentGreen, fontWeight: '700' },
});

export default SignupScreen;