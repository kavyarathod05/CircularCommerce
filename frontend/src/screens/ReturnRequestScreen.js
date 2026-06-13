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
        <Text style={styles.infoText}>ORDER_ID: 9874-AX</Text>
        <Text style={styles.infoText}>ITEM: WIRELESS HEADPHONES</Text>
        <Text style={styles.infoText}>STATUS: PENDING RETURN</Text>
      </View>

      <Text style={styles.sectionHeader}>1. MEDIA UPLOAD</Text>
      <Text style={styles.subtext}>UPLOAD 3-4 IMAGES FOR AI DEFECT INSPECTION</Text>
      
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

      <Text style={styles.sectionHeader}>2. IDENTITY VERIFICATION</Text>
      <Text style={styles.subtext}>LIVENESS CAPTURE REQUIRED FOR HIGH-VALUE TRANSFER</Text>
      
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={() => navigation.navigate('Camera')}
      >
        <Text style={styles.buttonText}>[ LAUNCH CAMERA ]</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.actionButton, styles.submitButton]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.buttonText}>[ TRANSMIT DOSSIER ]</Text>
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
    borderWidth: layout.borderWidth,
    borderColor: colors.text,
    padding: layout.padding,
    marginBottom: layout.padding * 2,
  },
  infoText: {
    ...typography.mono,
    color: colors.text,
    marginBottom: 4,
  },
  sectionHeader: {
    ...typography.header,
    color: colors.text,
    fontSize: 18,
    marginTop: layout.padding,
  },
  subtext: {
    ...typography.mono,
    color: colors.subtext,
    marginBottom: layout.padding,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: layout.padding * 2,
  },
  imageThumbnail: {
    width: 70,
    height: 70,
    borderWidth: layout.borderWidth,
    borderColor: colors.text,
  },
  addImageButton: {
    width: 70,
    height: 70,
    borderWidth: layout.borderWidth,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: {
    ...typography.header,
    color: colors.border,
  },
  actionButton: {
    borderWidth: layout.borderWidth,
    borderColor: colors.text,
    padding: layout.padding,
    backgroundColor: colors.text,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: colors.accent,
    borderColor: colors.text,
    marginTop: layout.padding * 2,
  },
  buttonText: {
    ...typography.button,
    color: colors.white,
  }
});
