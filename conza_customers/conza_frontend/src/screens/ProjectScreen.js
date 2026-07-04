import React, { useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  StatusBar, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import SectionHeader from '../components/SectionHeader';
import useAppStore from '../store/useAppStore';
import { ErrorState, EmptyState } from '../components/LoadingState';
import { SkeletonList, ProjectCardSkeleton } from '../components/Skeleton';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const ProgressBar = React.memo(({ progress }) => {
  const fillStyle = useMemo(() => [
    styles.progressFill, 
    { width: `${progress}%` }
  ], [progress]);

  return (
    <View style={styles.progressTrack}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={fillStyle}
      />
    </View>
  );
});

const ProjectCard = React.memo(({ item, onPress }) => {
  const handlePress = useCallback(() => {
    onPress && onPress(item);
  }, [onPress, item]);

  const chipStyle = useMemo(() => [
    styles.statusChip, 
    { backgroundColor: item.statusColor + '18' }
  ], [item.statusColor]);

  const dotStyle = useMemo(() => [
    styles.statusDot, 
    { backgroundColor: item.statusColor }
  ], [item.statusColor]);

  const textStyle = useMemo(() => [
    styles.statusText, 
    { color: item.statusColor }
  ], [item.statusColor]);

  return (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.8}
      onPress={handlePress}
    >
      <View style={styles.cardHeader}>
        <View style={chipStyle}>
          <View style={dotStyle} />
          <Text style={textStyle}>{item.status}</Text>
        </View>
        <Text style={styles.workers}>👷 {item.workers}</Text>
      </View>

      <Text style={styles.projectName}>{item.name}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 }}>
        <MaterialCommunityIcons name="map-marker" size={13} color={colors.textMuted} />
        <Text style={[styles.location, { marginBottom: 0 }]}>{item.location}</Text>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressLabel}>
          <Text style={styles.progressTitle}>Progress</Text>
          <Text style={styles.progressPercent}>{item.progress}%</Text>
        </View>
        <ProgressBar progress={item.progress} />
      </View>

      <View style={styles.dateRow}>
        <View style={styles.dateItem}>
          <Text style={styles.dateLabel}>Started</Text>
          <Text style={styles.dateValue}>{item.startDate}</Text>
        </View>
        <View style={styles.dateDivider} />
        <View style={styles.dateItem}>
          <Text style={styles.dateLabel}>ETA</Text>
          <Text style={styles.dateValue}>{item.eta}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const ProjectScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const projects        = useAppStore((s) => s.projects);
  const projectsLoading = useAppStore((s) => s.projectsLoading);
  const fetchProjects   = useAppStore((s) => s.fetchProjects);

  const handleProjectPress = useCallback((item) => {
    navigation.navigate('ProjectDetail', { project: item });
  }, [navigation]);

  const renderItem = useCallback(({ item }) => (
    <ProjectCard item={item} onPress={handleProjectPress} />
  ), [handleProjectPress]);

  const listHeader = useMemo(() => (
    <SectionHeader title={`${projects.length} Sites`} />
  ), [projects.length]);

  const listEmpty = useMemo(() => (
    <EmptyState emoji="📋" title="No projects yet" subtitle="Your active construction sites will appear here" />
  ), []);

  if (projectsLoading) return (
    <View style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Projects</Text>
      </View>
      <View style={{ paddingTop: 8 }}>
        <SkeletonList component={ProjectCardSkeleton} count={4} />
      </View>
    </View>
  );

  return (
    <View style={[styles.safe, { paddingTop: insets.top + 10 }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Projects</Text>
        <TouchableOpacity style={styles.addBtn} activeOpacity={0.8}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.addBtnGrad}
          >
            <Text style={styles.addBtnText}>+ New</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
      />
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
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  addBtn: { borderRadius: 11, overflow: 'hidden' },
  addBtnGrad: { paddingHorizontal: 16, paddingVertical: 8 },
  addBtnText: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  list: { paddingTop: 16, paddingBottom: 30, paddingHorizontal: 20 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },
  workers: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  projectName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  location: { fontSize: 12, color: colors.textMuted, marginBottom: 16, fontWeight: '500' },
  progressSection: { marginBottom: 16 },
  progressLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressTitle: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  progressPercent: { fontSize: 12, color: colors.textPrimary, fontWeight: '700' },
  progressTrack: {
    height: 6,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 10 },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  dateItem: { flex: 1, alignItems: 'center' },
  dateLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  dateValue: { fontSize: 13, color: colors.textPrimary, fontWeight: '700' },
  dateDivider: { width: 1, height: 32, backgroundColor: colors.borderLight },
});

export default ProjectScreen;