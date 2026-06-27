import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  StatusBar, Linking, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { fetchCustomerFAQs, fetchCustomerHelpArticles } from '../services/faqHelpService';

// ── FAQ Item ──────────────────────────────────────────────────────────────────
const FAQItem = React.memo(({ q, a }) => {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={toggle} style={styles.faqItem}>
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

// ── Help Article Item ─────────────────────────────────────────────────────────
const HelpArticleItem = React.memo(({ title, content }) => {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={toggle} style={styles.faqItem}>
      <View style={styles.faqQuestion}>
        <Text style={styles.faqQ}>{title}</Text>
        <Text style={styles.faqChevron}>{open ? '▲' : '▼'}</Text>
      </View>
      {open && <Text style={styles.faqA}>{content}</Text>}
    </TouchableOpacity>
  );
});

// ── Main Screen ───────────────────────────────────────────────────────────────
const HelpFAQScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [faqSections, setFaqSections] = useState([]);
  const [helpArticles, setHelpArticles] = useState([]);
  const [loadingFAQ, setLoadingFAQ] = useState(true);
  const [loadingHelp, setLoadingHelp] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const loadFAQs = async () => {
      try {
        const data = await fetchCustomerFAQs();
        if (isMounted && data.sections) {
          setFaqSections(data.sections);
        }
      } catch (err) {
        console.error('Failed to load FAQs:', err);
      } finally {
        if (isMounted) setLoadingFAQ(false);
      }
    };

    const loadHelpArticles = async () => {
      try {
        const data = await fetchCustomerHelpArticles();
        if (isMounted && data.articles) {
          setHelpArticles(data.articles);
        }
      } catch (err) {
        console.error('Failed to load help articles:', err);
      } finally {
        if (isMounted) setLoadingHelp(false);
      }
    };

    loadFAQs();
    loadHelpArticles();

    return () => { isMounted = false; };
  }, []);

  const handleChatWithUs = useCallback(() => {
    const mailto =
      `mailto:nr.conza@gmail.com` +
      `?subject=${encodeURIComponent('Conza Customer Support Request')}` +
      `&body=${encodeURIComponent('Issue: ')}`;
    Linking.openURL(mailto).catch(() =>
      Alert.alert('Error', 'Could not open your mail app. Please email nr.conza@gmail.com directly.')
    );
  }, []);

  const renderEmpty = (message) => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={styles.pageHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Help & Support</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* FAQs Section */}
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryTitle}>FAQs</Text>
        </View>
        
        {loadingFAQ ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : faqSections.length === 0 ? (
          renderEmpty('No FAQs available')
        ) : (
          faqSections.map((section) => (
            <FAQSection key={section.title} section={section} />
          ))
        )}

        {/* Help Articles Section */}
        <View style={[styles.categoryHeader, { marginTop: 24 }]}>
          <Text style={styles.categoryTitle}>Help Articles</Text>
        </View>
        
        {loadingHelp ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : helpArticles.length === 0 ? (
          renderEmpty('No help articles available')
        ) : (
          <View style={styles.section}>
            {helpArticles.map((article, idx) => (
              <HelpArticleItem key={article._id || idx} title={article.title} content={article.content} />
            ))}
          </View>
        )}

        {/* Chat With Us */}
        <View style={styles.chatSection}>
          <Text style={styles.chatTitle}>Still need help?</Text>
          <Text style={styles.chatSub}>Our team is ready to assist you.</Text>
          <TouchableOpacity style={styles.chatBtn} onPress={handleChatWithUs}>
            <Text style={styles.chatBtnIcon}>💬</Text>
            <Text style={styles.chatBtnText}>Chat With Us</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 40 },
  loadingContainer: { paddingVertical: 20, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { paddingVertical: 20, alignItems: 'center' },
  emptyText: { fontSize: 14, color: colors.textMuted },

  pageHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 28, color: colors.textPrimary, fontWeight: '300', lineHeight: 34 },
  pageTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },

  categoryHeader: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },

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
  sectionIcon: { fontSize: 18 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },

  faqItem: {
    paddingHorizontal: 16, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: colors.borderLight,
  },
  faqQuestion: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  faqQ: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.textPrimary, lineHeight: 20 },
  faqChevron: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  faqA: {
    marginTop: 10, fontSize: 13, color: colors.textSecondary,
    lineHeight: 20, fontWeight: '400',
  },

  chatSection: {
    margin: 20, backgroundColor: colors.accentYellowSoft,
    borderRadius: 18, padding: 20, alignItems: 'center',
    borderWidth: 1, borderColor: colors.accentYellow,
  },
  chatTitle: { fontSize: 17, fontWeight: '800', color: colors.textPrimary, marginBottom: 6 },
  chatSub: { fontSize: 13, color: colors.textSecondary, marginBottom: 18, textAlign: 'center' },
  chatBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.accentAmber, borderRadius: 14,
    paddingHorizontal: 24, paddingVertical: 13,
  },
  chatBtnIcon: { fontSize: 18 },
  chatBtnText: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
});

export default HelpFAQScreen;
