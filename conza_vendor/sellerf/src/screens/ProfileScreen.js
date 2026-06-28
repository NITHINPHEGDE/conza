import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import useModeStore    from '../store/useModeStore';
import useVendorStore  from '../store/useVendorStore';
import ModeToggle      from '../components/ModeToggle';
import { colors }      from '../theme/colors';
import { logoutSeller } from '../services/authService';
import { fetchVendorFAQs, fetchVendorHelpArticles } from '../services/faqHelpService';
import { fetchVendorLegal, fetchAboutUs } from '../services/legalService';

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

// ── FAQs Modal ────────────────────────────────────────────────────────────────
const FAQsModal = React.memo(({ visible, onClose }) => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!visible || fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    setError(null);
    fetchVendorFAQs()
      .then((data) => setSections(data.sections || []))
      .catch(() => setError('Failed to load FAQs. Please try again.'))
      .finally(() => setLoading(false));
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { maxHeight: '90%' }]}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>FAQs</Text>
          {loading ? (
            <ActivityIndicator color={colors.accentAmber} style={{ marginVertical: 32 }} />
          ) : error ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>⚠️</Text>
              <Text style={styles.emptyText}>{error}</Text>
            </View>
          ) : sections.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>❓</Text>
              <Text style={styles.emptyText}>No FAQs available yet.</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {sections.map((section) => (
                <View key={section.title} style={styles.faqSection}>
                  <View style={styles.faqSectionHeader}>
                    <Text style={styles.faqSectionIcon}>{section.icon}</Text>
                    <Text style={styles.faqSectionTitle}>{section.title}</Text>
                  </View>
                  {section.items.map((item, idx) => (
                    <FAQItem key={idx} q={item.q} a={item.a} />
                  ))}
                </View>
              ))}
            </ScrollView>
          )}
          <TouchableOpacity onPress={onClose} style={styles.closeBtnContainer}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
});

// ── Help Articles Modal ───────────────────────────────────────────────────────
const HelpArticlesModal = React.memo(({ visible, onClose }) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!visible || fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    setError(null);
    fetchVendorHelpArticles()
      .then((data) => setArticles(data.articles || []))
      .catch(() => setError('Failed to load help articles. Please try again.'))
      .finally(() => setLoading(false));
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { maxHeight: '90%' }]}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Help Articles</Text>
          {loading ? (
            <ActivityIndicator color={colors.accentAmber} style={{ marginVertical: 32 }} />
          ) : error ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>⚠️</Text>
              <Text style={styles.emptyText}>{error}</Text>
            </View>
          ) : articles.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📖</Text>
              <Text style={styles.emptyText}>No help articles available yet.</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {articles.map((article) => (
                <ArticleItem key={article._id} article={article} />
              ))}
            </ScrollView>
          )}
          <TouchableOpacity onPress={onClose} style={styles.closeBtnContainer}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
});

// ── Legal Content Modal (Terms / Privacy / About Us) ─────────────────────────
const LegalModal = React.memo(({ visible, onClose, title, icon, fetcher, fieldKey }) => {
  const [doc, setDoc]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!visible || fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    setError(null);
    fetcher()
      .then((data) => setDoc(data[fieldKey] || null))
      .catch(() => setError('Failed to load content. Please try again.'))
      .finally(() => setLoading(false));
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { maxHeight: '90%' }]}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{title}</Text>
          {loading ? (
            <ActivityIndicator color={colors.accentAmber} style={{ marginVertical: 32 }} />
          ) : error ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>⚠️</Text>
              <Text style={styles.emptyText}>{error}</Text>
            </View>
          ) : !doc ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>{icon}</Text>
              <Text style={styles.emptyText}>Content not available yet.</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: 8 }}>
              <Text style={styles.faqA}>{doc.content}</Text>
            </ScrollView>
          )}
          <TouchableOpacity onPress={onClose} style={styles.closeBtnContainer}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
});

// ── MenuItem ──────────────────────────────────────────────────────────────────
const MenuItem = ({ icon, label, value, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <Text style={styles.menuIcon}>{icon}</Text>
    <Text style={styles.menuLabel}>{label}</Text>
    <Text style={styles.menuValue}>{value || '›'}</Text>
  </TouchableOpacity>
);

// ── Main Screen ───────────────────────────────────────────────────────────────
const ProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const { mode } = useModeStore();
  const { seller, clearSeller } = useVendorStore();
  const [faqsVisible,         setFaqsVisible]         = useState(false);
  const [helpArticlesVisible, setHelpArticlesVisible] = useState(false);
  const [termsVisible,        setTermsVisible]        = useState(false);
  const [privacyVisible,      setPrivacyVisible]      = useState(false);
  const [aboutVisible,        setAboutVisible]        = useState(false);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <ModeToggle />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Avatar card */}
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.avatarCard}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(seller?.name || '').charAt(0)}</Text>
          </View>
          <View>
            <Text style={styles.vendorName}>{seller?.name}</Text>
            <Text style={styles.shopName}>{seller?.shopName}</Text>
            <Text style={styles.modeTag}>{mode === 'materials' ? '🧱 Material Seller' : '🏗️ Rental Provider'}</Text>
          </View>
        </LinearGradient>

        {/* Account Menu */}
        <View style={styles.menuCard}>
          <Text style={styles.menuSection}>Account</Text>
          <MenuItem icon="🏪" label="Shop Details"   />
          <MenuItem icon="📍" label="Service Area"   />
          <MenuItem icon="🏦" label="Bank Details"   />
          <MenuItem icon="📄" label="GST / Tax Info" />
        </View>

        {/* Settings Menu */}
        <View style={styles.menuCard}>
          <Text style={styles.menuSection}>{mode === 'materials' ? 'Seller Settings' : 'Rental Policy'}</Text>
          {mode === 'materials'
            ? <>
                <MenuItem icon="🚚" label="Delivery Options" />
                <MenuItem icon="↩️" label="Return Policy"    />
              </>
            : <>
                <MenuItem icon="💰" label="Deposit Terms"      />
                <MenuItem icon="📅" label="Min / Max Duration" />
                <MenuItem icon="🔧" label="Maintenance Policy" />
              </>
          }
        </View>

        {/* Support / Logout */}
        <View style={styles.menuCard}>
          <MenuItem icon="🔔" label="Notifications" />
          <MenuItem icon="❓" label="FAQs"          onPress={() => setFaqsVisible(true)} />
          <MenuItem icon="📖" label="Help Articles" onPress={() => setHelpArticlesVisible(true)} />
        </View>

        {/* Legal */}
        <View style={styles.menuCard}>
          <Text style={styles.menuSection}>Legal</Text>
          <MenuItem icon="📃" label="Terms & Conditions" onPress={() => setTermsVisible(true)} />
          <MenuItem icon="🔒" label="Privacy Policy"     onPress={() => setPrivacyVisible(true)} />
          <MenuItem icon="ℹ️" label="About Us"           onPress={() => setAboutVisible(true)} />
        </View>

        {/* Account Actions */}
        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={async () => {
              await logoutSeller();
              clearSeller();
            }}
          >
            <Text style={styles.menuIcon}>🚪</Text>
            <Text style={styles.menuLabel}>Logout</Text>
            <Text style={styles.menuValue}>›</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      <FAQsModal         visible={faqsVisible}         onClose={() => setFaqsVisible(false)} />
      <HelpArticlesModal visible={helpArticlesVisible} onClose={() => setHelpArticlesVisible(false)} />

      {/* Legal Modals */}
      <LegalModal
        visible={termsVisible}
        onClose={() => setTermsVisible(false)}
        title="Terms & Conditions"
        icon="📃"
        fieldKey="terms"
        fetcher={fetchVendorLegal}
      />
      <LegalModal
        visible={privacyVisible}
        onClose={() => setPrivacyVisible(false)}
        title="Privacy Policy"
        icon="🔒"
        fieldKey="privacy"
        fetcher={fetchVendorLegal}
      />
      <LegalModal
        visible={aboutVisible}
        onClose={() => setAboutVisible(false)}
        title="About Us"
        icon="ℹ️"
        fieldKey="about"
        fetcher={fetchAboutUs}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen:           { flex: 1, backgroundColor: colors.background },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle:      { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  scroll:           { paddingBottom: 40 },
  avatarCard:       { margin: 20, borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar:           { width: 60, height: 60, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  avatarText:       { fontSize: 28, fontWeight: '900', color: '#FFF' },
  vendorName:       { fontSize: 18, fontWeight: '900', color: '#FFF' },
  shopName:         { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginTop: 2 },
  modeTag:          { fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: '700', marginTop: 4 },
  menuCard:         { marginHorizontal: 20, marginBottom: 14, backgroundColor: colors.surface, borderRadius: 18, padding: 8, elevation: 2, shadowColor: colors.cardShadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6 },
  menuSection:      { fontSize: 11, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.8, paddingHorizontal: 12, paddingVertical: 8 },
  menuItem:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 12 },
  menuIcon:         { fontSize: 18, width: 28 },
  menuLabel:        { flex: 1, fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  menuValue:        { fontSize: 14, color: colors.textMuted },
  // ── Modals shared
  modalOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet:       { backgroundColor: colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
  modalHandle:      { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 20 },
  modalTitle:       { fontSize: 20, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', marginBottom: 20 },
  // ── Empty / Error state
  emptyState:       { alignItems: 'center', paddingVertical: 40 },
  emptyIcon:        { fontSize: 40, marginBottom: 12 },
  emptyText:        { fontSize: 14, color: colors.textMuted, textAlign: 'center', fontWeight: '500' },
  // ── FAQ
  faqSection:       { marginBottom: 16 },
  faqSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  faqSectionIcon:   { fontSize: 16 },
  faqSectionTitle:  { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  faqItem:          { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: 8 },
  faqQuestion:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  faqQ:             { fontSize: 13, fontWeight: '600', color: colors.textPrimary, flex: 1 },
  faqChevron:       { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  faqA:             { fontSize: 13, color: colors.textSecondary, lineHeight: 20, marginTop: 10 },
  // ── Article
  articleItem:      { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: 8 },
  articleHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  articleTitle:     { fontSize: 13, fontWeight: '700', color: colors.textPrimary, flex: 1 },
  articleContent:   { fontSize: 13, color: colors.textSecondary, lineHeight: 20, marginTop: 10 },
  // ── Close button
  closeBtnContainer: { marginTop: 8, paddingVertical: 12, alignItems: 'center' },
  closeBtnText:     { fontSize: 14, color: colors.textMuted, fontWeight: '600' },
});

export default ProfileScreen;