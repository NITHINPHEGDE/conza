import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useModeStore    from '../store/useModeStore';
import useVendorStore  from '../store/useVendorStore';
import ModeToggle      from '../components/ModeToggle';
import { colors }      from '../theme/colors';
import { logoutSeller } from '../services/authService';
import { fetchVendorFAQs, fetchVendorHelpArticles } from '../services/faqHelpService';
import { fetchVendorLegal, fetchAboutUs } from '../services/legalService';

// ── Shared Modal Header ────────────────────────────────────────────────────────
const ModalHeader = React.memo(({ icon, title }) => (
  <View style={styles.modalHeaderRow}>
    <View style={styles.modalHeaderIcon}>
      <MaterialCommunityIcons name={icon} size={19} color={colors.accentAmber} />
    </View>
    <Text style={styles.modalTitle}>{title}</Text>
  </View>
));

// ── Shared Empty / Error State ─────────────────────────────────────────────────
const StateBlock = React.memo(({ icon, iconColor, title }) => (
  <View style={styles.emptyState}>
    <View style={styles.emptyIconWrap}>
      <MaterialCommunityIcons name={icon} size={28} color={iconColor || colors.textMuted} />
    </View>
    <Text style={styles.emptyText}>{title}</Text>
  </View>
));

// ── FAQ Item ──────────────────────────────────────────────────────────────────
const FAQItem = React.memo(({ q, a }) => {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  return (
    <TouchableOpacity style={styles.faqItem} onPress={toggle} activeOpacity={0.8}>
      <View style={styles.faqQuestion}>
        <Text style={styles.faqQ}>{q}</Text>
        <MaterialCommunityIcons name={open ? 'chevron-up' : 'chevron-down'} size={17} color={colors.textMuted} />
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
        <MaterialCommunityIcons name={open ? 'chevron-up' : 'chevron-down'} size={17} color={colors.textMuted} />
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
          <ModalHeader icon="help-circle-outline" title="FAQs" />
          {loading ? (
            <ActivityIndicator color={colors.accentAmber} style={{ marginVertical: 32 }} />
          ) : error ? (
            <StateBlock icon="alert-circle-outline" iconColor={colors.danger} title={error} />
          ) : sections.length === 0 ? (
            <StateBlock icon="help-circle-outline" title="No FAQs available yet." />
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {sections.map((section) => (
                <View key={section.title} style={styles.faqSection}>
                  <View style={styles.faqSectionHeader}>
                    <View style={styles.faqSectionIconWrap}>
                      <MaterialCommunityIcons name="folder-text-outline" size={13} color={colors.accentAmber} />
                    </View>
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
          <ModalHeader icon="book-open-page-variant-outline" title="Help Articles" />
          {loading ? (
            <ActivityIndicator color={colors.accentAmber} style={{ marginVertical: 32 }} />
          ) : error ? (
            <StateBlock icon="alert-circle-outline" iconColor={colors.danger} title={error} />
          ) : articles.length === 0 ? (
            <StateBlock icon="book-open-page-variant-outline" title="No help articles available yet." />
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
          <ModalHeader icon={icon} title={title} />
          {loading ? (
            <ActivityIndicator color={colors.accentAmber} style={{ marginVertical: 32 }} />
          ) : error ? (
            <StateBlock icon="alert-circle-outline" iconColor={colors.danger} title={error} />
          ) : !doc ? (
            <StateBlock icon={icon} title="Content not available yet." />
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {doc.updatedAt && (
                <View style={styles.legalMetaRow}>
                  <MaterialCommunityIcons name="clock-outline" size={12} color={colors.textMuted} />
                  <Text style={styles.legalMetaText}>
                    Last updated {new Date(doc.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
              )}
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
const MenuItem = ({ icon, label, sub, danger, value, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.75}>
    <View style={[styles.menuIconWrap, danger && styles.menuIconDanger]}>
      <MaterialCommunityIcons name={icon} size={18} color={danger ? colors.danger : colors.accentAmber} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[styles.menuLabel, danger && { color: colors.danger }]}>{label}</Text>
      {sub ? <Text style={styles.menuSub}>{sub}</Text> : null}
    </View>
    {!danger && (
      value
        ? <Text style={styles.menuValue}>{value}</Text>
        : <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
    )}
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
          <View style={{ flex: 1 }}>
            <Text style={styles.vendorName}>{seller?.name}</Text>
            <Text style={styles.shopName}>{seller?.shopName}</Text>
            <View style={styles.modeTagRow}>
              <MaterialCommunityIcons
                name={mode === 'materials' ? 'package-variant-closed' : 'toolbox-outline'}
                size={12}
                color="#FFF"
              />
              <Text style={styles.modeTag}>
                {mode === 'materials' ? 'Material Seller' : 'Rental Provider'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Account Menu */}
        <View style={styles.menuCard}>
          <Text style={styles.menuSection}>Account</Text>
          <MenuItem icon="storefront-outline"      label="Shop Details"   />
          <MenuItem icon="map-marker-outline"       label="Service Area"   />
          <MenuItem icon="bank-outline"             label="Bank Details"   />
          <MenuItem icon="file-document-outline"    label="GST / Tax Info" />
        </View>

        {/* Settings Menu */}
        <View style={styles.menuCard}>
          <Text style={styles.menuSection}>{mode === 'materials' ? 'Seller Settings' : 'Rental Policy'}</Text>
          {mode === 'materials'
            ? <>
                <MenuItem icon="truck-outline" label="Delivery Options" />
                <MenuItem icon="undo"          label="Return Policy"    />
              </>
            : <>
                <MenuItem icon="cash-multiple"     label="Deposit Terms"      />
                <MenuItem icon="calendar-range"    label="Min / Max Duration" />
                <MenuItem icon="wrench-outline"    label="Maintenance Policy" />
              </>
          }
        </View>

        {/* Support / Logout */}
        <View style={styles.menuCard}>
          <MenuItem icon="bell-outline"                    label="Notifications" />
          <MenuItem icon="help-circle-outline"              label="FAQs"          onPress={() => setFaqsVisible(true)} />
          <MenuItem icon="book-open-page-variant-outline"   label="Help Articles" onPress={() => setHelpArticlesVisible(true)} />
        </View>

        {/* Legal */}
        <View style={styles.menuCard}>
          <Text style={styles.menuSection}>Legal</Text>
          <MenuItem icon="file-document-outline" label="Terms & Conditions" onPress={() => setTermsVisible(true)} />
          <MenuItem icon="lock-outline"           label="Privacy Policy"     onPress={() => setPrivacyVisible(true)} />
          <MenuItem icon="information-outline"    label="About Us"           onPress={() => setAboutVisible(true)} />
        </View>

        {/* Account Actions */}
        <View style={styles.menuCard}>
          <MenuItem
            icon="logout"
            label="Logout"
            danger
            onPress={async () => {
              await logoutSeller();
              clearSeller();
            }}
          />
        </View>

      </ScrollView>

      <FAQsModal         visible={faqsVisible}         onClose={() => setFaqsVisible(false)} />
      <HelpArticlesModal visible={helpArticlesVisible} onClose={() => setHelpArticlesVisible(false)} />

      {/* Legal Modals */}
      <LegalModal
        visible={termsVisible}
        onClose={() => setTermsVisible(false)}
        title="Terms & Conditions"
        icon="file-document-outline"
        fieldKey="terms"
        fetcher={fetchVendorLegal}
      />
      <LegalModal
        visible={privacyVisible}
        onClose={() => setPrivacyVisible(false)}
        title="Privacy Policy"
        icon="lock-outline"
        fieldKey="privacy"
        fetcher={fetchVendorLegal}
      />
      <LegalModal
        visible={aboutVisible}
        onClose={() => setAboutVisible(false)}
        title="About Us"
        icon="information-outline"
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
  shopName:         { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '600', marginTop: 2 },
  modeTagRow:       { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  modeTag:          { fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: '700' },
  menuCard:         { marginHorizontal: 20, marginBottom: 14, backgroundColor: colors.surface, borderRadius: 18, padding: 8, elevation: 2, shadowColor: colors.cardShadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6 },
  menuSection:      { fontSize: 11, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: 12, paddingVertical: 8 },
  menuItem:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 12 },
  menuIconWrap:     { width: 36, height: 36, borderRadius: 11, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  menuIconDanger:   { backgroundColor: 'rgba(224,59,59,0.1)', borderColor: 'rgba(224,59,59,0.2)' },
  menuLabel:        { flex: 1, fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  menuValue:        { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  version:          { textAlign: 'center', marginTop: 12, fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  // ── Modals shared
  modalOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet:       { backgroundColor: colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
  modalHandle:      { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 20 },
  modalHeaderRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 22 },
  modalHeaderIcon:  { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.accentAmberSoft, alignItems: 'center', justifyContent: 'center' },
  modalTitle:       { fontSize: 18, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' },
  // ── Empty / Error state
  emptyState:       { alignItems: 'center', paddingVertical: 36 },
  emptyIconWrap:    { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyText:        { fontSize: 14, color: colors.textPrimary, textAlign: 'center', fontWeight: '600' },
  // ── FAQ
  faqSection:       { marginBottom: 16 },
  faqSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  faqSectionIconWrap: { width: 22, height: 22, borderRadius: 6, backgroundColor: colors.accentAmberSoft, alignItems: 'center', justifyContent: 'center' },
  faqSectionTitle:  { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  faqItem:          { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: 8 },
  faqQuestion:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  faqQ:             { fontSize: 13, fontWeight: '600', color: colors.textPrimary, flex: 1 },
  faqA:             { fontSize: 13, color: colors.textSecondary, lineHeight: 20, marginTop: 10 },
  // ── Article
  articleItem:      { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: 8 },
  articleHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  articleTitle:     { fontSize: 13, fontWeight: '700', color: colors.textPrimary, flex: 1 },
  articleContent:   { fontSize: 13, color: colors.textSecondary, lineHeight: 20, marginTop: 10 },
  // ── Legal
  legalMetaRow:     { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  legalMetaText:    { fontSize: 11, color: colors.textMuted, fontWeight: '500' },
  // ── Close button
  closeBtnContainer: { marginTop: 8, paddingVertical: 12, alignItems: 'center' },
  closeBtnText:     { fontSize: 14, color: colors.textMuted, fontWeight: '600' },
});

export default ProfileScreen;