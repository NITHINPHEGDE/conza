import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import useAppStore from '../store/useAppStore';

const CreateProjectScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { createProject } = useAppStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Camera roll permission is required to upload an image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setImageUri(result.assets[0].uri);
      }
    } catch (e) {
      // Fallback
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Project name is required.');
      return;
    }
    const numBudget = Number(budget.replace(/[^0-9]/g, ''));
    if (!numBudget || numBudget <= 0) {
      setError('Please enter a valid total project budget.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const newProject = await createProject({
        name: name.trim(),
        description: description.trim(),
        budget: numBudget,
        location: 'Bengaluru, Karnataka',
        image: imageUri || '',
      });

      navigation.replace('ProjectDetail', { projectId: newProject._id });
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Could not create project.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleGoBack} activeOpacity={0.7}>
            <MaterialCommunityIcons name="arrow-left" size={20} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>Add New Project</Text>
            <Text style={styles.headerSubtitle}>
              Create a new project to manage your work, expenses and team
            </Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Section 1: Project Image (Optional) */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Project Image (Optional)</Text>
            <TouchableOpacity
              style={[styles.uploadBox, imageUri && styles.uploadBoxWithImage]}
              onPress={handlePickImage}
              activeOpacity={0.8}
            >
              {imageUri ? (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
                  <View style={styles.previewOverlay}>
                    <TouchableOpacity
                      style={styles.removeImageBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        setImageUri('');
                      }}
                    >
                      <MaterialCommunityIcons name="close-circle" size={22} color="#EF4444" />
                    </TouchableOpacity>
                    <Text style={styles.changeImageText}>Tap to change image</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.uploadInner}>
                  <View style={styles.uploadIconCircle}>
                    <MaterialCommunityIcons name="tray-arrow-up" size={22} color="#EA580C" />
                  </View>
                  <Text style={styles.uploadMainText}>Upload project image</Text>
                  <Text style={styles.uploadSubText}>JPG, PNG up to 5MB</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Section 2: Project Details */}
          <View style={styles.section}>
            <Text style={styles.sectionHeaderTitle}>Project Details</Text>
            <Text style={styles.fieldLabel}>
              Project Name <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View style={styles.inputRow}>
              <MaterialCommunityIcons name="calendar-blank-outline" size={18} color="#64748B" style={{ marginRight: 10 }} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter project name"
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={(t) => {
                  setName(t);
                  if (error) setError('');
                }}
              />
            </View>
          </View>

          {/* Section 3: Project Description (Optional) */}
          <View style={styles.section}>
            <Text style={styles.fieldLabel}>Project Description (Optional)</Text>
            <View style={styles.textAreaContainer}>
              <View style={styles.textAreaHeader}>
                <MaterialCommunityIcons name="file-document-outline" size={18} color="#64748B" style={{ marginRight: 8 }} />
              </View>
              <TextInput
                style={styles.textAreaInput}
                placeholder="Enter project description, notes or any specific details..."
                placeholderTextColor="#94A3B8"
                multiline
                maxLength={250}
                value={description}
                onChangeText={setDescription}
                textAlignVertical="top"
              />
              <Text style={styles.charCounter}>{description.length}/250</Text>
            </View>
          </View>

          {/* Section 4: Total Budget * */}
          <View style={styles.section}>
            <Text style={styles.fieldLabel}>
              Total Budget <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View style={styles.budgetInputRow}>
              <View style={styles.budgetWalletPill}>
                <MaterialCommunityIcons name="wallet-outline" size={18} color="#EA580C" />
              </View>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.budgetTextInput}
                placeholder="Enter total project budget"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={budget}
                onChangeText={(t) => {
                  // Format as numbers
                  const clean = t.replace(/[^0-9]/g, '');
                  setBudget(clean ? Number(clean).toLocaleString('en-IN') : '');
                  if (error) setError('');
                }}
              />
            </View>
          </View>

          {/* Error Banner */}
          {!!error && (
            <View style={styles.errorBox}>
              <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </ScrollView>

        {/* Footer Button */}
        <View style={styles.footerContainer}>
          <TouchableOpacity
            style={[styles.createBtn, submitting && styles.createBtnDisabled]}
            onPress={handleCreate}
            disabled={submitting}
            activeOpacity={0.88}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.createBtnText}>+ Create Project</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#FFFFFF',
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '400',
    marginTop: 2,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },

  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#0F172A',
    marginBottom: 6,
  },
  requiredStar: {
    color: '#EF4444',
  },

  // Upload box (dashed)
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#FDBA74',
    backgroundColor: '#FFFBF5',
    borderRadius: 12,
    paddingVertical: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBoxWithImage: {
    paddingVertical: 0,
    overflow: 'hidden',
    borderStyle: 'solid',
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  uploadInner: {
    alignItems: 'center',
  },
  uploadIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  uploadMainText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 3,
  },
  uploadSubText: {
    fontSize: 11,
    color: '#64748B',
  },
  previewContainer: {
    width: '100%',
    height: 140,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewOverlay: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  removeImageBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  changeImageText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  // Inputs
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    padding: 0,
  },

  // Textarea
  textAreaContainer: {
    height: 105,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    padding: 10,
    position: 'relative',
  },
  textAreaHeader: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
  textAreaInput: {
    flex: 1,
    fontSize: 12.5,
    color: '#0F172A',
    paddingLeft: 26,
    paddingTop: 0,
  },
  charCounter: {
    fontSize: 10.5,
    color: '#94A3B8',
    textAlign: 'right',
  },

  // Budget row
  budgetInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 10,
    backgroundColor: '#FFFBF5',
    paddingHorizontal: 10,
  },
  budgetWalletPill: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  currencySymbol: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginRight: 6,
  },
  budgetTextInput: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '500',
    color: '#0F172A',
    padding: 0,
  },

  // Error
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
  },

  // Footer
  footerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  createBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnDisabled: {
    opacity: 0.65,
  },
  createBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default CreateProjectScreen;
