import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, typography, layout } from '../theme';
import { deviceSecurityContext } from '../utils/DeviceFingerprint';
import { getMediaUploadUrl, uploadMediaToS3, submitReturnIntercept } from '../utils/api';
export default function ReturnRequestScreen({ navigation }) {
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (images.length === 0) {
      Alert.alert('Error', 'Please upload at least one image.');
      return;
    }

    setIsSubmitting(true);
    try {
      // For simplicity, we just upload the first image
      const imageUri = images[0];
      const filename = `return-${Date.now()}.jpg`;

      // 1. Get presigned URL
      const { upload_url, media_url } = await getMediaUploadUrl(filename);

      // 2. Upload to S3
      await uploadMediaToS3(upload_url, imageUri);

      // 3. Submit to Intercept API
      const payload = {
        order_id: '9874-AX',
        product_id: 'p-headphones-premium',
        user_id: 'usr-demo-app',
        reason: 'damaged',
        lat: 12.9716, // Default coordinates for testing
        lng: 77.5946,
        media_url: media_url,
        device_hash: deviceSecurityContext.deviceHash
      };

      const result = await submitReturnIntercept(payload);
      Alert.alert('Success', `Return processed! Pathway: ${result.pathway}\nGrade: ${result.inspection_grade || 'N/A'}`);
      
      // Navigate to inspection result screen with data
      navigation.navigate('InspectionResult', { result });
    } catch (error) {
      console.error(error);
      Alert.alert('Submission Failed', 'Could not process the return at this time.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>Order ID: 9874-AX</Text>
        <Text style={styles.infoTextTitle}>Wireless Over-Ear Headphones V2</Text>
        <Text style={styles.infoStatus}>Eligible for Return through Nov 15, 2026</Text>
      </View>

      <Text style={styles.sectionHeader}>Step 1: Upload Item Photos</Text>
      <Text style={styles.subtext}>Upload 3-4 images showing the condition of the item to expedite your return and confirm local handoff eligibility.</Text>
      
      <View style={styles.imageGrid}>
        {images.map((uri, index) => (
          <Image key={index} source={{ uri }} style={styles.imageThumbnail} />
        ))}
        {images.length < 4 && (
          <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
            <Text style={styles.addText}>+</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.sectionHeader}>Step 2: Security Verification</Text>
      <Text style={styles.subtext}>A quick security scan is required to instantly approve your refund.</Text>
      
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={() => navigation.navigate('Camera')}
      >
        <Text style={styles.buttonText}>Verify Identity</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.actionButton, styles.submitButton]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.buttonText}>Submit Return Request</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: layout.padding,
    backgroundColor: colors.background,
  },
  infoBox: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: layout.padding,
    marginBottom: layout.padding * 2,
    backgroundColor: colors.white,
    borderRadius: layout.borderRadius,
  },
  infoText: {
    ...typography.body,
    color: colors.subtext,
    marginBottom: 4,
  },
  infoTextTitle: {
    ...typography.header,
    color: colors.text,
    fontSize: 16,
    marginBottom: 8,
  },
  infoStatus: {
    ...typography.body,
    color: colors.success,
    fontWeight: 'bold',
  },
  sectionHeader: {
    ...typography.header,
    color: colors.text,
    fontSize: 18,
    marginTop: layout.padding,
  },
  subtext: {
    ...typography.body,
    color: colors.subtext,
    marginBottom: layout.padding,
    marginTop: 4,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: layout.padding * 2,
  },
  imageThumbnail: {
    width: 80,
    height: 80,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
  },
  addImageButton: {
    width: 80,
    height: 80,
    borderWidth: 1,
    borderColor: colors.accent,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#F0F8FF',
  },
  addText: {
    ...typography.header,
    color: colors.accent,
    fontSize: 32,
  },
  actionButton: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    marginBottom: 16,
    borderRadius: layout.borderRadius,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  submitButton: {
    backgroundColor: '#FFD814',
    borderColor: '#FCD200',
    marginTop: layout.padding,
  },
  buttonText: {
    ...typography.button,
    color: colors.text,
  }
});
