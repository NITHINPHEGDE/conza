import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useAppStore from '../store/useAppStore';
import AddToProjectSheet from '../components/AddToProjectSheet';

const defaultProjectImage = require('../../assets/images/project_default.jpg');

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'labour', label: 'Labour' },
  { key: 'material', label: 'Material' },
  { key: 'rental', label: 'Rental' },
  { key: 'expenses', label: 'Expenses' },
];

const formatTimeAgo = (date) => {
  if (!date) return 'Recently';
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  if (diffDays === 0) return `Today, ${timeStr}`;
  if (diffDays === 1) return `Yesterday, ${timeStr}`;
  return `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}, ${timeStr}`;
};

const ProjectDetailScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { projectId } = route.params || {};

  const {
    myProjects,
    fetchMyProjects,
    updateProject,
    deleteProject,
    addExpenseToProject,
    removeExpenseFromProject,
    setActiveBookingId,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState('overview');
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit project modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBudget, setEditBudget] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // 3-dots actions menu modal
  const [showMenuModal, setShowMenuModal] = useState(false);

  // Add Expense modal
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Materials');
  const [savingExpense, setSavingExpense] = useState(false);

  // Add Attachments sheet
  const [showAttachSheet, setShowAttachSheet] = useState(false);

  // Activity filter modal
  const [showActivityFilter, setShowActivityFilter] = useState(false);
  const [activityFilter, setActivityFilter] = useState('all'); // 'all' | 'material' | 'labour' | 'rental' | 'expense'

  // Load project from store or backend
  const loadProject = useCallback(async () => {
    setLoading(true);
    await fetchMyProjects();
    setLoading(false);
  }, [fetchMyProjects]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  useEffect(() => {
    const found = (myProjects || []).find((p) => p._id === projectId);
    if (found) {
      setProject(found);
      setEditName(found.name || '');
      setEditBudget(found.budget ? found.budget.toString() : '250000');
      setEditLocation(found.location || 'Bengaluru, Karnataka');
    }
  }, [myProjects, projectId]);

  // Breakdown & calculations
  const {
    attachments,
    materialOrders,
    labourBookingsList,
    rentalOrdersList,
    expensesList,
    materialSpent,
    labourSpent,
    rentalSpent,
    expensesSpent,
    totalSpent,
    budget,
    budgetPercent,
    remainingBudget,
    allActivities,
  } = useMemo(() => {
    if (!project) {
      return {
        attachments: [],
        materialOrders: [],
        labourBookingsList: [],
        rentalOrdersList: [],
        expensesList: [],
        materialSpent: 0,
        labourSpent: 0,
        rentalSpent: 0,
        expensesSpent: 0,
        totalSpent: 0,
        budget: 250000,
        budgetPercent: 0,
        remainingBudget: 250000,
        allActivities: [],
      };
    }

    const att = project.attachments || [];
    const mat = att.filter((a) => a.refModel === 'SellerOrder' && a.type !== 'rental');
    const lab = att.filter((a) => a.refModel === 'Booking' || a.type === 'labour');
    const ren = att.filter((a) => a.type === 'rental');
    const exp = project.expenses || [];

    const matTotal = mat.reduce((sum, a) => sum + (a.total || 0), 0);
    const labTotal = lab.reduce((sum, a) => sum + (a.total || 0), 0);
    const renTotal = ren.reduce((sum, a) => sum + (a.total || 0), 0);
    const expTotal = exp.reduce((sum, e) => sum + (e.amount || 0), 0);

    const tot = matTotal + labTotal + renTotal + expTotal;
    const b = project.budget || 250000;
    const pct = b > 0 ? Math.min(100, Math.round((tot / b) * 100)) : 0;
    const rem = Math.max(0, b - tot);

    // Build activities timeline
    const acts = [];
    mat.forEach((m) => {
      acts.push({
        id: `mat-${m._id || m.refId}`,
        title: `${m.title || 'Material Order'} ${m.status === 'delivered' ? 'delivered' : 'placed'}`,
        subtitle: `${m.items?.length || 1} items • ${m.city || 'Bengaluru'}`,
        type: 'material',
        badge: 'Material',
        badgeColor: '#10B981',
        badgeBg: '#ECFDF5',
        icon: 'package-variant',
        iconBg: '#ECFDF5',
        iconColor: '#10B981',
        amount: m.total || 0,
        date: m.createdAt || project.createdAt,
      });
    });

    lab.forEach((l) => {
      acts.push({
        id: `lab-${l._id || l.refId}`,
        title: `${l.title || 'Labour Booking'} ${l.status === 'completed' ? 'completed' : 'started work'}`,
        subtitle: `${l.city || 'Bengaluru'}`,
        type: 'labour',
        badge: 'Labour',
        badgeColor: '#D97706',
        badgeBg: '#FEF3C7',
        icon: 'account-hard-hat',
        iconBg: '#FFF7ED',
        iconColor: '#D97706',
        amount: l.total || 0,
        date: l.createdAt || project.createdAt,
      });
    });

    ren.forEach((r) => {
      acts.push({
        id: `ren-${r._id || r.refId}`,
        title: `${r.title || 'Equipment Rental'} ${r.status === 'returned' ? 'completed' : 'booked'}`,
        subtitle: `${r.city || 'Bengaluru'}`,
        type: 'rental',
        badge: 'Rental',
        badgeColor: '#7C3AED',
        badgeBg: '#FAF5FF',
        icon: 'truck-outline',
        iconBg: '#FAF5FF',
        iconColor: '#7C3AED',
        amount: r.total || 0,
        date: r.createdAt || project.createdAt,
      });
    });

    exp.forEach((e) => {
      acts.push({
        id: `exp-${e._id}`,
        title: e.title,
        subtitle: e.category || 'Expense',
        type: 'expense',
        badge: 'Expense',
        badgeColor: '#EA580C',
        badgeBg: '#FFF7ED',
        icon: 'cash-multiple',
        iconBg: '#FFF7ED',
        iconColor: '#EA580C',
        amount: e.amount || 0,
        date: e.date || project.createdAt,
      });
    });

    acts.sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
      attachments: att,
      materialOrders: mat,
      labourBookingsList: lab,
      rentalOrdersList: ren,
      expensesList: exp,
      materialSpent: matTotal,
      labourSpent: labTotal,
      rentalSpent: renTotal,
      expensesSpent: expTotal,
      totalSpent: tot,
      budget: b,
      budgetPercent: pct,
      remainingBudget: rem,
      allActivities: acts,
    };
  }, [project]);

  const filteredActivities = useMemo(() => {
    if (activityFilter === 'all') return allActivities;
    return allActivities.filter((a) => a.type === activityFilter);
  }, [allActivities, activityFilter]);

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      Alert.alert('Validation Error', 'Project name cannot be empty.');
      return;
    }
    const numBudget = Number(editBudget.replace(/[^0-9]/g, '')) || 0;
    setSavingEdit(true);
    try {
      await updateProject(projectId, {
        name: editName.trim(),
        budget: numBudget,
        location: editLocation.trim(),
      });
      setShowEditModal(false);
      await fetchMyProjects();
    } catch (e) {
      Alert.alert('Error', 'Failed to update project.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleSaveExpense = async () => {
    if (!expenseTitle.trim() || !expenseAmount) {
      Alert.alert('Validation Error', 'Please enter a title and amount.');
      return;
    }
    const num = Number(expenseAmount.replace(/[^0-9]/g, ''));
    if (!num || num <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount.');
      return;
    }

    setSavingExpense(true);
    try {
      await addExpenseToProject(projectId, {
        title: expenseTitle.trim(),
        amount: num,
        category: expenseCategory,
      });
      setExpenseTitle('');
      setExpenseAmount('');
      setShowAddExpenseModal(false);
      await fetchMyProjects();
    } catch (e) {
      Alert.alert('Error', 'Failed to add expense.');
    } finally {
      setSavingExpense(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    Alert.alert('Delete Expense', 'Remove this expense from the project?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeExpenseFromProject(projectId, expenseId);
            await fetchMyProjects();
          } catch (e) {
            Alert.alert('Error', 'Failed to remove expense');
          }
        },
      },
    ]);
  };

  const handleDeleteProject = () => {
    setShowMenuModal(false);
    Alert.alert('Delete Project', `Are you sure you want to delete "${project?.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteProject(projectId);
            navigation.goBack();
          } catch (e) {
            Alert.alert('Error', 'Could not delete project.');
          }
        },
      },
    ]);
  };

  const handleUpdateCustomStatus = async (statusKey) => {
    setShowMenuModal(false);
    try {
      await updateProject(projectId, { customStatus: statusKey });
      await fetchMyProjects();
    } catch (e) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleViewAttachment = async (item) => {
    if (item.refModel === 'Booking') {
      await setActiveBookingId(item.refId?._id || item.refId);
      navigation.navigate('BookingDetail');
    } else {
      navigation.navigate('OrderDetail', { orderId: item.refId?._id || item.refId });
    }
  };

  if (loading && !project) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color="#D97706" />
      </View>
    );
  }

  if (!project) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Text style={styles.errorSub}>Project not found.</Text>
        <TouchableOpacity style={styles.backHomeBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backHomeBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const projectThumb = project.image ? { uri: project.image } : defaultProjectImage;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Header Top Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={20} color="#0F172A" />
        </TouchableOpacity>

        <Image source={projectThumb} style={styles.headerThumb} resizeMode="cover" />

        <View style={styles.headerCenter}>
          <View style={styles.titleRow}>
            <Text style={styles.headerTitle} numberOfLines={1}>{project.name}</Text>
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusPillText}>In Progress</Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={12} color="#64748B" />
            <Text style={styles.metaText} numberOfLines={1}>{project.location || 'Bengaluru, Karnataka'}</Text>
            <MaterialCommunityIcons name="calendar-blank-outline" size={12} color="#64748B" style={{ marginLeft: 6 }} />
            <Text style={styles.metaText}>
              Started on {new Date(project.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionIconBtn} onPress={() => setShowEditModal(true)}>
            <MaterialCommunityIcons name="pencil-outline" size={18} color="#1E293B" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIconBtn} onPress={() => setShowMenuModal(true)}>
            <MaterialCommunityIcons name="dots-vertical" size={18} color="#1E293B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs Row */}
      <View style={styles.tabRow}>
        {TABS.map((t) => {
          const isSelected = activeTab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              style={styles.tabItem}
              onPress={() => setActiveTab(t.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabItemText, isSelected && styles.tabItemTextActive]}>
                {t.label}
              </Text>
              {isSelected && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Main Content Scroll */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {activeTab === 'overview' && (
          <>
            {/* Big Budget Card */}
            <View style={styles.budgetCard}>
              <View style={styles.budgetCardTop}>
                <View style={styles.walletIconWrap}>
                  <MaterialCommunityIcons name="wallet-outline" size={24} color="#10B981" />
                </View>
                <View style={styles.budgetAmountsCol}>
                  <Text style={styles.totalSpentLabel}>Total Spent</Text>
                  <Text style={styles.totalSpentValue}>₹{totalSpent.toLocaleString('en-IN')}</Text>
                  <Text style={styles.budgetTotalSub}>of ₹{budget.toLocaleString('en-IN')} (Budget)</Text>
                </View>
                <View style={styles.budgetUsedCol}>
                  <Text style={styles.budgetPercentText}>{budgetPercent}%</Text>
                  <Text style={styles.budgetUsedLabel}>Budget Used</Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.budgetProgressTrack}>
                <View style={[styles.budgetProgressFill, { width: `${budgetPercent}%` }]} />
              </View>

              {/* Bottom Row */}
              <View style={styles.budgetCardFooter}>
                <Text style={styles.remainingAmountText}>
                  ₹{remainingBudget.toLocaleString('en-IN')} remaining
                </Text>
                <TouchableOpacity
                  style={styles.breakdownLink}
                  onPress={() => setActiveTab('expenses')}
                >
                  <Text style={styles.breakdownLinkText}>View Breakdown</Text>
                  <MaterialCommunityIcons name="chevron-right" size={14} color="#10B981" />
                </TouchableOpacity>
              </View>
            </View>

            {/* 5 Metric Summary Cards */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.metricsRowScroll}
            >
              {/* Orders */}
              <TouchableOpacity
                style={styles.metricCard}
                onPress={() => setActiveTab('material')}
                activeOpacity={0.8}
              >
                <View style={[styles.metricCardIcon, { backgroundColor: '#ECFDF5' }]}>
                  <MaterialCommunityIcons name="package-variant-closed" size={17} color="#10B981" />
                </View>
                <Text style={styles.metricCardValue}>{materialOrders.length}</Text>
                <Text style={styles.metricCardLabel}>Orders</Text>
                <Text style={[styles.metricCardSub, { color: '#10B981' }]}>₹{materialSpent.toLocaleString('en-IN')}</Text>
              </TouchableOpacity>

              {/* Labour */}
              <TouchableOpacity
                style={styles.metricCard}
                onPress={() => setActiveTab('labour')}
                activeOpacity={0.8}
              >
                <View style={[styles.metricCardIcon, { backgroundColor: '#FFF7ED' }]}>
                  <MaterialCommunityIcons name="account-hard-hat" size={17} color="#D97706" />
                </View>
                <Text style={styles.metricCardValue}>{labourBookingsList.length}</Text>
                <Text style={styles.metricCardLabel}>Labour</Text>
                <Text style={[styles.metricCardSub, { color: '#D97706' }]}>₹{labourSpent.toLocaleString('en-IN')}</Text>
              </TouchableOpacity>

              {/* Rentals */}
              <TouchableOpacity
                style={styles.metricCard}
                onPress={() => setActiveTab('rental')}
                activeOpacity={0.8}
              >
                <View style={[styles.metricCardIcon, { backgroundColor: '#FAF5FF' }]}>
                  <MaterialCommunityIcons name="truck-outline" size={17} color="#7C3AED" />
                </View>
                <Text style={styles.metricCardValue}>{rentalOrdersList.length}</Text>
                <Text style={styles.metricCardLabel}>Rentals</Text>
                <Text style={[styles.metricCardSub, { color: '#7C3AED' }]}>₹{rentalSpent.toLocaleString('en-IN')}</Text>
              </TouchableOpacity>

              {/* Expenses */}
              <TouchableOpacity
                style={styles.metricCard}
                onPress={() => setActiveTab('expenses')}
                activeOpacity={0.8}
              >
                <View style={[styles.metricCardIcon, { backgroundColor: '#FFF7ED' }]}>
                  <MaterialCommunityIcons name="cash-multiple" size={17} color="#EA580C" />
                </View>
                <Text style={styles.metricCardValue}>{expensesList.length}</Text>
                <Text style={styles.metricCardLabel}>Expenses</Text>
                <Text style={[styles.metricCardSub, { color: '#EA580C' }]}>₹{expensesSpent.toLocaleString('en-IN')}</Text>
              </TouchableOpacity>

              {/* Progress */}
              <View style={styles.metricCard}>
                <View style={[styles.metricCardIcon, { backgroundColor: '#EFF6FF' }]}>
                  <MaterialCommunityIcons name="chart-bar" size={17} color="#2563EB" />
                </View>
                <Text style={styles.metricCardValue}>{budgetPercent}%</Text>
                <Text style={styles.metricCardLabel}>Progress</Text>
                <Text style={[styles.metricCardSub, { color: '#2563EB' }]}>Used</Text>
              </View>
            </ScrollView>

            {/* Quick Action Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickActionsScroll}
            >
              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={() => navigation.navigate('Booking', { screen: 'BookingHome' })}
              >
                <MaterialCommunityIcons name="cart-outline" size={15} color="#10B981" />
                <Text style={styles.quickActionText}>Book Material</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={() => navigation.navigate('Booking', { screen: 'BookingHome' })}
              >
                <MaterialCommunityIcons name="account-hard-hat" size={15} color="#D97706" />
                <Text style={styles.quickActionText}>Book Labour</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={() => navigation.navigate('Booking', { screen: 'BookingHome' })}
              >
                <MaterialCommunityIcons name="tractor" size={15} color="#7C3AED" />
                <Text style={styles.quickActionText}>Book Rental</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={() => setShowAddExpenseModal(true)}
              >
                <MaterialCommunityIcons name="cash-plus" size={15} color="#EA580C" />
                <Text style={styles.quickActionText}>Add Expense</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickActionBtn, styles.quickActionBtnAdd]}
                onPress={() => setShowAddExpenseModal(true)}
              >
                <MaterialCommunityIcons name="plus" size={15} color="#10B981" />
                <Text style={[styles.quickActionText, { color: '#10B981' }]}>Add Activity</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Activities Timeline Section */}
            <View style={styles.activitiesSection}>
              <View style={styles.activitiesHeaderRow}>
                <Text style={styles.activitiesHeaderTitle}>Activities</Text>
                <TouchableOpacity
                  style={styles.activityFilterBtn}
                  onPress={() => setShowActivityFilter(true)}
                >
                  <MaterialCommunityIcons name="filter-variant" size={16} color="#475569" />
                  <Text style={styles.activityFilterBtnText}>Filter</Text>
                </TouchableOpacity>
              </View>

              {filteredActivities.length === 0 ? (
                <View style={styles.emptyActivities}>
                  <Text style={styles.emptyActivitiesText}>No activities recorded yet.</Text>
                  <Text style={styles.emptyActivitiesSub}>
                    Book labour, order materials, or add an expense to record project activity.
                  </Text>
                </View>
              ) : (
                <View style={styles.timelineContainer}>
                  {filteredActivities.map((act, idx) => {
                    const isLast = idx === filteredActivities.length - 1;
                    return (
                      <View key={act.id} style={styles.timelineItemRow}>
                        {/* Timeline node */}
                        <View style={styles.timelineNodeCol}>
                          <View style={[styles.timelineIconCircle, { backgroundColor: act.iconBg }]}>
                            <MaterialCommunityIcons name={act.icon} size={15} color={act.iconColor} />
                          </View>
                          {!isLast && <View style={styles.timelineLine} />}
                        </View>

                        {/* Content */}
                        <View style={styles.timelineContent}>
                          <View style={styles.timelineTopRow}>
                            <Text style={styles.activityTitle} numberOfLines={1}>{act.title}</Text>
                            <Text style={styles.activityAmount}>₹{act.amount.toLocaleString('en-IN')}</Text>
                          </View>
                          <View style={styles.timelineBottomRow}>
                            <Text style={styles.activitySubtitle} numberOfLines={1}>{act.subtitle}</Text>
                            <View style={[styles.activityBadge, { backgroundColor: act.badgeBg }]}>
                              <Text style={[styles.activityBadgeText, { color: act.badgeColor }]}>{act.badge}</Text>
                            </View>
                            <Text style={styles.activityDate}>{formatTimeAgo(act.date)}</Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </>
        )}

        {/* Labour Tab */}
        {activeTab === 'labour' && (
          <View style={styles.tabContent}>
            <View style={styles.tabContentHeader}>
              <Text style={styles.tabContentTitle}>Labour Bookings ({labourBookingsList.length})</Text>
            </View>
            {labourBookingsList.length === 0 ? (
              <View style={styles.emptyCard}>
                <MaterialCommunityIcons name="account-hard-hat" size={38} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No Labour Bookings Attached</Text>
                <Text style={styles.emptySub}>Attach ongoing labour bookings from the Status tab.</Text>
              </View>
            ) : (
              labourBookingsList.map((item) => (
                <TouchableOpacity
                  key={item._id || item.refId}
                  style={styles.itemCard}
                  onPress={() => handleViewAttachment(item)}
                  activeOpacity={0.88}
                >
                  <View style={styles.itemCardTop}>
                    <Text style={styles.itemCardTitle}>{item.title || 'Labour Booking'}</Text>
                    <Text style={styles.itemCardPrice}>₹{(item.total || 0).toLocaleString('en-IN')}</Text>
                  </View>
                  <Text style={styles.itemCardSub}>{item.city || 'Bengaluru'} • {item.status}</Text>
                  <View style={styles.itemCardFooter}>
                    <Text style={styles.itemCardDate}>{formatTimeAgo(item.createdAt)}</Text>
                    <Text style={styles.viewDetailsText}>View Details →</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Material Tab */}
        {activeTab === 'material' && (
          <View style={styles.tabContent}>
            <View style={styles.tabContentHeader}>
              <Text style={styles.tabContentTitle}>Material Orders ({materialOrders.length})</Text>
            </View>
            {materialOrders.length === 0 ? (
              <View style={styles.emptyCard}>
                <MaterialCommunityIcons name="package-variant-closed" size={38} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No Material Orders Attached</Text>
                <Text style={styles.emptySub}>Attach ongoing material orders from the Status tab.</Text>
              </View>
            ) : (
              materialOrders.map((item) => (
                <TouchableOpacity
                  key={item._id || item.refId}
                  style={styles.itemCard}
                  onPress={() => handleViewAttachment(item)}
                  activeOpacity={0.88}
                >
                  <View style={styles.itemCardTop}>
                    <Text style={styles.itemCardTitle}>{item.title || 'Material Order'}</Text>
                    <Text style={styles.itemCardPrice}>₹{(item.total || 0).toLocaleString('en-IN')}</Text>
                  </View>
                  <Text style={styles.itemCardSub}>{item.city || 'Bengaluru'} • {item.status}</Text>
                  <View style={styles.itemCardFooter}>
                    <Text style={styles.itemCardDate}>{formatTimeAgo(item.createdAt)}</Text>
                    <Text style={styles.viewDetailsText}>View Details →</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Rental Tab */}
        {activeTab === 'rental' && (
          <View style={styles.tabContent}>
            <View style={styles.tabContentHeader}>
              <Text style={styles.tabContentTitle}>Equipment Rentals ({rentalOrdersList.length})</Text>
            </View>
            {rentalOrdersList.length === 0 ? (
              <View style={styles.emptyCard}>
                <MaterialCommunityIcons name="truck-outline" size={38} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No Rentals Attached</Text>
                <Text style={styles.emptySub}>Attach equipment rentals from the Status tab.</Text>
              </View>
            ) : (
              rentalOrdersList.map((item) => (
                <TouchableOpacity
                  key={item._id || item.refId}
                  style={styles.itemCard}
                  onPress={() => handleViewAttachment(item)}
                  activeOpacity={0.88}
                >
                  <View style={styles.itemCardTop}>
                    <Text style={styles.itemCardTitle}>{item.title || 'Rental Equipment'}</Text>
                    <Text style={styles.itemCardPrice}>₹{(item.total || 0).toLocaleString('en-IN')}</Text>
                  </View>
                  <Text style={styles.itemCardSub}>{item.city || 'Bengaluru'} • {item.status}</Text>
                  <View style={styles.itemCardFooter}>
                    <Text style={styles.itemCardDate}>{formatTimeAgo(item.createdAt)}</Text>
                    <Text style={styles.viewDetailsText}>View Details →</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Expenses Tab */}
        {activeTab === 'expenses' && (
          <View style={styles.tabContent}>
            <View style={styles.tabContentHeader}>
              <Text style={styles.tabContentTitle}>Project Expenses ({expensesList.length})</Text>
              <TouchableOpacity
                style={styles.addExpenseBtn}
                onPress={() => setShowAddExpenseModal(true)}
              >
                <MaterialCommunityIcons name="plus" size={16} color="#FFFFFF" />
                <Text style={styles.addExpenseBtnText}>Add Expense</Text>
              </TouchableOpacity>
            </View>

            {expensesList.length === 0 ? (
              <View style={styles.emptyCard}>
                <MaterialCommunityIcons name="cash-multiple" size={38} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No Expenses Logged</Text>
                <Text style={styles.emptySub}>Log site expenses, permits, or consultancy fees to track spending.</Text>
              </View>
            ) : (
              expensesList.map((e) => (
                <View key={e._id} style={styles.itemCard}>
                  <View style={styles.itemCardTop}>
                    <Text style={styles.itemCardTitle}>{e.title}</Text>
                    <Text style={styles.itemCardPrice}>₹{(e.amount || 0).toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.itemCardFooter}>
                    <Text style={styles.itemCardSub}>{e.category || 'General'} • {formatTimeAgo(e.date)}</Text>
                    <TouchableOpacity onPress={() => handleDeleteExpense(e._id)}>
                      <MaterialCommunityIcons name="trash-can-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Edit Project Modal */}
      <Modal visible={showEditModal} transparent animationType="fade" onRequestClose={() => setShowEditModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowEditModal(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Project Details</Text>

            <Text style={styles.inputLabel}>Project Name</Text>
            <TextInput
              style={styles.modalInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Project Name"
            />

            <Text style={styles.inputLabel}>Total Budget (₹)</Text>
            <TextInput
              style={styles.modalInput}
              value={editBudget}
              onChangeText={setEditBudget}
              keyboardType="numeric"
              placeholder="Budget"
            />

            <Text style={styles.inputLabel}>Location</Text>
            <TextInput
              style={styles.modalInput}
              value={editLocation}
              onChangeText={setEditLocation}
              placeholder="Location"
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEditModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveEdit}
                disabled={savingEdit}
              >
                {savingEdit ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* 3-Dots Action Menu Modal */}
      <Modal visible={showMenuModal} transparent animationType="fade" onRequestClose={() => setShowMenuModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowMenuModal(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Project Actions</Text>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenuModal(false);
                setShowEditModal(true);
              }}
            >
              <MaterialCommunityIcons name="pencil-outline" size={18} color="#334155" style={{ marginRight: 8 }} />
              <Text style={styles.menuItemText}>Edit Project Details</Text>
            </TouchableOpacity>

            <Text style={styles.subModalLabel}>Change Status:</Text>
            <View style={styles.statusChipsRow}>
              <TouchableOpacity
                style={[styles.statusChipBtn, { borderColor: '#10B981' }]}
                onPress={() => handleUpdateCustomStatus('in_progress')}
              >
                <Text style={{ color: '#10B981', fontSize: 11.5, fontWeight: '600' }}>In Progress</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusChipBtn, { borderColor: '#F59E0B' }]}
                onPress={() => handleUpdateCustomStatus('planning')}
              >
                <Text style={{ color: '#D97706', fontSize: 11.5, fontWeight: '600' }}>Planning</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusChipBtn, { borderColor: '#3B82F6' }]}
                onPress={() => handleUpdateCustomStatus('on_hold')}
              >
                <Text style={{ color: '#2563EB', fontSize: 11.5, fontWeight: '600' }}>On Hold</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusChipBtn, { borderColor: '#10B981' }]}
                onPress={() => handleUpdateCustomStatus('completed')}
              >
                <Text style={{ color: '#10B981', fontSize: 11.5, fontWeight: '600' }}>Completed</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: '#FEF2F2', marginTop: 12 }]}
              onPress={handleDeleteProject}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={18} color="#EF4444" style={{ marginRight: 8 }} />
              <Text style={[styles.menuItemText, { color: '#EF4444' }]}>Delete Project</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowMenuModal(false)}>
              <Text style={styles.modalCloseBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Add Expense Modal */}
      <Modal
        visible={showAddExpenseModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddExpenseModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowAddExpenseModal(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Project Expense</Text>

            <Text style={styles.inputLabel}>Expense Title</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Site cleaning, Architecture consultation"
              value={expenseTitle}
              onChangeText={setExpenseTitle}
            />

            <Text style={styles.inputLabel}>Amount (₹)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 5000"
              keyboardType="numeric"
              value={expenseAmount}
              onChangeText={setExpenseAmount}
            />

            <Text style={styles.inputLabel}>Category</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Materials, Labour, Permits, Misc"
              value={expenseCategory}
              onChangeText={setExpenseCategory}
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddExpenseModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveExpense}
                disabled={savingExpense}
              >
                {savingExpense ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Add Expense</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Activity Filter Modal */}
      <Modal
        visible={showActivityFilter}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActivityFilter(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowActivityFilter(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Filter Activities</Text>
            {['all', 'material', 'labour', 'rental', 'expense'].map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.filterOption, activityFilter === cat && styles.filterOptionActive]}
                onPress={() => {
                  setActivityFilter(cat);
                  setShowActivityFilter(false);
                }}
              >
                <Text style={[styles.filterOptionText, activityFilter === cat && styles.filterOptionTextActive]}>
                  {cat === 'all' ? 'All Activities' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowActivityFilter(false)}>
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: '#FFFFFF',
  },
  headerThumb: {
    width: 42,
    height: 42,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#F1F5F9',
  },
  headerCenter: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 3.5,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
  },
  statusPillText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#10B981',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  metaText: {
    fontSize: 11,
    color: '#64748B',
    marginLeft: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 6,
  },
  actionIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    position: 'relative',
  },
  tabItemText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  tabItemTextActive: {
    color: '#D97706',
    fontWeight: '600',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 8,
    right: 8,
    height: 2,
    backgroundColor: '#D97706',
    borderRadius: 1,
  },

  scrollContent: {
    paddingBottom: 40,
  },

  // Budget Card
  budgetCard: {
    marginHorizontal: 14,
    marginTop: 12,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1.5,
  },
  budgetCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  budgetAmountsCol: {
    flex: 1,
  },
  totalSpentLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '400',
  },
  totalSpentValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginVertical: 1,
  },
  budgetTotalSub: {
    fontSize: 11,
    color: '#64748B',
  },
  budgetUsedCol: {
    alignItems: 'flex-end',
  },
  budgetPercentText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#10B981',
  },
  budgetUsedLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#10B981',
  },
  budgetProgressTrack: {
    height: 5,
    backgroundColor: '#F1F5F9',
    borderRadius: 2.5,
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 10,
  },
  budgetProgressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2.5,
  },
  budgetCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  remainingAmountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  breakdownLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownLinkText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#10B981',
  },

  // 5 Metric Cards
  metricsRowScroll: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    gap: 8,
  },
  metricCard: {
    width: 82,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    alignItems: 'center',
  },
  metricCardIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  metricCardValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  metricCardLabel: {
    fontSize: 10.5,
    color: '#64748B',
    marginBottom: 2,
  },
  metricCardSub: {
    fontSize: 9.5,
    fontWeight: '600',
  },

  // Quick Action Pills
  quickActionsScroll: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 6,
    gap: 5,
  },
  quickActionBtnAdd: {
    borderColor: '#A7F3D0',
    backgroundColor: '#F0FDF4',
  },
  quickActionText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#334155',
  },

  // Activities Section
  activitiesSection: {
    marginHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  activitiesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activitiesHeaderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  activityFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 3,
  },
  activityFilterBtnText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#475569',
  },
  emptyActivities: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyActivitiesText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 4,
  },
  emptyActivitiesSub: {
    fontSize: 11.5,
    color: '#94A3B8',
    textAlign: 'center',
  },

  // Timeline
  timelineContainer: {
    paddingLeft: 4,
  },
  timelineItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 52,
  },
  timelineNodeCol: {
    alignItems: 'center',
    width: 28,
    marginRight: 8,
  },
  timelineIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  timelineLine: {
    width: 1.5,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 2,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 14,
  },
  timelineTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityTitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
    paddingRight: 6,
  },
  activityAmount: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  timelineBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  activitySubtitle: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
  },
  activityBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  activityBadgeText: {
    fontSize: 9.5,
    fontWeight: '600',
  },
  activityDate: {
    fontSize: 10.5,
    color: '#94A3B8',
  },

  // Tab Content
  tabContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  tabContentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tabContentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  addExpenseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EA580C',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  addExpenseBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 10,
  },
  itemCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCardTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
    paddingRight: 6,
  },
  itemCardPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  itemCardSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  itemCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  itemCardDate: {
    fontSize: 10.5,
    color: '#94A3B8',
  },
  viewDetailsText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#D97706',
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 8,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 11.5,
    color: '#64748B',
    textAlign: 'center',
  },

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
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
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 4,
    marginTop: 8,
  },
  modalInput: {
    height: 42,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelBtnText: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '500',
  },
  saveBtn: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveBtnText: {
    fontSize: 12.5,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    marginBottom: 6,
  },
  menuItemText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
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

  filterOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: '#F8FAFC',
  },
  filterOptionActive: {
    backgroundColor: '#FEF3C7',
  },
  filterOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
  },
  filterOptionTextActive: {
    color: '#D97706',
    fontWeight: '600',
  },

  errorSub: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 10,
  },
  backHomeBtn: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backHomeBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
});

export default ProjectDetailScreen;