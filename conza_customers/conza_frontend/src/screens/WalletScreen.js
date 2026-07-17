import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import useAppStore from '../store/useAppStore';
import { colors } from '../theme/colors';

const WALLET_ACCENT      = '#6D28D9';
const WALLET_ACCENT_SOFT = 'rgba(109,40,217,0.08)';
const WALLET_BANNER_BG   = '#EDE6FB';

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

const WalletScreen = () => {
  const navigation    = useNavigation();
  const walletBalance = useAppStore((s) => s.walletBalance);
  const walletLoading = useAppStore((s) => s.walletLoading);

  const [amount, setAmount] = useState('1000');

  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);

  const handleSelectChip = useCallback((val) => {
    setAmount(String(val));
  }, []);

  const handleAmountChange = useCallback((text) => {
    setAmount(text.replace(/[^0-9]/g, ''));
  }, []);

  const handleAddBalance = useCallback(() => {
    if (!amount || Number(amount) <= 0) {
      Alert.alert('Enter an amount', 'Please enter a valid amount to add.');
      return;
    }
    Alert.alert(
      'Coming Soon',
      'Online wallet top-up is coming soon. You\u2019ll be able to add \u20B9' + amount + ' here shortly.'
    );
  }, [amount]);

  const handleAddGiftCard = useCallback(() => {
    Alert.alert('Coming Soon', 'Gift card redemption is coming soon.');
  }, []);

  const handleHowItWorks = useCallback(() => {
    Alert.alert(
      'How Wallet Works',
      'Add money to your Conza Cash balance and use it for one-tap checkout on materials, rentals and labour bookings. Refunds for cancelled orders are credited here instantly.'
    );
  }, []);

  const displayBalance = useMemo(() => `\u20B9${walletLoading ? '\u2013' : walletBalance}`, [walletBalance, walletLoading]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleGoBack} activeOpacity={0.8}>
          <MaterialCommunityIcons name="chevron-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Balance card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
          <Text style={styles.balanceValue}>{displayBalance}</Text>
        </View>

        {/* Promo banner */}
        <View style={styles.promoBanner}>
          <View style={styles.promoItem}>
            <View style={styles.promoIconWrap}>
              <MaterialCommunityIcons name="gesture-tap" size={16} color={WALLET_ACCENT} />
            </View>
            <View>
              <Text style={styles.promoTitle}>ONE-TAP</Text>
              <Text style={styles.promoSub}>payment</Text>
            </View>
          </View>
          <View style={styles.promoDivider} />
          <View style={styles.promoItem}>
            <View style={styles.promoIconWrap}>
              <MaterialCommunityIcons name="cached" size={16} color={WALLET_ACCENT} />
            </View>
            <View>
              <Text style={styles.promoTitle}>INSTANT</Text>
              <Text style={styles.promoSub}>refund</Text>
            </View>
          </View>
        </View>

        {/* Add amount card */}
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Add amount <Text style={styles.required}>*</Text></Text>
          <View style={styles.amountInputWrap}>
            <Text style={styles.rupeeSymbol}>\u20B9</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={handleAmountChange}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.chipsRow}>
            {QUICK_AMOUNTS.map((val) => {
              const selected = String(val) === amount;
              return (
                <TouchableOpacity
                  key={val}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => handleSelectChip(val)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{val}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            style={styles.addBtn}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            <TouchableOpacity style={styles.addBtnTouch} onPress={handleAddBalance} activeOpacity={0.85}>
              <Text style={styles.addBtnText}>Add Balance</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Gift card row */}
        <View style={styles.giftRow}>
          <View style={styles.giftLeft}>
            <View style={styles.giftIconWrap}>
              <MaterialCommunityIcons name="gift-outline" size={18} color={colors.textPrimary} />
            </View>
            <Text style={styles.giftText}>Have a Gift Card?</Text>
          </View>
          <TouchableOpacity style={styles.giftBtn} onPress={handleAddGiftCard} activeOpacity={0.8}>
            <Text style={styles.giftBtnText}>Add Card</Text>
          </TouchableOpacity>
        </View>

        {/* Recent transactions */}
        <View style={styles.card}>
          <View style={styles.txHeaderRow}>
            <View style={styles.txHeaderLeft}>
              <View style={styles.txIconWrap}>
                <MaterialCommunityIcons name="receipt-text-outline" size={18} color={colors.textPrimary} />
              </View>
              <Text style={styles.txHeaderText}>Recent Transactions</Text>
            </View>
          </View>
          <View style={styles.txEmpty}>
            <MaterialCommunityIcons name="wallet-outline" size={28} color={colors.textMuted} />
            <Text style={styles.txEmptyText}>No transactions yet</Text>
          </View>
        </View>

        {/* How it works */}
        <TouchableOpacity style={styles.howRow} onPress={handleHowItWorks} activeOpacity={0.8}>
          <View style={styles.howLeft}>
            <MaterialCommunityIcons name="information-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.howText}>How it works</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },

  balanceCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    paddingVertical: 24,
    marginTop: 8,
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 8,
  },
  balanceValue: { fontSize: 32, fontWeight: '800', color: colors.textPrimary },

  promoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WALLET_BANNER_BG,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  promoItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  promoIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoTitle: { fontSize: 12, fontWeight: '800', color: WALLET_ACCENT, letterSpacing: 0.3 },
  promoSub: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  promoDivider: { width: 1, height: 30, backgroundColor: 'rgba(109,40,217,0.18)', marginHorizontal: 10 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 16,
  },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: 10 },
  required: { color: colors.danger },
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
  },
  rupeeSymbol: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginRight: 8 },
  amountInput: { flex: 1, fontSize: 17, fontWeight: '700', color: colors.textPrimary, padding: 0 },

  chipsRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.3,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: { borderColor: colors.danger, backgroundColor: 'rgba(224,59,59,0.06)' },
  chipText: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  chipTextSelected: { color: colors.danger },

  addBtn: { borderRadius: 16, overflow: 'hidden' },
  addBtnTouch: { paddingVertical: 16, alignItems: 'center' },
  addBtnText: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.3 },

  giftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  giftLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  giftIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  giftText: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  giftBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.danger,
  },
  giftBtnText: { fontSize: 13, fontWeight: '700', color: colors.danger },

  txHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  txHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  txIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  txHeaderText: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },

  txEmpty: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  txEmptyText: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },

  howRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  howLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  howText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
});

export default WalletScreen;
