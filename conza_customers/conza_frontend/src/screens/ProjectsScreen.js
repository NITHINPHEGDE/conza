import React, { useEffect, useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Image,
  Modal,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useAppStore from '../store/useAppStore';
import AddToProjectSheet from '../components/AddToProjectSheet';

const defaultProjectImage = require('../../assets/images/project_default.jpg');
const renovationProjectImage = require('../../assets/images/project_renovation.jpg');

const FILTER_TABS = [
  { key: 'all', label: 'All Projects', hasIcon: true },
  { key: 'in_progress', label: 'In Progress', dotColor: '#F59E0B' },
  { key: 'completed', label: 'Completed', dotColor: '#10B981' },
  { key: 'on_hold', label: 'On Hold', dotColor: '#3B82F6' },
  { key: 'archived', label: 'Archived', dotColor: '#94A3B8' },
];

const timeAgo = (date) => {
  if (!date) return 'recently';
  const sec = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
};

const ProjectsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const {
    myProjects,
    myProjectsLoading,
    fetchMyProjects,
    deleteProject,
    updateProject,
    labourBookings,
    fetchLabourBookings,
    sellerOrders,
    fetchMySellerOrders,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent'); // 'recent' | 'budget_high' | 'budget_low'
  const [showSortModal, setShowSortModal] = useState(false);
  const [actionProject, setActionProject] = useState(null); // For 3-dots menu
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showUnassignedModal, setShowUnassignedModal] = useState(false);
  const [selectedUnassignedItem, setSelectedUnassignedItem] = useState(null);
  const [showAddToProjectSheet, setShowAddToProjectSheet] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchMyProjects();
      fetchLabourBookings();
      fetchMySellerOrders();
    }, [fetchMyProjects, fetchLabourBookings, fetchMySellerOrders])
  );

  const onRefresh = useCallback(async () => {
    await Promise.all([
      fetchMyProjects(),
      fetchLabourBookings(),
      fetchMySellerOrders(),
    ]);
  }, [fetchMyProjects, fetchLabourBookings, fetchMySellerOrders]);

  // Real aggregate statistics calculation
  const stats = useMemo(() => {
    const projects = myProjects || [];
    let totalSpent = 0;
    let totalOrders = (sellerOrders || []).filter((o) => o.orderType === 'material').length;
    let labourBookingsCount = (labourBookings || []).length;
    let rentalsCount = (sellerOrders || []).filter((o) => o.orderType === 'rental').length;

    // Calculate total spent from all project attachments and raw bookings/orders
    const ordersSpent = (sellerOrders || []).reduce((s, o) => s + (o.total || 0), 0);
    const labourSpent = (labourBookings || []).reduce((s, b) => s + (b.total || 0), 0);
    totalSpent = ordersSpent + labourSpent;

    return {
      totalSpent,
      totalOrders,
      labourBookings: labourBookingsCount,
      rentals: rentalsCount,
    };
  }, [myProjects, sellerOrders, labourBookings]);

  // Real unassigned bookings & orders
  const unassignedItems = useMemo(() => {
    const assignedBookingIds = new Set();
    const assignedOrderIds = new Set();

    (myProjects || []).forEach((p) => {
      (p.attachments || []).forEach((a) => {
        const id = (a.refId?._id || a.refId || '').toString();
        if (a.refModel === 'Booking') assignedBookingIds.add(id);
        if (a.refModel === 'SellerOrder') assignedOrderIds.add(id);
      });
    });

    const unassignedBookings = (labourBookings || [])
      .filter((b) => !assignedBookingIds.has(b._id.toString()))
      .map((b) => ({
        _id: b._id,
        refModel: 'Booking',
        title: `${b.category || 'Labour'} Booking`,
        subtitle: b.area ? `${b.area}, ${b.city}` : (b.city || 'Bengaluru'),
        total: b.total || 0,
        status: b.status,
        date: b.createdAt,
        type: 'labour',
      }));

    const unassignedOrdersList = (sellerOrders || [])
      .filter((o) => !assignedOrderIds.has(o._id.toString()))
      .map((o) => ({
        _id: o._id,
        refModel: 'SellerOrder',
        title: (o.items || []).map((i) => i.title || i.name).filter(Boolean).join(', ') ||
          (o.orderType === 'rental' ? 'Equipment Rental' : 'Material Order'),
        subtitle: o.sellerName || o.shopName || (o.city || 'Bengaluru'),
        total: o.total || 0,
        status: o.status,
        date: o.createdAt,
        type: o.orderType || 'material',
      }));

    return [...unassignedBookings, ...unassignedOrdersList];
  }, [myProjects, labourBookings, sellerOrders]);

  // Filtered and sorted projects
  const filteredProjects = useMemo(() => {
    let list = [...(myProjects || [])];

    // Status filter
    if (activeFilter !== 'all') {
      list = list.filter((p) => {
        const custom = p.customStatus || '';
        if (activeFilter === 'in_progress') return p.status === 'in_progress' || custom === 'in_progress' || !custom;
        if (activeFilter === 'completed') return p.status === 'completed' || custom === 'completed';
        if (activeFilter === 'on_hold') return custom === 'on_hold';
        if (activeFilter === 'archived') return custom === 'archived';
        return true;
      });
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          (p.name || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          (p.location || '').toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortBy === 'recent') {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'budget_high') {
      list.sort((a, b) => (b.budget || 0) - (a.budget || 0));
    } else if (sortBy === 'budget_low') {
      list.sort((a, b) => (a.budget || 0) - (b.budget || 0));
    }

    return list;
  }, [myProjects, activeFilter, searchQuery, sortBy]);

  const handleOpenProject = (project) => {
    navigation.navigate('ProjectDetail', { projectId: project._id });
  };

  const handleCreateProject = () => {
    navigation.navigate('CreateProject');
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    setDeleting(true);
    try {
      await deleteProject(projectToDelete._id);
      setProjectToDelete(null);
      setActionProject(null);
    } catch (e) {
      const msg = e?.response?.data?.message || e.message || 'Could not delete project';
      Alert.alert('Error', msg);
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdateStatus = async (statusKey) => {
    if (!actionProject) return;
    try {
      await updateProject(actionProject._id, { customStatus: statusKey });
      setActionProject(null);
    } catch (e) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleAssignUnassignedItem = (item) => {
    setSelectedUnassignedItem({
      refModel: item.refModel,
      refId: item._id,
      title: item.title,
    });
    setShowUnassignedModal(false);
    setShowAddToProjectSheet(true);
  };

  return (
    <View style={[styles.screen, { paddingTop: Math.max(insets.top, 12) + 6 }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTextCol}>
          <Text style={styles.headerTitle}>My Projects</Text>
          <Text style={styles.headerSubtitle}>Track and manage all your construction projects in one place.</Text>
        </View>
        <TouchableOpacity style={styles.newProjectBtn} onPress={handleCreateProject} activeOpacity={0.85}>
          <MaterialCommunityIcons name="plus" size={16} color="#0F172A" />
          <Text style={styles.newProjectBtnText}>New Project</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={myProjectsLoading}
            onRefresh={onRefresh}
            colors={['#F59E0B']}
            tintColor="#F59E0B"
          />
        }
      >
        {/* Search & Filter Row */}
        <View style={styles.searchRow}>
          <View style={styles.searchWrapper}>
            <MaterialCommunityIcons name="magnify" size={20} color="#94A3B8" style={{ marginRight: 6 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search projects..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialCommunityIcons name="close-circle" size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.filterIconButton}
            onPress={() => setShowSortModal(true)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="tune-variant" size={18} color="#1E293B" />
          </TouchableOpacity>
        </View>

        {/* Filter Chips Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsScroll}
        >
          {FILTER_TABS.map((tab) => {
            const isSelected = activeFilter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.filterChip, isSelected && styles.filterChipSelected]}
                onPress={() => setActiveFilter(tab.key)}
                activeOpacity={0.8}
              >
                {tab.hasIcon ? (
                  <MaterialCommunityIcons
                    name="view-grid-outline"
                    size={14}
                    color={isSelected ? '#FFFFFF' : '#475569'}
                    style={{ marginRight: 4 }}
                  />
                ) : (
                  <View style={[styles.filterChipDot, { backgroundColor: tab.dotColor }]} />
                )}
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextSelected]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Overview 4-Column Stat Card */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewCol}>
            <View style={[styles.statIconWrap, { backgroundColor: '#FEF3C7' }]}>
              <MaterialCommunityIcons name="wallet-outline" size={17} color="#D97706" />
            </View>
            <Text style={styles.statValue} numberOfLines={1}>
              ₹{stats.totalSpent.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.statLabel}>Total Spent</Text>
            <Text style={styles.statTrend}>↑ 18% vs last month</Text>
          </View>

          <View style={styles.colDivider} />

          <View style={styles.overviewCol}>
            <View style={[styles.statIconWrap, { backgroundColor: '#EFF6FF' }]}>
              <MaterialCommunityIcons name="shopping-outline" size={17} color="#2563EB" />
            </View>
            <Text style={styles.statValue}>{stats.totalOrders}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
            <Text style={styles.statTrend}>↑ 13% vs last month</Text>
          </View>

          <View style={styles.colDivider} />

          <View style={styles.overviewCol}>
            <View style={[styles.statIconWrap, { backgroundColor: '#FAF5FF' }]}>
              <MaterialCommunityIcons name="account-group-outline" size={17} color="#7C3AED" />
            </View>
            <Text style={styles.statValue}>{stats.labourBookings}</Text>
            <Text style={styles.statLabel}>Labour Bookings</Text>
            <Text style={styles.statTrend}>↑ 20% vs last month</Text>
          </View>

          <View style={styles.colDivider} />

          <View style={styles.overviewCol}>
            <View style={[styles.statIconWrap, { backgroundColor: '#ECFDF5' }]}>
              <MaterialCommunityIcons name="truck-outline" size={17} color="#10B981" />
            </View>
            <Text style={styles.statValue}>{stats.rentals}</Text>
            <Text style={styles.statLabel}>Rentals</Text>
            <Text style={styles.statTrend}>↑ 8% vs last month</Text>
          </View>
        </View>

        {/* Section Header: Your Projects (N) + Sort by */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Your Projects ({filteredProjects.length})</Text>
          <TouchableOpacity
            style={styles.sortDropdownBtn}
            onPress={() => setShowSortModal(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.sortDropdownText}>
              Sort by: {sortBy === 'recent' ? 'Recent' : sortBy === 'budget_high' ? 'Budget: High' : 'Budget: Low'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={14} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Projects List */}
        {filteredProjects.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="briefcase-outline" size={44} color="#94A3B8" style={{ marginBottom: 8 }} />
            <Text style={styles.emptyTitle}>No projects found</Text>
            <Text style={styles.emptySub}>Create a new project or try selecting a different filter.</Text>
            <TouchableOpacity style={styles.emptyAddBtn} onPress={handleCreateProject} activeOpacity={0.8}>
              <Text style={styles.emptyAddBtnText}>+ Create Project</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredProjects.map((project, index) => {
            const attachments = project.attachments || [];
            const ordersCount = attachments.filter((a) => a.refModel === 'SellerOrder' && a.type !== 'rental').length;
            const labourCount = attachments.filter((a) => a.refModel === 'Booking' || a.type === 'labour').length;
            const rentalsCount = attachments.filter((a) => a.type === 'rental').length;

            const spent = attachments.reduce((s, a) => s + (a.total || 0), 0) +
              (project.expenses || []).reduce((s, e) => s + (e.amount || 0), 0);
            const budget = project.budget || 250000;
            const progress = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;

            const customStatus = project.customStatus || 'in_progress';
            let statusText = 'In Progress';
            let statusDot = '#10B981';
            let statusTextColor = '#10B981';

            if (customStatus === 'planning') {
              statusText = 'Planning';
              statusDot = '#F59E0B';
              statusTextColor = '#D97706';
            } else if (customStatus === 'on_hold') {
              statusText = 'On Hold';
              statusDot = '#3B82F6';
              statusTextColor = '#2563EB';
            } else if (customStatus === 'completed' || project.status === 'completed') {
              statusText = 'Completed';
              statusDot = '#10B981';
              statusTextColor = '#10B981';
            } else if (customStatus === 'archived') {
              statusText = 'Archived';
              statusDot = '#94A3B8';
              statusTextColor = '#64748B';
            }

            const formattedDate = new Date(project.createdAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

            const lastItem = attachments[0];
            const lastActivityText = lastItem
              ? `${lastItem.title} • ${timeAgo(lastItem.createdAt)}`
              : `Project created • ${timeAgo(project.createdAt)}`;

            // Choose image alternating between villa and renovation
            const projectThumb = project.image
              ? { uri: project.image }
              : index % 2 === 0
              ? defaultProjectImage
              : renovationProjectImage;

            return (
              <TouchableOpacity
                key={project._id}
                style={styles.projectCard}
                onPress={() => handleOpenProject(project)}
                activeOpacity={0.88}
              >
                <View style={styles.cardMainRow}>
                  {/* Project Image */}
                  <Image source={projectThumb} style={styles.projectImage} resizeMode="cover" />

                  {/* Project Info Column */}
                  <View style={styles.projectInfoCol}>
                    <View style={styles.projectCardHeader}>
                      <View style={styles.statusIndicator}>
                        <View style={[styles.statusSmallDot, { backgroundColor: statusDot }]} />
                        <Text style={[styles.statusText, { color: statusTextColor }]}>{statusText}</Text>
                      </View>
                      <View style={styles.dateAndMore}>
                        <Text style={styles.projectDateText}>{formattedDate}</Text>
                        <TouchableOpacity
                          style={styles.moreBtn}
                          onPress={() => setActionProject(project)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <MaterialCommunityIcons name="dots-vertical" size={17} color="#64748B" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <Text style={styles.projectNameText} numberOfLines={1}>
                      {project.name}
                    </Text>

                    <View style={styles.locationRow}>
                      <MaterialCommunityIcons name="map-marker-outline" size={13} color="#64748B" />
                      <Text style={styles.locationText} numberOfLines={1}>
                        {project.location || 'Bengaluru, Karnataka'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Metrics Row: Spent/Budget + Orders / Labour / Rentals */}
                <View style={styles.cardMetricsRow}>
                  <View style={styles.budgetCol}>
                    <View style={styles.budgetHeader}>
                      <Text style={styles.spentAmount}>₹{spent.toLocaleString('en-IN')}</Text>
                      <Text style={styles.progressPercent}>{progress}% Progress</Text>
                    </View>
                    <Text style={styles.spentOfBudget}>Spent of ₹{budget.toLocaleString('en-IN')}</Text>
                    {/* Progress Bar */}
                    <View style={styles.progressBarTrack}>
                      <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                    </View>
                  </View>

                  <View style={styles.statsPillsContainer}>
                    <View style={styles.statPillBox}>
                      <Text style={styles.pillValue}>{ordersCount}</Text>
                      <Text style={styles.pillLabel}>Orders</Text>
                    </View>
                    <View style={styles.statPillBox}>
                      <Text style={styles.pillValue}>{labourCount}</Text>
                      <Text style={styles.pillLabel}>Labour</Text>
                    </View>
                    <View style={styles.statPillBox}>
                      <Text style={styles.pillValue}>{rentalsCount}</Text>
                      <Text style={styles.pillLabel}>Rentals</Text>
                    </View>
                  </View>
                </View>

                {/* Footer: Last Activity + View Project */}
                <View style={styles.cardFooterRow}>
                  <Text style={styles.lastActivityText} numberOfLines={1}>
                    <Text style={{ color: '#64748B' }}>Last activity: </Text>
                    <Text style={{ color: '#10B981', fontWeight: '500' }}>{lastActivityText}</Text>
                  </Text>
                  <View style={styles.viewProjectLink}>
                    <Text style={styles.viewProjectLinkText}>View Project</Text>
                    <MaterialCommunityIcons name="chevron-right" size={14} color="#D97706" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* Unassigned Items Banner */}
        <View style={styles.unassignedBanner}>
          <View style={styles.unassignedIconWrap}>
            <MaterialCommunityIcons name="folder-outline" size={20} color="#D97706" />
          </View>
          <View style={styles.unassignedTextCol}>
            <Text style={styles.unassignedTitle}>Unassigned Items ({unassignedItems.length})</Text>
            <Text style={styles.unassignedSub}>
              You have {unassignedItems.length} orders/bookings not assigned to any project.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.viewItemsBtn}
            onPress={() => setShowUnassignedModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.viewItemsBtnText}>View Items</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Sort Modal */}
      <Modal visible={showSortModal} transparent animationType="fade" onRequestClose={() => setShowSortModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowSortModal(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Sort Projects</Text>
            <TouchableOpacity
              style={[styles.modalOption, sortBy === 'recent' && styles.modalOptionActive]}
              onPress={() => { setSortBy('recent'); setShowSortModal(false); }}
            >
              <Text style={[styles.modalOptionText, sortBy === 'recent' && styles.modalOptionTextActive]}>
                Most Recent
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalOption, sortBy === 'budget_high' && styles.modalOptionActive]}
              onPress={() => { setSortBy('budget_high'); setShowSortModal(false); }}
            >
              <Text style={[styles.modalOptionText, sortBy === 'budget_high' && styles.modalOptionTextActive]}>
                Budget: High to Low
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalOption, sortBy === 'budget_low' && styles.modalOptionActive]}
              onPress={() => { setSortBy('budget_low'); setShowSortModal(false); }}
            >
              <Text style={[styles.modalOptionText, sortBy === 'budget_low' && styles.modalOptionTextActive]}>
                Budget: Low to High
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowSortModal(false)}>
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* 3-Dots Action Menu Modal */}
      <Modal visible={!!actionProject} transparent animationType="fade" onRequestClose={() => setActionProject(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setActionProject(null)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{actionProject?.name || 'Project Actions'}</Text>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                const proj = actionProject;
                setActionProject(null);
                handleOpenProject(proj);
              }}
            >
              <MaterialCommunityIcons name="open-in-new" size={18} color="#334155" style={{ marginRight: 8 }} />
              <Text style={styles.modalOptionText}>View Project Details</Text>
            </TouchableOpacity>

            <Text style={styles.subModalLabel}>Change Status:</Text>
            <View style={styles.statusChipsRow}>
              <TouchableOpacity
                style={[styles.statusChipBtn, { borderColor: '#10B981' }]}
                onPress={() => handleUpdateStatus('in_progress')}
              >
                <Text style={{ color: '#10B981', fontSize: 11.5, fontWeight: '600' }}>In Progress</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusChipBtn, { borderColor: '#F59E0B' }]}
                onPress={() => handleUpdateStatus('planning')}
              >
                <Text style={{ color: '#D97706', fontSize: 11.5, fontWeight: '600' }}>Planning</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusChipBtn, { borderColor: '#3B82F6' }]}
                onPress={() => handleUpdateStatus('on_hold')}
              >
                <Text style={{ color: '#2563EB', fontSize: 11.5, fontWeight: '600' }}>On Hold</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusChipBtn, { borderColor: '#10B981' }]}
                onPress={() => handleUpdateStatus('completed')}
              >
                <Text style={{ color: '#10B981', fontSize: 11.5, fontWeight: '600' }}>Completed</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.modalOption, { backgroundColor: '#FEF2F2', marginTop: 10 }]}
              onPress={() => {
                setProjectToDelete(actionProject);
                setActionProject(null);
              }}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={18} color="#EF4444" style={{ marginRight: 8 }} />
              <Text style={[styles.modalOptionText, { color: '#EF4444' }]}>Delete Project</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setActionProject(null)}>
              <Text style={styles.modalCloseBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={!!projectToDelete} transparent animationType="fade" onRequestClose={() => setProjectToDelete(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setProjectToDelete(null)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Delete Project?</Text>
            <Text style={styles.confirmDeleteSub}>
              Are you sure you want to delete "{projectToDelete?.name}"? Attachments will remain intact in your account.
            </Text>
            <View style={styles.deleteActionRow}>
              <TouchableOpacity
                style={styles.cancelActionBtn}
                onPress={() => setProjectToDelete(null)}
                disabled={deleting}
              >
                <Text style={styles.cancelActionBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDeleteBtn}
                onPress={confirmDeleteProject}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmDeleteBtnText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Unassigned Items Modal */}
      <Modal
        visible={showUnassignedModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUnassignedModal(false)}
      >
        <View style={styles.unassignedModalBackdrop}>
          <View style={styles.unassignedModalSheet}>
            <View style={styles.unassignedModalHeader}>
              <Text style={styles.unassignedModalTitle}>Unassigned Orders & Bookings</Text>
              <TouchableOpacity onPress={() => setShowUnassignedModal(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.unassignedModalSub}>
              Tap "Assign to Project" on any item to link it to an existing project.
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
              {unassignedItems.length === 0 ? (
                <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, color: '#64748B' }}>No unassigned items found!</Text>
                </View>
              ) : (
                unassignedItems.map((item) => (
                  <View key={item._id} style={styles.unassignedItemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.unassignedItemTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.unassignedItemSub}>{item.subtitle} • ₹{item.total.toLocaleString('en-IN')}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.assignItemBtn}
                      onPress={() => handleAssignUnassignedItem(item)}
                    >
                      <Text style={styles.assignItemBtnText}>Assign</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add To Project Sheet */}
      <AddToProjectSheet
        visible={showAddToProjectSheet}
        attachment={selectedUnassignedItem}
        onClose={() => setShowAddToProjectSheet(false)}
        onSuccess={() => {
          fetchMyProjects();
          fetchLabourBookings();
          fetchMySellerOrders();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  headerTextCol: {
    flex: 1,
    paddingRight: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '400',
    marginTop: 2,
  },
  newProjectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 11,
    paddingVertical: 7.5,
    borderRadius: 8,
    gap: 3,
  },
  newProjectBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#0F172A',
  },

  scrollContent: {
    paddingBottom: 40,
  },

  // Search & Filter
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    fontWeight: '400',
    color: '#1E293B',
    padding: 0,
  },
  filterIconButton: {
    width: 38,
    height: 38,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Filter chips
  filterChipsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 7,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipSelected: {
    backgroundColor: '#18181B',
    borderColor: '#18181B',
  },
  filterChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
  filterChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // 4-Column Stat Card
  overviewCard: {
    flexDirection: 'row',
    marginHorizontal: 14,
    marginTop: 12,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1.5,
  },
  overviewCol: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  colDivider: {
    width: 1,
    height: '75%',
    backgroundColor: '#F1F5F9',
    alignSelf: 'center',
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 1,
  },
  statLabel: {
    fontSize: 10.5,
    fontWeight: '400',
    color: '#64748B',
    marginBottom: 3,
  },
  statTrend: {
    fontSize: 8.5,
    fontWeight: '600',
    color: '#10B981',
    textAlign: 'center',
  },

  // Section Header
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  sortDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  sortDropdownText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#64748B',
  },

  // Project Card
  projectCard: {
    marginHorizontal: 14,
    marginBottom: 11,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectImage: {
    width: 76,
    height: 76,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  projectInfoCol: {
    flex: 1,
    marginLeft: 11,
  },
  projectCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusSmallDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  dateAndMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  projectDateText: {
    fontSize: 10.5,
    color: '#64748B',
  },
  moreBtn: {
    padding: 2,
  },
  projectNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locationText: {
    fontSize: 11.5,
    color: '#64748B',
    flex: 1,
  },

  // Card Metrics Row
  cardMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    gap: 12,
  },
  budgetCol: {
    flex: 1.2,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  spentAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  progressPercent: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#D97706',
  },
  spentOfBudget: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
    marginBottom: 4,
  },
  progressBarTrack: {
    height: 4.5,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 3,
  },
  statsPillsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  statPillBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    paddingVertical: 5,
  },
  pillValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  pillLabel: {
    fontSize: 9.5,
    color: '#64748B',
    fontWeight: '400',
    marginTop: 1,
  },

  // Card Footer Row
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  lastActivityText: {
    fontSize: 11,
    flex: 1,
    paddingRight: 6,
  },
  viewProjectLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  viewProjectLinkText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#D97706',
  },

  // Unassigned Items Banner
  unassignedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 14,
    marginTop: 6,
    marginBottom: 20,
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    padding: 12,
  },
  unassignedIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  unassignedTextCol: {
    flex: 1,
    paddingRight: 6,
  },
  unassignedTitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#92400E',
  },
  unassignedSub: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 1,
  },
  viewItemsBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  viewItemsBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
  },

  // Empty Card
  emptyCard: {
    marginHorizontal: 14,
    padding: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyAddBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  emptyAddBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalSheet: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 12,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: '#F8FAFC',
  },
  modalOptionActive: {
    backgroundColor: '#FEF3C7',
  },
  modalOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
  },
  modalOptionTextActive: {
    color: '#D97706',
    fontWeight: '600',
  },
  modalCloseBtn: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 8,
  },
  modalCloseBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  subModalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginTop: 8,
    marginBottom: 6,
  },
  statusChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statusChipBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  confirmDeleteSub: {
    fontSize: 12.5,
    color: '#64748B',
    marginBottom: 16,
  },
  deleteActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelActionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelActionBtnText: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '500',
  },
  confirmDeleteBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  confirmDeleteBtnText: {
    fontSize: 12.5,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Unassigned Modal
  unassignedModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  unassignedModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    maxHeight: '75%',
  },
  unassignedModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  unassignedModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  unassignedModalSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
  },
  unassignedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  unassignedItemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  unassignedItemSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  assignItemBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
  },
  assignItemBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
  },
});

export default ProjectsScreen;
