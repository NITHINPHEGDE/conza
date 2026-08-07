import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useAppStore from '../store/useAppStore';
import { colors } from '../theme/colors';

const getStatusDisplay = (status) => {
  switch (status) {
    case 'in_progress':    return { text: 'In Progress',    color: '#3B82F6', icon: 'progress-clock' };
    case 'completed':      return { text: 'Completed',      color: '#10B981', icon: 'check-decagram' };
    case 'cancelled':      return { text: 'Cancelled',      color: '#EF4444', icon: 'close-circle'   };
    case 'no_attachments': return { text: 'No Attachments', color: '#94A3B8', icon: 'file-outline'   };
    default:                return { text: status,           color: '#6B7280', icon: 'help-circle'   };
  }
};

const attachmentKey = (a) => `${a.refModel}:${a.refId}`;

const AttachmentCard = React.memo(({ item, onRemove }) => {
  const s = getStatusDisplay(item.bucket === 'active' ? 'in_progress' : item.bucket);
  return (
    <View style={styles.attachCard}>
      <View style={[styles.attachAccent, { backgroundColor: s.color }]} />
      <View style={styles.attachBody}>
        <View style={styles.attachTop}>
          <MaterialCommunityIcons
            name={item.refModel === 'Booking' ? 'account-hard-hat' : (item.type === 'rental' ? 'hammer-wrench' : 'package-variant')}
            size={16}
            color={colors.textSecondary}
          />
          <Text style={styles.attachTitle} numberOfLines={1}>{item.title}</Text>
        </View>
        <Text style={styles.attachStatus}>{item.status.replace(/_/g, ' ')} • ₹{item.total}</Text>
      </View>
      <TouchableOpacity onPress={onRemove} style={styles.removeBtn} activeOpacity={0.7}>
        <MaterialCommunityIcons name="close" size={16} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
});

const PickerRow = React.memo(({ item, onAdd }) => (
  <TouchableOpacity style={styles.pickerRow} onPress={onAdd} activeOpacity={0.75}>
    <View style={{ flex: 1 }}>
      <Text style={styles.pickerTitle} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.pickerMeta}>{item.city ? `${item.city} • ` : ''}₹{item.total}</Text>
    </View>
    <MaterialCommunityIcons name="plus-circle-outline" size={22} color={colors.accentAmber} />
  </TouchableOpacity>
));

const ProjectDetailScreen = ({ route, navigation }) => {
  const { projectId } = route.params || {};
  const {
    myProjects, fetchMyProjects,
    attachableItems, fetchAttachableItems,
    addAttachmentToProject, removeAttachmentFromProject, deleteProject,
  } = useAppStore();

  const [showPicker, setShowPicker] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchMyProjects();
    fetchAttachableItems();
  }, []);

  const project = useMemo(
    () => (myProjects || []).find((p) => p._id === projectId),
    [myProjects, projectId]
  );

  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);

  const attachedKeys = useMemo(
    () => new Set((project?.attachments || []).map((a) => `${a.refModel}:${a.refId}`)),
    [project]
  );

  const pickableLabour = useMemo(
    () => (attachableItems.labourBookings || []).filter((i) => !attachedKeys.has(attachmentKey(i))),
    [attachableItems.labourBookings, attachedKeys]
  );
  const pickableOrders = useMemo(
    () => (attachableItems.orders || []).filter((i) => !attachedKeys.has(attachmentKey(i))),
    [attachableItems.orders, attachedKeys]
  );

  const handleAdd = useCallback(async (item) => {
    if (!project) return;
    setBusy(true);
    try {
      await addAttachmentToProject(project._id, { refModel: item.refModel, refId: item.refId });
    } catch (e) {
      Alert.alert('Could not add', e.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  }, [project, addAttachmentToProject]);

  const handleRemove = useCallback((attachmentId) => {
    if (!project) return;
    Alert.alert('Remove Attachment', 'Remove this from the project?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await removeAttachmentFromProject(project._id, attachmentId);
          } catch (e) {
            Alert.alert('Could not remove', e.message || 'Please try again.');
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  }, [project, removeAttachmentFromProject]);

  const handleDeleteProject = useCallback(() => {
    if (!project) return;
    Alert.alert('Delete Project', `Delete "${project.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await deleteProject(project._id);
            navigation.goBack();
          } catch (e) {
            Alert.alert('Could not delete', e.message || 'Please try again.');
            setBusy(false);
          }
        },
      },
    ]);
  }, [project, deleteProject, navigation]);

  if (!project) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleGoBack} activeOpacity={0.7}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Project</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator color={colors.accentAmber} />
        </View>
      </SafeAreaView>
    );
  }

  const s = getStatusDisplay(project.status);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleGoBack} activeOpacity={0.7}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{project.name}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={handleDeleteProject} activeOpacity={0.7}>
          <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.danger} />
        </TouchableOpacity>
      </View>
      <View style={styles.divider} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.statusBanner}>
          <View style={[styles.statusPill, { backgroundColor: `${s.color}1A` }]}>
            <MaterialCommunityIcons name={s.icon} size={16} color={s.color} />
            <Text style={[styles.statusPillText, { color: s.color }]}>{s.text}</Text>
          </View>
          {!!project.description && <Text style={styles.description}>{project.description}</Text>}
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Attachments ({(project.attachments || []).length})</Text>
          <TouchableOpacity onPress={() => setShowPicker((v) => !v)} activeOpacity={0.8}>
            <Text style={styles.addLink}>{showPicker ? 'Close' : '+ Add'}</Text>
          </TouchableOpacity>
        </View>

        {(project.attachments || []).length === 0 ? (
          <Text style={styles.emptyHint}>No attachments yet. Tap "+ Add" to attach a labour booking or order.</Text>
        ) : (
          (project.attachments || []).map((item) => (
            <AttachmentCard
              key={item.attachmentId}
              item={item}
              onRemove={() => handleRemove(item.attachmentId)}
            />
          ))
        )}

        {showPicker && (
          <View style={styles.pickerSection}>
            <Text style={styles.pickerSectionTitle}>Labour Bookings</Text>
            {pickableLabour.length === 0 ? (
              <Text style={styles.emptyHint}>No more ongoing labour bookings.</Text>
            ) : (
              pickableLabour.map((item) => (
                <PickerRow key={attachmentKey(item)} item={item} onAdd={() => handleAdd(item)} />
              ))
            )}
            <Text style={[styles.pickerSectionTitle, { marginTop: 14 }]}>Orders</Text>
            {pickableOrders.length === 0 ? (
              <Text style={styles.emptyHint}>No more ongoing orders.</Text>
            ) : (
              pickableOrders.map((item) => (
                <PickerRow key={attachmentKey(item)} item={item} onAdd={() => handleAdd(item)} />
              ))
            )}
          </View>
        )}
      </ScrollView>

      {busy && (
        <View style={styles.busyOverlay}>
          <ActivityIndicator color={colors.accentAmber} />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    gap: 10,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  backArrow: { fontSize: 18, color: colors.textPrimary, fontWeight: '600' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' },
  divider: { height: 1, backgroundColor: colors.borderLight },

  scroll: { paddingTop: 20, paddingHorizontal: 20, paddingBottom: 40 },

  statusBanner: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 10,
  },
  statusPillText: { fontSize: 12, fontWeight: '700' },
  description: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, fontWeight: '500' },

  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  addLink: { fontSize: 13, fontWeight: '700', color: colors.accentAmber },

  emptyHint: { fontSize: 13, color: colors.textMuted, fontWeight: '500', marginBottom: 12 },

  attachCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  attachAccent: { width: 4 },
  attachBody: { flex: 1, padding: 12 },
  attachTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  attachTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, flex: 1 },
  attachStatus: { fontSize: 12, color: colors.textMuted, fontWeight: '500', textTransform: 'capitalize' },
  removeBtn: { width: 38, alignItems: 'center', justifyContent: 'center' },

  pickerSection: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    padding: 14,
    marginTop: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickerSectionTitle: {
    fontSize: 12, fontWeight: '700', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
  },
  pickerRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  pickerTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  pickerMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2, fontWeight: '500' },

  busyOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(250,250,247,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
});

export default ProjectDetailScreen;
