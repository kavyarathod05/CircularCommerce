import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, typography, layout } from '../theme';
import { deviceSecurityContext } from '../utils/DeviceFingerprint';

export default function ReturnRequestScreen({ navigation }) {
  const [images, setImages] = useState([]);

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
        onPress={() => Alert.alert('SUBMITTING', `MEDIA BUNDLE & DEVICE HASH (${deviceSecurityContext.deviceHash}) TRANSMITTED TO API GATEWAY.`)}
      >
        <Text style={styles.buttonText}>[ TRANSMIT DOSSIER ]</Text>
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
