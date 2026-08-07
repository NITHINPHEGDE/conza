import React, { useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import useAppStore from '../store/useAppStore';
import { colors } from '../theme/colors';
import { SkeletonList, ProjectCardSkeleton } from '../components/Skeleton';

const getProjectStatusDisplay = (status) => {
  switch (status) {
    case 'in_progress':    return { text: 'In Progress',     color: '#3B82F6', icon: 'progress-clock' };
    case 'completed':      return { text: 'Completed',       color: '#10B981', icon: 'check-decagram' };
    case 'cancelled':      return { text: 'Cancelled',       color: '#EF4444', icon: 'close-circle'   };
    case 'no_attachments': return { text: 'No Attachments',  color: '#94A3B8', icon: 'file-outline'   };
    default:                return { text: status,            color: '#6B7280', icon: 'help-circle'   };
  }
};

const ProjectCard = React.memo(({ project, onPress }) => {
  const s = getProjectStatusDisplay(project.status);
  const bookingCount = (project.attachments || []).filter((a) => a.refModel === 'Booking').length;
  const orderCount    = (project.attachments || []).filter((a) => a.refModel === 'SellerOrder').length;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.cardAccent, { backgroundColor: s.color }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={styles.statusPill}>
            <MaterialCommunityIcons name={s.icon} size={14} color={s.color} />
            <Text style={[styles.statusPillText, { color: s.color }]}>{s.text}</Text>
          </View>
          <Text style={styles.dateText}>
            {new Date(project.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
          </Text>
        </View>
        <Text style={styles.projectName} numberOfLines={1}>{project.name}</Text>
        {!!project.description && (
          <Text style={styles.projectDesc} numberOfLines={2}>{project.description}</Text>
        )}
        <View style={styles.attachRow}>
          <View style={styles.attachChip}>
            <MaterialCommunityIcons name="account-hard-hat" size={13} color={colors.textSecondary} />
            <Text style={styles.attachChipText}>{bookingCount} Labour</Text>
          </View>
          <View style={styles.attachChip}>
            <MaterialCommunityIcons name="package-variant" size={13} color={colors.textSecondary} />
            <Text style={styles.attachChipText}>{orderCount} Orders</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const ProjectsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { myProjects, myProjectsLoading, fetchMyProjects } = useAppStore();

  useEffect(() => { fetchMyProjects(); }, []);

  const onRefresh = useCallback(() => { fetchMyProjects(); }, [fetchMyProjects]);

  const handleCreate = useCallback(() => {
    navigation.navigate('CreateProject');
  }, [navigation]);

  const handleOpen = useCallback((project) => {
    navigation.navigate('ProjectDetail', { projectId: project._id });
  }, [navigation]);

  const sortedProjects = useMemo(
    () => [...(myProjects || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [myProjects]
  );

  return (
    <View style={[styles.safe, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Projects</Text>
        <TouchableOpacity onPress={handleCreate} activeOpacity={0.85}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.newBtn}
          >
            <MaterialCommunityIcons name="plus" size={16} color={colors.textPrimary} />
            <Text style={styles.newBtnText}>New</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {myProjectsLoading && !sortedProjects.length ? (
        <View style={{ paddingTop: 8 }}>
          <SkeletonList component={ProjectCardSkeleton} count={3} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={myProjectsLoading} onRefresh={onRefresh} colors={[colors.accentAmber]} />
          }
        >
          {sortedProjects.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="briefcase-outline" size={52} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No Projects Yet</Text>
              <Text style={styles.emptySub}>
                Create a project and attach your ongoing labour bookings and orders to track them together.
              </Text>
              <TouchableOpacity onPress={handleCreate} activeOpacity={0.85} style={{ marginTop: 18 }}>
                <LinearGradient
                  colors={[colors.gradientStart, colors.gradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.emptyCreateBtn}
                >
                  <Text style={styles.emptyCreateBtnText}>Create Your First Project</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            sortedProjects.map((project) => (
              <ProjectCard key={project._id} project={project} onPress={() => handleOpen(project)} />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  newBtnText: { fontSize: 13, fontWeight: '800', color: colors.textPrimary },

  scrollContent: { padding: 16, paddingBottom: 40 },

  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardAccent: { width: 5 },
  cardBody:   { flex: 1, padding: 14 },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  dateText: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  projectName: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginBottom: 4 },
  projectDesc: { fontSize: 12, color: colors.textSecondary, marginBottom: 10, lineHeight: 17 },
  attachRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  attachChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  attachChipText: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 90, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginTop: 16, marginBottom: 6 },
  emptySub: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19, fontWeight: '500' },
  emptyCreateBtn: { borderRadius: 14, paddingHorizontal: 22, paddingVertical: 14 },
  emptyCreateBtnText: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
});

export default ProjectsScreen;
