import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  StatusBar, Linking, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import usePartnerStore from '../store/usePartnerStore';
import { colors } from '../theme/colors';
import { fetchWorkerFAQs } from '../services/faqHelpService';

// Static fallback FAQs used when API is unreachable
const FAQ_FALLBACK_SECTIONS = [
  {
    title: 'Getting Started',
    icon: '🚀',
    items: [
      {
        q: 'How do I receive jobs?',
        a: 'Go online by tapping the toggle on the Home screen. Once online, job requests from nearby customers will appear in your Requests list and you will receive a notification.',
      },
      {
        q: 'How do I accept a booking?',
        a: 'When a new request appears, tap on it to view the details. Then tap "Accept Job" to confirm. The job will move to your Active tab.',
      },
    ],
  },
  {
    title: 'Support',
    icon: '🆘',
    items: [
      {
        q: 'How do I contact Conza support?',
        a: 'Tap "Chat With Us" on the Profile screen or scroll down on this page. This will open your email app with a pre-filled support request.',
      },
    ],
  },
];

// ── FAQ Item ──────────────────────────────────────────────────────────────────
const FAQItem = React.memo(({ q, a }) => {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  return (
    <TouchableOpacity style={styles.faqItem} onPress={toggle} activeOpacity={0.8}>
      <View style={styles.faqQuestion}>
        <Text style={styles.faqQ}>{q}</Text>
        <Text style={styles.faqChevron}>{open ? '▲' : '▼'}</Text>
      </View>
      {open && <Text style={styles.faqA}>{a}</Text>}
    </TouchableOpacity>
  );
});

// ── FAQ Section ───────────────────────────────────────────────────────────────
const FAQSection = React.memo(({ section }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionIcon}>{section.icon}</Text>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
    {section.items.map((item, idx) => (
      <FAQItem key={idx} q={item.q} a={item.a} />
    ))}
  </View>
));

// ── Main Screen ───────────────────────────────────────────────────────────────
const HelpFAQScreen = ({ navigation }) => {
  const insets   = useSafeAreaInsets();
  const profile  = usePartnerStore((s) => s.worker) || {};
  const [sections, setSections]     = useState(FAQ_FALLBACK_SECTIONS);
  const [loadingFAQ, setLoadingFAQ] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchWorkerFAQs()
      .then((data) => {
        if (data.sections && data.sections.length > 0) {
          setSections(data.sections);
        }
      })
      .catch(() => {
        // Silently fall back to static data already set as default
      })
      .finally(() => setLoadingFAQ(false));
  }, []);

  const handleChatWithUs = useCallback(() => {
    const name  = profile.fullName || profile.name || '';
    const phone = profile.phone || '';
    const mailto =
      `mailto:nr.conza@gmail.com` +
      `?subject=${encodeURIComponent('Conza Partner Support Request')}` +
      `&body=${encodeURIComponent(`Partner Name: ${name}\nPhone: ${phone}\nIssue: `)}`;
    Linking.openURL(mailto).catch(() =>
      Alert.alert('Error', 'Could not open your mail app. Please email nr.conza@gmail.com directly.')
    );
  }, [profile]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 10 }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.pageHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Help & FAQ</Text>
        <View style={{ width: 36 }} />
      </View>

      {loadingFAQ ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accentAmber} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {sections.map((section) => (
            <FAQSection key={section.title} section={section} />
          ))}

          {/* Chat With Us */}
          <View style={styles.chatSection}>
            <Text style={styles.chatTitle}>Still need help?</Text>
            <Text style={styles.chatSub}>Our team is ready to assist you.</Text>
            <TouchableOpacity style={styles.chatBtn} onPress={handleChatWithUs} activeOpacity={0.85}>
              <Text style={styles.chatBtnIcon}>💬</Text>
              <Text style={styles.chatBtnText}>Chat With Us</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 40 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  pageHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16,
  },
  backBtn:    { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backText:   { fontSize: 28, color: colors.textPrimary, fontWeight: '300', lineHeight: 34 },
  pageTitle:  { fontSize: 20, fontWeight: '800', color: colors.textPrimary },

  section: {
    marginHorizontal: 20, marginBottom: 16,
    backgroundColor: colors.surface, borderRadius: 18,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  sectionIcon:  { fontSize: 18 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },

  faqItem: {
    paddingHorizontal: 16, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: colors.borderLight,
  },
  faqQuestion:  { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  faqQ:         { flex: 1, fontSize: 14, fontWeight: '600', color: colors.textPrimary, lineHeight: 20 },
  faqChevron:   { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  faqA: {
    marginTop: 10, fontSize: 13, color: colors.textSecondary,
    lineHeight: 20, fontWeight: '400',
  },

  chatSection: {
    margin: 20, backgroundColor: colors.accentYellowSoft,
    borderRadius: 18, padding: 20, alignItems: 'center',
    borderWidth: 1, borderColor: colors.accentYellow,
  },
  chatTitle:   { fontSize: 17, fontWeight: '800', color: colors.textPrimary, marginBottom: 6 },
  chatSub:     { fontSize: 13, color: colors.textSecondary, marginBottom: 18, textAlign: 'center' },
  chatBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.accentAmber, borderRadius: 14,
    paddingHorizontal: 24, paddingVertical: 13,
  },
  chatBtnIcon: { fontSize: 18 },
  chatBtnText: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
});

export default HelpFAQScreen;