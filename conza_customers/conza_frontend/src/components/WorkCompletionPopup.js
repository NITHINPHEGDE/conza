import React from 'react';
import { Modal, Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Global popup: appears centered, on top of whatever screen the customer is
// on, the moment a worker (autobook or manual booking) marks a job "Work
// Completed". Tapping "View & Confirm" takes the customer to the Status
// tab → that booking's detail screen, where the full "Confirm Work
// Completion" modal (with Confirm / Report Issue) lives and takes over.
// This popup is just the app-wide entry point into that screen.
const WorkCompletionPopup = ({ visible, workerName, onConfirmPress, onDismiss }) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name="clipboard-check" size={32} color="#FFF" />
          </View>

          <Text style={styles.title}>Work Completed</Text>
          <Text style={styles.subtitle}>
            {workerName ? `${workerName} has` : 'Your worker has'} marked the job as done.
            Please review and confirm.
          </Text>

          <TouchableOpacity style={styles.confirmBtn} onPress={onConfirmPress} activeOpacity={0.9}>
            <Text style={styles.confirmText}>View & Confirm</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.laterBtn} onPress={onDismiss} activeOpacity={0.7}>
            <Text style={styles.laterText}>Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  box: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title:    { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  confirmBtn: {
    width: '100%',
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  confirmText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  laterBtn:    { paddingVertical: 10 },
  laterText:   { color: '#94A3B8', fontWeight: '600', fontSize: 14 },
});

export default WorkCompletionPopup;
