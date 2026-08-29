import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Image, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Shown right after the customer confirms a job as "work completed" —
// for both the single-worker flow and each worker in an autobook job.
const RatingReviewModal = ({ visible, workerName, workerImage, submitting, onSubmit, onSkip }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (visible) {
      setRating(0);
      setComment('');
    }
  }, [visible]);

  const handleSubmit = useCallback(() => {
    if (rating < 1) return;
    onSubmit(rating, comment);
  }, [rating, comment, onSubmit]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onSkip}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          {workerImage ? (
            <Image source={{ uri: workerImage }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <MaterialCommunityIcons name="account" size={30} color="#94A3B8" />
            </View>
          )}

          <Text style={styles.title}>Rate {workerName || 'your worker'}</Text>
          <Text style={styles.sub}>
            How was the work completed by {workerName || 'the worker'}?
          </Text>

          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={36}
                  color="#FBBF24"
                  style={{ marginHorizontal: 4 }}
                />
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Share your experience (optional)"
            placeholderTextColor="#94A3B8"
            value={comment}
            onChangeText={setComment}
            multiline
          />

          <TouchableOpacity
            style={[styles.submitBtn, rating < 1 && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={rating < 1 || submitting}
          >
            {submitting
              ? <ActivityIndicator color="#FFF" />
              : <Text style={styles.submitText}>Submit Review</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={onSkip} disabled={submitting}>
            <Text style={styles.skipText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  box: { backgroundColor: '#FFF', borderRadius: 20, padding: 24, width: '100%', alignItems: 'center' },
  avatar: { width: 64, height: 64, borderRadius: 32, marginBottom: 12 },
  avatarPlaceholder: { backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 6, textAlign: 'center' },
  sub: { fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 18 },
  starsRow: { flexDirection: 'row', marginBottom: 18 },
  input: {
    width: '100%', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 10, padding: 12, minHeight: 70, marginBottom: 16, textAlignVertical: 'top',
    color: '#1E293B',
  },
  submitBtn: { backgroundColor: '#10B981', width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  submitBtnDisabled: { backgroundColor: '#A7F3D0' },
  submitText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  skipBtn: { width: '100%', paddingVertical: 10, alignItems: 'center' },
  skipText: { color: '#64748B', fontWeight: '600', fontSize: 14 },
});

export default RatingReviewModal;
