import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useAppStore from '../store/useAppStore';
import { colors } from '../theme/colors';

const attachmentKey = (a) => `${a.refModel}:${a.refId}`;

const AttachmentRow = React.memo(({ item, selected, onToggle }) => (
  <TouchableOpacity style={styles.attachRow} onPress={onToggle} activeOpacity={0.75}>
    <View style={[styles.checkbox, selected && styles.checkboxOn]}>
      {selected && <MaterialCommunityIcons name="check" size={13} color={colors.white} />}
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.attachTitle} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.attachMeta}>
        {item.city ? `${item.city} • ` : ''}₹{item.total} • {item.status.replace(/_/g, ' ')}
      </Text>
    </View>
  </TouchableOpacity>
));

const CreateProjectScreen = ({ navigation }) => {
  const {
    attachableItems, attachableItemsLoading, fetchAttachableItems, createProject,
  } = useAppStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchAttachableItems(); }, []);

  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);

  const toggleAttachment = useCallback((attachment) => {
    setSelected((prev) => {
      const key = attachmentKey(attachment);
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = attachment;
      return next;
    });
  }, []);

  const selectedList = useMemo(() => Object.values(selected), [selected]);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      setError('Please give your project a name.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const attachments = selectedList.map((a) => ({ refModel: a.refModel, refId: a.refId }));
      const project = await createProject({ name, description, attachments });
      navigation.replace('ProjectDetail', { projectId: project._id });
    } catch (e) {
      setError(e.message || 'Could not create project. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [name, description, selectedList, createProject, navigation]);

  const labourBookings = attachableItems.labourBookings || [];
  const orders          = attachableItems.orders || [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleGoBack} activeOpacity={0.7}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Project</Text>
        <View style={{ width: 38 }} />
      </View>
      <View style={styles.divider} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Project Details</Text>
          <Text style={styles.label}>Project Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. New House Construction"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
          />
          <Text style={styles.label}>Description (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="A short note about this project"
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attach Labour Bookings</Text>
          {attachableItemsLoading ? (
            <ActivityIndicator color={colors.accentAmber} />
          ) : labourBookings.length === 0 ? (
            <Text style={styles.emptyHint}>No ongoing labour bookings to attach.</Text>
          ) : (
            labourBookings.map((item) => (
              <AttachmentRow
                key={attachmentKey(item)}
                item={item}
                selected={!!selected[attachmentKey(item)]}
                onToggle={() => toggleAttachment(item)}
              />
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attach Orders</Text>
          {attachableItemsLoading ? (
            <ActivityIndicator color={colors.accentAmber} />
          ) : orders.length === 0 ? (
            <Text style={styles.emptyHint}>No ongoing orders to attach.</Text>
          ) : (
            orders.map((item) => (
              <AttachmentRow
                key={attachmentKey(item)}
                item={item}
                selected={!!selected[attachmentKey(item)]}
                onToggle={() => toggleAttachment(item)}
              />
            ))
          )}
        </View>

        {!!error && <Text style={styles.errorText}>{error}</Text>}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity onPress={handleSave} disabled={submitting} activeOpacity={0.85}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveBtn}
          >
            {submitting ? (
              <ActivityIndicator color={colors.textPrimary} />
            ) : (
              <Text style={styles.saveBtnText}>Save Project</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  backArrow: { fontSize: 18, color: colors.textPrimary, fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  divider: { height: 1, backgroundColor: colors.borderLight },

  scroll: { paddingTop: 20, paddingHorizontal: 20, paddingBottom: 120 },

  section: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginBottom: 14 },
  label: {
    fontSize: 11, fontWeight: '600', color: colors.textSecondary,
    marginBottom: 6, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  textArea: { height: 80, paddingTop: 12, textAlignVertical: 'top' },

  attachRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.accentAmber, borderColor: colors.accentAmber },
  attachTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  attachMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2, fontWeight: '500', textTransform: 'capitalize' },
  emptyHint: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },

  errorText: { fontSize: 13, color: colors.danger, textAlign: 'center', marginBottom: 10, fontWeight: '500' },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingBottom: 28, paddingTop: 14,
    backgroundColor: colors.surface,
    borderTopWidth: 1, borderTopColor: colors.borderLight,
  },
  saveBtn: { borderRadius: 16, paddingVertical: 17, alignItems: 'center' },
  saveBtnText: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.3 },
});

export default CreateProjectScreen;
