import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, Modal, ScrollView,
  TouchableOpacity, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useAppStore from '../store/useAppStore';
import { colors } from '../theme/colors';

const getProjectStatusColor = (status) => {
  switch (status) {
    case 'in_progress': return '#3B82F6';
    case 'completed':   return '#10B981';
    case 'cancelled':   return '#EF4444';
    default:            return '#94A3B8';
  }
};

const ProjectRow = React.memo(({ project, onPress, disabled }) => {
  const color = getProjectStatusColor(project.status);
  const count = (project.attachments || []).length;
  return (
    <TouchableOpacity
      style={[styles.projectRow, disabled && styles.projectRowDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
    >
      <View style={[styles.projectDot, { backgroundColor: color }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.projectName} numberOfLines={1}>{project.name}</Text>
        <Text style={styles.projectMeta}>{count} item{count === 1 ? '' : 's'}</Text>
      </View>
      <MaterialCommunityIcons name="plus-circle-outline" size={22} color={colors.accentAmber} />
    </TouchableOpacity>
  );
});

// Bottom sheet used across the app for attaching a labour booking, material
// order, or rental order to a project — either an existing one or a brand
// new one created on the spot with this item pre-attached.
// `attachment` accepts either a single { refModel, refId, title } object
// (booking status cards, order detail) or an array of them (a multi-seller
// material checkout that created more than one order at once).
const AddToProjectSheet = ({ visible, attachment, onClose, onSuccess }) => {
  const {
    myProjects, myProjectsLoading, fetchMyProjects,
    addAttachmentToProject, createProject,
  } = useAppStore();

  const [mode, setMode]               = useState('list');
  const [name, setName]               = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy]               = useState(false);
  const [error, setError]             = useState('');

  const attachments = useMemo(() => {
    if (Array.isArray(attachment)) return attachment.filter(Boolean);
    return attachment ? [attachment] : [];
  }, [attachment]);

  useEffect(() => {
    if (visible) {
      setMode('list');
      setName('');
      setDescription('');
      setError('');
      fetchMyProjects();
    }
  }, [visible, fetchMyProjects]);

  const handleClose = useCallback(() => {
    if (busy) return;
    onClose();
  }, [busy, onClose]);

  const handleSelectProject = useCallback(async (project) => {
    if (!attachments.length || busy) return;
    setBusy(true);
    setError('');
    try {
      let updated = project;
      for (const a of attachments) {
        updated = await addAttachmentToProject(updated._id, { refModel: a.refModel, refId: a.refId });
      }
      onSuccess && onSuccess(updated, `Added to "${updated.name}"`);
      onClose();
    } catch (e) {
      setError(e.message || 'Could not add to this project. Please try again.');
    } finally {
      setBusy(false);
    }
  }, [attachments, busy, addAttachmentToProject, onSuccess, onClose]);

  const handleCreateProject = useCallback(async () => {
    if (!attachments.length || busy) return;
    if (!name.trim()) {
      setError('Please give your project a name.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const project = await createProject({
        name,
        description,
        attachments: attachments.map((a) => ({ refModel: a.refModel, refId: a.refId })),
      });
      onSuccess && onSuccess(project, `Created "${project.name}" and added item${attachments.length > 1 ? 's' : ''}`);
      onClose();
    } catch (e) {
      setError(e.message || 'Could not create the project. Please try again.');
    } finally {
      setBusy(false);
    }
  }, [attachments, busy, name, description, createProject, onSuccess, onClose]);

  const projects = myProjects || [];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.overlayTouch} activeOpacity={1} onPress={handleClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {mode === 'list' ? (
            <>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Add to Project</Text>
                {!!attachments.length && (
                  <Text style={styles.sheetSub} numberOfLines={1}>
                    {attachments.length === 1 ? attachments[0].title : `${attachments.length} items`}
                  </Text>
                )}
              </View>

              <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                {myProjectsLoading && !projects.length ? (
                  <ActivityIndicator color={colors.accentAmber} style={{ marginTop: 20 }} />
                ) : projects.length === 0 ? (
                  <Text style={styles.emptyHint}>
                    You don't have any projects yet. Create one below and this item will be attached to it.
                  </Text>
                ) : (
                  projects.map((project) => (
                    <ProjectRow
                      key={project._id}
                      project={project}
                      disabled={busy}
                      onPress={() => handleSelectProject(project)}
                    />
                  ))
                )}
              </ScrollView>

              {!!error && <Text style={styles.errorText}>{error}</Text>}

              <TouchableOpacity
                style={styles.newProjectBtn}
                onPress={() => { setError(''); setMode('create'); }}
                activeOpacity={0.85}
                disabled={busy}
              >
                <MaterialCommunityIcons name="plus" size={18} color={colors.textPrimary} />
                <Text style={styles.newProjectBtnText}>Create New Project</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.sheetHeader}>
                <TouchableOpacity onPress={() => { setError(''); setMode('list'); }} disabled={busy}>
                  <Text style={styles.backLink}>← Back</Text>
                </TouchableOpacity>
                <Text style={[styles.sheetTitle, { marginTop: 8 }]}>New Project</Text>
                {!!attachments.length && (
                  <Text style={styles.sheetSub} numberOfLines={1}>
                    Will attach: {attachments.length === 1 ? attachments[0].title : `${attachments.length} items`}
                  </Text>
                )}
              </View>

              <View style={styles.form}>
                <Text style={styles.label}>Project Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. New House Construction"
                  placeholderTextColor={colors.textMuted}
                  value={name}
                  onChangeText={setName}
                  editable={!busy}
                />
                <Text style={styles.label}>Description (optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="A short note about this project"
                  placeholderTextColor={colors.textMuted}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  editable={!busy}
                />
                {!!error && <Text style={styles.errorText}>{error}</Text>}

                <TouchableOpacity
                  style={styles.createBtn}
                  onPress={handleCreateProject}
                  activeOpacity={0.85}
                  disabled={busy}
                >
                  {busy ? (
                    <ActivityIndicator color={colors.textPrimary} />
                  ) : (
                    <Text style={styles.createBtnText}>Create & Attach</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(26,24,20,0.45)' },
  overlayTouch: { flex: 1 },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    maxHeight: '80%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetHeader: { marginBottom: 14 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  sheetSub: { fontSize: 12, color: colors.textMuted, marginTop: 4, fontWeight: '500' },
  backLink: { fontSize: 13, fontWeight: '700', color: colors.accentAmber },

  list: { maxHeight: 320, marginBottom: 6 },
  emptyHint: { fontSize: 13, color: colors.textMuted, fontWeight: '500', paddingVertical: 20, textAlign: 'center' },

  projectRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  projectRowDisabled: { opacity: 0.5 },
  projectDot: { width: 8, height: 8, borderRadius: 4 },
  projectName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  projectMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2, fontWeight: '500' },

  newProjectBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.accentYellow,
  },
  newProjectBtnText: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },

  form: { paddingTop: 4 },
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
  textArea: { height: 70, paddingTop: 12, textAlignVertical: 'top' },

  createBtn: {
    backgroundColor: colors.accentAmber,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  createBtnText: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },

  errorText: { fontSize: 12, color: colors.danger, marginBottom: 10, marginTop: 4, fontWeight: '600' },
});

export default AddToProjectSheet;
