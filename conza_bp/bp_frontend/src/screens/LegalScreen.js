import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  StatusBar, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { fetchWorkerLegal, fetchAboutUs } from '../services/legalService';

const TABS = [
  { key: 'terms',   label: 'Terms',   fieldKey: 'terms',   fetcher: fetchWorkerLegal },
  { key: 'privacy', label: 'Privacy', fieldKey: 'privacy', fetcher: fetchWorkerLegal },
  { key: 'refund',  label: 'Refund',  fieldKey: 'refund',  fetcher: fetchWorkerLegal },
  { key: 'about',   label: 'About Us', fieldKey: 'about',  fetcher: fetchAboutUs },
];

const LegalTabContent = ({ fetcher, fieldKey }) => {
  const [doc, setDoc]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    setError(null);
    fetcher()
      .then((data) => setDoc(data[fieldKey] || null))
      .catch(() => setError('Failed to load content. Please try again.'))
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

  if (!doc) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.emptyIcon}>📃</Text>
        <Text style={styles.emptyText}>Content not available yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.docBox}>
      {!!doc.title && <Text style={styles.docTitle}>{doc.title}</Text>}
      <Text style={styles.docContent}>{doc.content}</Text>
    </View>
  );
};

const LegalScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState(route?.params?.tab || 'terms');
  const activeMeta = TABS.find((t) => t.key === activeTab);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 10 }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.pageHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Legal</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <LegalTabContent key={activeTab} fetcher={activeMeta.fetcher} fieldKey={activeMeta.fieldKey} />
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
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: colors.accentAmber },
  tabText: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  tabTextActive: { color: colors.textPrimary },

  centerState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 20 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', fontWeight: '500' },

  docBox: {
    marginHorizontal: 20, backgroundColor: colors.surface, borderRadius: 18,
    borderWidth: 1, borderColor: colors.border, padding: 18,
  },
  docTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginBottom: 10 },
  docContent: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
});

export default LegalScreen;
