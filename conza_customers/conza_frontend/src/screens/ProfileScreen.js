import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import useAppStore from '../store/useAppStore';
import { SectionLoader } from '../components/LoadingState';
import { useAuth } from '../hooks/useAuth';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import SavedAddressSheet from '../components/SavedAddressSheet';
import { fetchCustomerFAQs, fetchCustomerHelpArticles } from '../api/faqHelpAPI';
import { fetchCustomerLegal, fetchAboutUs } from '../api/legalAPI';

// ── Sub-components ────────────────────────────────────────────────────────────

const StatCard = React.memo(({ value, label }) => (
  <View style={styles.statCard}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
));

const MenuItem = React.memo(({ icon, label, sub, danger, onPress }) => (
  <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={onPress}>
    <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
      <MaterialCommunityIcons
        name={icon}
        size={19}
        color={danger ? colors.danger : colors.accentAmber}
      />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[styles.menuLabel, danger && { color: colors.danger }]}>{label}</Text>
      {sub && <Text style={styles.menuSub}>{sub}</Text>}
    </View>
    {!danger && (
      <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
    )}
  </TouchableOpacity>
));

// ── Reusable empty / error state ───────────────────────────────────────────────

const StateBlock = React.memo(({ icon, iconColor, title, subtitle }) => (
  <View style={styles.emptyState}>
    <View style={styles.emptyStateIconWrap}>
      <MaterialCommunityIcons name={icon} size={30} color={iconColor || colors.textMuted} />
    </View>
    <Text style={styles.emptyStateText}>{title}</Text>
    {subtitle ? <Text style={styles.emptyStateSub}>{subtitle}</Text> : null}
  </View>
));

// ── Modal header (shared) ──────────────────────────────────────────────────────

const ModalHeader = React.memo(({ icon, title }) => (
  <View style={styles.modalHeaderRow}>
    <View style={styles.modalHeaderIcon}>
      <MaterialCommunityIcons name={icon} size={20} color={colors.accentAmber} />
    </View>
    <Text style={styles.modalTitle}>{title}</Text>
  </View>
));

// ── Orders Modal ──────────────────────────────────────────────────────────────

const OrdersModal = React.memo(({ visible, onClose }) => {
  const completedOrders        = useAppStore((s) => s.completedOrders);
  const completedOrdersLoading = useAppStore((s) => s.completedOrdersLoading);
  const fetchCompletedOrders   = useAppStore((s) => s.fetchCompletedOrders);

  React.useEffect(() => {
    if (visible) fetchCompletedOrders();
  }, [visible]);

  const formatLabel = (b) => {
    if (b.category) return `${b.category} Booking`;
    if (b.bookingType === 'material') return 'Material Order';
    if (b.bookingType === 'rental')   return 'Equipment Rental';
    return 'Booking';
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { maxHeight: '80%' }]}>
          <View style={styles.modalHandle} />
          <ModalHeader icon="clipboard-text-outline" title="My Orders" />
          {completedOrdersLoading ? (
            <ActivityIndicator color={colors.accentAmber} style={{ marginVertical: 32 }} />
          ) : completedOrders.length === 0 ? (
            <StateBlock
              icon="package-variant-closed"
              title="No completed orders yet"
              subtitle="Your finished bookings and orders will appear here."
            />
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {completedOrders.map((b) => (
                <View key={b._id} style={styles.orderCard}>
                  <View style={styles.orderCardTop}>
                    <Text style={styles.orderLabel}>{formatLabel(b)}</Text>
                    <View style={styles.orderBadge}>
                      <MaterialCommunityIcons name="check-circle" size={12} color={colors.success} />
                      <Text style={styles.orderBadgeText}>Completed</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    {b.city && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <MaterialCommunityIcons name="map-marker-outline" size={12} color={colors.textMuted} />
                        <Text style={styles.orderMeta}>{b.city}</Text>
                      </View>
                    )}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <MaterialCommunityIcons name="calendar-blank-outline" size={12} color={colors.textMuted} />
                      <Text style={styles.orderMeta}>
                        {new Date(b.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
});

// ── FAQs Modal ────────────────────────────────────────────────────────────────

const FAQsModal = React.memo(({ visible, onClose }) => {
  const [expanded, setExpanded] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!visible || fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    setError(null);
    fetchCustomerFAQs()
      .then((data) => {
        setSections(data.sections || []);
      })
      .catch(() => {
        setError('Failed to load FAQs. Please try again.');
      })
      .finally(() => setLoading(false));
  }, [visible]);

  const toggle = useCallback((key) => {
    setExpanded((prev) => (prev === key ? null : key));
  }, []);

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
                      <MaterialCommunityIcons name="folder-text-outline" size={14} color={colors.accentAmber} />
                    </View>
                    <Text style={styles.faqSectionTitle}>{section.title}</Text>
                  </View>
                  {section.items.map((item, idx) => {
                    const key = `${section.title}-${idx}`;
                    const open = expanded === key;
                    return (
                      <TouchableOpacity
                        key={key}
                        style={styles.faqItem}
                        activeOpacity={0.75}
                        onPress={() => toggle(key)}
                      >
                        <View style={styles.faqQuestion}>
                          <Text style={styles.faqQuestionText}>{item.q}</Text>
                          <MaterialCommunityIcons
                            name={open ? 'chevron-up' : 'chevron-down'}
                            size={18}
                            color={colors.textMuted}
                          />
                        </View>
                        {open && <Text style={styles.faqAnswer}>{item.a}</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
          )}
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>Close</Text>
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
              <Text style={styles.legalContentText}>{doc.content}</Text>
            </ScrollView>
          )}
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>Close</Text>
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
  const [expanded, setExpanded] = useState(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!visible || fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    setError(null);
    fetchCustomerHelpArticles()
      .then((data) => {
        setArticles(data.articles || []);
      })
      .catch(() => {
        setError('Failed to load help articles. Please try again.');
      })
      .finally(() => setLoading(false));
  }, [visible]);

  const toggle = useCallback((id) => {
    setExpanded((prev) => (prev === id ? null : id));
  }, []);

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
              {articles.map((article) => {
                const open = expanded === article._id;
                return (
                  <TouchableOpacity
                    key={article._id}
                    style={styles.articleItem}
                    activeOpacity={0.75}
                    onPress={() => toggle(article._id)}
                  >
                    <View style={styles.articleHeader}>
                      <Text style={styles.articleTitle}>{article.title}</Text>
                      <MaterialCommunityIcons
                        name={open ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={colors.textMuted}
                      />
                    </View>
                    {open && <Text style={styles.articleContent}>{article.content}</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
});

// ── Main Screen ───────────────────────────────────────────────────────────────

const ProfileScreen = () => {
  const userProfile             = useAppStore((s) => s.userProfile);
  const profileLoading          = useAppStore((s) => s.profileLoading);
  const derivedCompletedCount   = useAppStore((s) => s.derivedCompletedCount);
  const derivedActiveSitesCount = useAppStore((s) => s.derivedActiveSitesCount);
  const fetchCompletedOrders    = useAppStore((s) => s.fetchCompletedOrders);
  const insets                  = useSafeAreaInsets();
  const { logout, updateProfile, loading } = useAuth();

  const userLat          = useAppStore((s) => s.userLat);
  const userLng          = useAppStore((s) => s.userLng);
  const userLocationText = useAppStore((s) => s.userLocationText);

  React.useEffect(() => {
    if (userProfile) fetchCompletedOrders();
  }, [userProfile?._id]);

  const [editVisible,         setEditVisible]         = useState(false);
  const [ordersVisible,       setOrdersVisible]       = useState(false);
  const [faqsVisible,         setFaqsVisible]         = useState(false);
  const [helpArticlesVisible, setHelpArticlesVisible] = useState(false);
  const [termsVisible,        setTermsVisible]        = useState(false);
  const [privacyVisible,      setPrivacyVisible]      = useState(false);
  const [aboutVisible,        setAboutVisible]        = useState(false);
  const [addressVisible,      setAddressVisible]      = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', locationText: '' });
  const [updateError, setUpdateError] = useState(null);

  const openEdit = useCallback(() => {
    setUpdateError(null);
    setForm({
      fullName:     userProfile?.fullName || '',
      email:        userProfile?.email || '',
      locationText: userProfile?.locationText || '',
    });
    setEditVisible(true);
  }, [userProfile]);

  const handleUpdateProfile = useCallback(async () => {
    setUpdateError(null);
    const res = await updateProfile(form);
    if (res.success) {
      setEditVisible(false);
    } else {
      setUpdateError(res.error || 'Update failed. Please try again.');
    }
  }, [updateProfile, form]);

  const handleChatWithUs = useCallback(() => {
    const name  = userProfile?.fullName || '';
    const phone = userProfile?.phone || '';
    const body  = `Name: ${name}\nPhone: ${phone}\nIssue: `;
    const mailto = `mailto:nr.conza@gmail.com?subject=${encodeURIComponent('Conza Support Request')}&body=${encodeURIComponent(body)}`;
    Linking.openURL(mailto).catch(() =>
      Alert.alert('Unable to open mail app', 'Please email us at nr.conza@gmail.com')
    );
  }, [userProfile]);

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  if (profileLoading || !userProfile) return (
    <View style={[styles.safe, { paddingTop: insets.top + 10 }]}>
      <SectionLoader message="Loading profile..." />
    </View>
  );

  const u = userProfile;
  const initials = useMemo(() =>
    u.fullName?.split(' ').map((n) => n[0]).join('') || '??',
    [u.fullName]
  );

  return (
    <View style={[styles.safe, { paddingTop: insets.top + 10 }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <Text style={styles.screenHeading}>Profile</Text>

        {/* Avatar Section */}
        <LinearGradient
          colors={['rgba(245,200,66,0.1)', 'transparent']}
          style={styles.avatarSection}
        >
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            style={styles.avatar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.avatarInitials}>{initials}</Text>
          </LinearGradient>
          <Text style={styles.userName}>{u.fullName}</Text>
          <View style={styles.userPhoneRow}>
            <MaterialCommunityIcons name="phone-outline" size={13} color={colors.textSecondary} />
            <Text style={styles.userPhone}>{u.phone}</Text>
          </View>
          <TouchableOpacity style={styles.editBtn} activeOpacity={0.8} onPress={openEdit}>
            <MaterialCommunityIcons name="pencil-outline" size={14} color={colors.accentAmber} />
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard value={derivedCompletedCount ?? '—'} label="Completed" />
          <View style={styles.statDivider} />
          <StatCard value={derivedActiveSitesCount ?? '—'} label="Active Sites" />
          <View style={styles.statDivider} />
          <StatCard value={u.memberSince ?? '—'} label="Member Since" />
        </View>

        {/* Account Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <MenuItem icon="map-marker-outline" label="Saved Addresses" sub="Manage delivery addresses" onPress={() => setAddressVisible(true)} />
          <MenuItem icon="clipboard-text-outline" label="My Orders" sub="View completed bookings" onPress={() => setOrdersVisible(true)} />
        </View>

        {/* Support Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <MenuItem icon="help-circle-outline" label="FAQs" sub="Browse common questions" onPress={() => setFaqsVisible(true)} />
          <MenuItem icon="book-open-page-variant-outline" label="Help Articles" sub="Guides and how-to articles" onPress={() => setHelpArticlesVisible(true)} />
          <MenuItem icon="email-outline" label="Chat With Us" sub="Email our support team" onPress={handleChatWithUs} />
        </View>

        {/* Legal Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <MenuItem icon="file-document-outline" label="Terms & Conditions" sub="Customer terms of use" onPress={() => setTermsVisible(true)} />
          <MenuItem icon="shield-lock-outline" label="Privacy Policy" sub="How we handle your data" onPress={() => setPrivacyVisible(true)} />
          <MenuItem icon="information-outline" label="About Us" sub="Learn more about Conza" onPress={() => setAboutVisible(true)} />
        </View>

        <View style={styles.section}>
          <MenuItem icon="logout" label="Logout" danger onPress={handleLogout} />
        </View>

        <Text style={styles.version}>Conza v1.0.0</Text>
      </ScrollView>

      {/* Saved Addresses */}
      <SavedAddressSheet
        visible={addressVisible}
        onClose={() => setAddressVisible(false)}
        currentLat={userLat}
        currentLng={userLng}
        currentAddress={userLocationText}
      />

      {/* My Orders Modal */}
      <OrdersModal visible={ordersVisible} onClose={() => setOrdersVisible(false)} />

      {/* FAQs Modal */}
      <FAQsModal visible={faqsVisible} onClose={() => setFaqsVisible(false)} />

      {/* Help Articles Modal */}
      <HelpArticlesModal visible={helpArticlesVisible} onClose={() => setHelpArticlesVisible(false)} />

      {/* Legal Modals */}
      <LegalModal
        visible={termsVisible}
        onClose={() => setTermsVisible(false)}
        title="Terms & Conditions"
        icon="file-document-outline"
        fieldKey="terms"
        fetcher={fetchCustomerLegal}
      />
      <LegalModal
        visible={privacyVisible}
        onClose={() => setPrivacyVisible(false)}
        title="Privacy Policy"
        icon="shield-lock-outline"
        fieldKey="privacy"
        fetcher={fetchCustomerLegal}
      />
      <LegalModal
        visible={aboutVisible}
        onClose={() => setAboutVisible(false)}
        title="About Us"
        icon="information-outline"
        fieldKey="about"
        fetcher={fetchAboutUs}
      />

      {/* Edit Profile Modal */}
      <Modal visible={editVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <ModalHeader icon="pencil-outline" title="Edit Profile" />

            <ScrollView style={{ maxHeight: 400 }}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={form.fullName}
                  onChangeText={(v) => setForm((prev) => ({ ...prev, fullName: v }))}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={form.email}
                  onChangeText={(v) => setForm((prev) => ({ ...prev, email: v }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Location Address</Text>
                <TextInput
                  style={styles.input}
                  value={form.locationText}
                  onChangeText={(v) => setForm((prev) => ({ ...prev, locationText: v }))}
                  multiline
                />
              </View>
              {updateError ? (
                <Text style={styles.errorText}>{updateError}</Text>
              ) : null}
            </ScrollView>

            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              style={styles.saveBtn}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <TouchableOpacity style={styles.saveBtnTouch} onPress={handleUpdateProfile} disabled={loading}>
                {loading
                  ? <ActivityIndicator color="#000" />
                  : <Text style={styles.saveBtnText}>Save Changes</Text>}
              </TouchableOpacity>
            </LinearGradient>

            <TouchableOpacity onPress={() => setEditVisible(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingBottom: 40,
  },
  screenHeading: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    paddingHorizontal: 20,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: colors.accentAmber,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  userPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 18,
  },
  userPhone: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 22,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.accentAmber,
    backgroundColor: colors.accentAmberSoft,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accentAmber,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 14,
  },
  section: {
    marginTop: 24,
    marginHorizontal: 20,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    paddingTop: 4,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    gap: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuIconDanger: {
    backgroundColor: 'rgba(224,59,59,0.1)',
    borderColor: 'rgba(224,59,59,0.2)',
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  menuSub: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '400',
  },
  version: {
    textAlign: 'center',
    marginTop: 32,
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  // ── Modal shared
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 24,
  },
  modalHeaderIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.accentAmberSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  // ── Edit Profile
  inputGroup: { marginBottom: 18 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    fontSize: 15,
    color: colors.textPrimary,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: 8,
  },
  saveBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 12 },
  saveBtnTouch: { paddingVertical: 16, alignItems: 'center' },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  cancelBtn: { marginTop: 12, paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '600',
  },
  // ── Orders
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
  },
  orderCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  orderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(46,139,87,0.12)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  orderBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
  },
  orderMeta: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '400',
  },
  // ── Empty / Error state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  emptyStateIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textPrimary,
    textAlign: 'center',
    fontWeight: '600',
  },
  emptyStateSub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '400',
  },
  // ── FAQ
  faqSection: {
    marginBottom: 20,
  },
  faqSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  faqSectionIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: colors.accentAmberSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faqSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  faqItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 8,
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  faqQuestionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  faqAnswer: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: 10,
    fontWeight: '400',
  },
  // ── Help Articles
  articleItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 8,
  },
  articleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  articleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  articleContent: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: 10,
    fontWeight: '400',
  },
  // ── Legal (About / Terms / Privacy)
  legalMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  legalMetaText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  legalContentText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 21,
    fontWeight: '400',
  },
});

export default ProfileScreen;