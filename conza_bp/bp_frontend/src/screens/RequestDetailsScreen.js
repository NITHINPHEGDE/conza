// src/screens/RequestDetailsScreen.js
import React, { useCallback, memo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import usePartnerStore, {
  selectAcceptJob, selectDeclineJob,
} from '../store/usePartnerStore';
import { colors } from '../theme/colors';

const GRAD_START = { x: 0, y: 0 };
const GRAD_END   = { x: 1, y: 0 };

const InfoRow = memo(({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoIcon}>{icon}</Text>
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
));

const SectionBox = memo(({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
));

const RequestDetailsScreen = ({ navigation, route }) => {
  const { request } = route.params;
  const insets     = useSafeAreaInsets();
  const updateRequestStatus = usePartnerStore((s) => s.updateRequestStatus);
  const [updating, setUpdating] = React.useState(false);

  const handleAccept = useCallback(async () => {
    try {
      setUpdating(true);
      await updateRequestStatus(request.id, 'confirmed');
      navigation.navigate('ActiveJob');
    } catch {
      setUpdating(false);
    }
  }, [updateRequestStatus, request.id, navigation]);

  const handleDecline = useCallback(async () => {
    try {
      setUpdating(true);
      await updateRequestStatus(request.id, 'cancelled');
      navigation.goBack();
    } catch {
      setUpdating(false);
    }
  }, [updateRequestStatus, request.id, navigation]);

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  const containerStyle = { ...styles.screen, paddingTop: insets.top };
  const bottomStyle    = { ...styles.bottomActions, paddingBottom: insets.bottom + 16 };

  return (
    <View style={containerStyle}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.navHeader}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Request Details</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={GRAD_START} end={GRAD_END}
          style={styles.amountBanner}
        >
          <Text style={styles.amountLabel}>Estimated Earning</Text>
          <Text style={styles.amountValue}>₹{request.estimatedAmount}</Text>
          <Text style={styles.amountSub}>{request.distance} · {request.timeAway}</Text>
        </LinearGradient>

        <SectionBox title="Customer Info">
          <InfoRow icon="👤" label="Name"  value={request.userName} />
          <InfoRow icon="📞" label="Phone" value={request.phone} />
        </SectionBox>

        <SectionBox title="Service Info">
          <InfoRow icon="🔧" label="Service" value={request.service} />
          <InfoRow icon="🛠️" label="Type"    value={request.subService} />
          <View style={styles.descBox}>
            <Text style={styles.descLabel}>Description</Text>
            <Text style={styles.descText}>{request.description}</Text>
          </View>
        </SectionBox>

        <SectionBox title="Address">
          <InfoRow icon="📍" label="Full Address" value={request.address} />
        </SectionBox>

        <SectionBox title="Scheduled Time">
          <InfoRow icon="🕐" label="Time" value={request.scheduledTime} />
          {request.scheduledTime === 'Immediate' && (
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentText}>⚡ Immediate Response Needed</Text>
            </View>
          )}
        </SectionBox>
      </ScrollView>

      <View style={bottomStyle}>
        <TouchableOpacity 
          style={styles.declineBtn} 
          onPress={handleDecline} 
          activeOpacity={0.8}
          disabled={updating}
        >
          <Text style={styles.declineBtnText}>{updating ? '...' : 'Decline'}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={handleAccept} 
          activeOpacity={0.85} 
          style={styles.flex}
          disabled={updating}
        >
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={GRAD_START} end={GRAD_END}
            style={styles.acceptBtn}
          >
            <Text style={styles.acceptBtnText}>{updating ? 'Processing...' : '✓ Accept Job'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: colors.background },
  flex:         { flex: 1 },
  spacer:       { width: 40 },
  navHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface },
  backBtn:      { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon:     { fontSize: 28, color: colors.textPrimary, fontWeight: '300', lineHeight: 32 },
  navTitle:     { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  content:      { paddingBottom: 20 },
  amountBanner: { margin: 20, borderRadius: 18, padding: 20, alignItems: 'center' },
  amountLabel:  { fontSize: 12, fontWeight: '600', color: 'rgba(26,24,20,0.7)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  amountValue:  { fontSize: 34, fontWeight: '900', color: colors.textPrimary, marginBottom: 6, letterSpacing: 0.5 },
  amountSub:    { fontSize: 13, fontWeight: '500', color: 'rgba(26,24,20,0.65)' },
  section:      { marginHorizontal: 20, marginBottom: 16, backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  infoRow:      { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 12 },
  infoIcon:     { fontSize: 16, marginTop: 1 },
  infoContent:  { flex: 1 },
  infoLabel:    { fontSize: 11, color: colors.textMuted, fontWeight: '500', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.3 },
  infoValue:    { fontSize: 14, fontWeight: '600', color: colors.textPrimary, lineHeight: 20 },
  descBox:      { marginTop: 4, backgroundColor: colors.surfaceElevated, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border },
  descLabel:    { fontSize: 11, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6 },
  descText:     { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  urgentBadge:  { marginTop: 8, backgroundColor: 'rgba(240,165,0,0.12)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(240,165,0,0.3)', alignSelf: 'flex-start' },
  urgentText:   { fontSize: 12, fontWeight: '700', color: colors.accentAmber },
  bottomActions:{ flexDirection: 'row', paddingHorizontal: 20, paddingTop: 16, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, gap: 12 },
  declineBtn:   { flex: 1, borderRadius: 14, paddingVertical: 15, alignItems: 'center', borderWidth: 1.5, borderColor: colors.danger, backgroundColor: colors.dangerSoft },
  declineBtnText:{ fontSize: 15, fontWeight: '700', color: colors.danger },
  acceptBtn:    { borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  acceptBtnText:{ fontSize: 15, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.3 },
});

export default RequestDetailsScreen;