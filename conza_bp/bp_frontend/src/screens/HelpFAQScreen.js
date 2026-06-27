import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  StatusBar, Linking, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import usePartnerStore from '../store/usePartnerStore';
import { colors } from '../theme/colors';
import { fetchWorkerFAQs, fetchWorkerHelpArticles } from '../services/faqHelpService';

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

// ── Article Item ──────────────────────────────────────────────────────────────
const ArticleItem = React.memo(({ article }) => {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  return (
    <TouchableOpacity style={styles.articleItem} onPress={toggle} activeOpacity={0.8}>
      <View style={styles.articleHeader}>
        <Text style={styles.articleTitle}>{article.title}</Text>
        <Text style={styles.faqChevron}>{open ? '▲' : '▼'}</Text>
      </View>
      {open && <Text style={styles.articleContent}>{article.content}</Text>}
    </TouchableOpacity>
  );
});

// ── FAQs Tab ──────────────────────────────────────────────────────────────────
const FAQsTab = () => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    setError(null);
    fetchWorkerFAQs()
      .then((data) => setSections(data.sections || []))
      .catch(() => setError('Failed to load FAQs. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" color={colors.accentAmber} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.emptyIcon}>⚠️</Text>
        <Text style={styles.emptyText}>{error}</Text>
      </View>
    );
  }

  if (sections.length === 0) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.emptyIcon}>❓</Text>
        <Text style={styles.emptyText}>No FAQs available yet.</Text>
      </View>
    );
  }

  return (
    <>
      {sections.map((section) => (
        <FAQSection key={section.title} section={section} />
      ))}
    </>
  );
};

// ── Help Articles Tab ─────────────────────────────────────────────────────────
const HelpArticlesTab = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    setError(null);
    fetchWorkerHelpArticles()
      .then((data) => setArticles(data.articles || []))
      .catch(() => setError('Failed to load help articles. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" color={colors.accentAmber} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.emptyIcon}>⚠️</Text>
        <Text style={styles.emptyText}>{error}</Text>
      </View>
    );
  }

  if (articles.length === 0) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.emptyIcon}>📖</Text>
        <Text style={styles.emptyText}>No help articles available yet.</Text>
      </View>
    );
  }

  return (
    <>
      {articles.map((article) => (
        <ArticleItem key={article._id} article={article} />
      ))}
    </>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
const HelpFAQScreen = ({ navigation }) => {
  const insets  = useSafeAreaInsets();
  const profile = usePartnerStore((s) => s.worker) || {};
  const [activeTab, setActiveTab] = useState('faqs');

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
        <Text style={styles.pageTitle}>Help Center</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'faqs' && styles.tabActive]}
          onPress={() => setActiveTab('faqs')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'faqs' && styles.tabTextActive]}>FAQs</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'articles' && styles.tabActive]}
          onPress={() => setActiveTab('articles')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'articles' && styles.tabTextActive]}>Help Articles</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {activeTab === 'faqs' ? <FAQsTab /> : <HelpArticlesTab />}

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
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 40 },

  pageHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 12,
  },
  backBtn:   { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backText:  { fontSize: 28, color: colors.textPrimary, fontWeight: '300', lineHeight: 34 },
  pageTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },

  // ── Tab Bar
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: colors.accentAmber,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.textPrimary,
  },

  // ── States
  centerState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', fontWeight: '500' },

  // ── FAQ Section
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
  faqQuestion: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  faqQ:        { flex: 1, fontSize: 14, fontWeight: '600', color: colors.textPrimary, lineHeight: 20 },
  faqChevron:  { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  faqA: {
    marginTop: 10, fontSize: 13, color: colors.textSecondary,
    lineHeight: 20, fontWeight: '400',
  },

  // ── Article Item
  articleItem: {
    marginHorizontal: 20, marginBottom: 10,
    backgroundColor: colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: colors.border,
    padding: 16,
  },
  articleHeader: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', gap: 10,
  },
  articleTitle: {
    flex: 1, fontSize: 14, fontWeight: '700',
    color: colors.textPrimary, lineHeight: 20,
  },
  articleContent: {
    marginTop: 10, fontSize: 13, color: colors.textSecondary,
    lineHeight: 20, fontWeight: '400',
  },

  // ── Chat Section
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