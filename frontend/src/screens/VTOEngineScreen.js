import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Easing, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, typography, layout } from '../theme';

export default function VTOEngineScreen({ navigation }) {
  const [scanAnim] = useState(new Animated.Value(0));
  const [hasPhoto, setHasPhoto] = useState(false);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        })
      ])
    ).start();
  }, [scanAnim]);

  const scanLineTop = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  const handleUploadPhoto = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 1,
    });

    if (!result.canceled) {
      setHasPhoto(true);
      Alert.alert('Photo Uploaded', 'Generating your virtual try-on preview...');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionHeader}>Virtual Try-On</Text>
      
      {!hasPhoto ? (
        <View style={styles.uploadState}>
          <Text style={styles.uploadText}>Upload a photo of yourself to see how this item looks on you.</Text>
          <TouchableOpacity style={styles.uploadButton} onPress={handleUploadPhoto}>
            <Text style={styles.uploadButtonText}>Upload Photo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.editorialGrid}>
            <View style={styles.signatureElement}>
              <View style={styles.vtoFrame}>
                <Text style={styles.vtoText}>Generating Preview...</Text>
                <Animated.View style={[styles.scanningLine, { top: scanLineTop }]} />
                <View style={styles.targetCornerTL} />
                <View style={styles.targetCornerTR} />
                <View style={styles.targetCornerBL} />
                <View style={styles.targetCornerBR} />
              </View>
            </View>
            
            <View style={styles.editorialSidePanel}>
              <Text style={styles.editorialLabel}>Item</Text>
              <Text style={styles.editorialValue}>HDPN-V2</Text>
              <Text style={styles.editorialLabel}>Fit</Text>
              <Text style={styles.editorialValue}>True to Size</Text>
              <Text style={styles.editorialLabel}>Style</Text>
              <Text style={styles.editorialValue}>Modern</Text>
            </View>
          </View>

          <View style={styles.metricsBox}>
            <Text style={styles.metricRow}>Style Match: <Text style={styles.highlight}>Excellent</Text></Text>
            <Text style={styles.metricRow}>Fit Preference: <Text style={styles.highlight}>True to Size</Text></Text>
            <Text style={styles.metricRow}>Recommendation: <Text style={styles.highlightGreen}>Highly Recommended</Text></Text>
          </View>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Confirm Size & Add to Cart</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: layout.padding,
    backgroundColor: colors.background,
  },
  sectionHeader: {
    ...typography.header,
    color: colors.text,
    fontSize: 20,
    marginBottom: layout.padding,
  },
  editorialGrid: {
    flexDirection: 'row',
    marginBottom: layout.padding * 2,
  },
  uploadState: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: layout.padding * 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    marginBottom: layout.padding * 2,
    borderRadius: layout.borderRadius,
    backgroundColor: '#FAFAFA',
  },
  uploadText: {
    ...typography.body,
    color: colors.subtext,
    textAlign: 'center',
    marginBottom: layout.padding,
  },
  uploadButton: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    backgroundColor: colors.white,
    borderRadius: layout.borderRadius,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  uploadButtonText: {
    ...typography.button,
    color: colors.text,
    fontWeight: 'normal',
  },
  editorialSidePanel: {
    width: 100,
    marginLeft: layout.padding,
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    paddingLeft: layout.padding,
  },
  editorialLabel: {
    ...typography.body,
    color: colors.subtext,
    fontSize: 12,
  },
  editorialValue: {
    ...typography.body,
    color: colors.text,
    marginBottom: layout.padding,
    fontWeight: 'bold',
  },
  signatureElement: {
    flex: 1,
    height: 350,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: layout.borderRadius,
  },
  vtoFrame: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F3F3',
  },
  vtoText: {
    ...typography.body,
    color: colors.text,
    fontSize: 16,
    textAlign: 'center',
  },
  scanningLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  targetCornerTL: { position: 'absolute', top: 10, left: 10, width: 20, height: 20, borderTopWidth: 2, borderLeftWidth: 2, borderColor: colors.primary },
  targetCornerTR: { position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderTopWidth: 2, borderRightWidth: 2, borderColor: colors.primary },
  targetCornerBL: { position: 'absolute', bottom: 10, left: 10, width: 20, height: 20, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: colors.primary },
  targetCornerBR: { position: 'absolute', bottom: 10, right: 10, width: 20, height: 20, borderBottomWidth: 2, borderRightWidth: 2, borderColor: colors.primary },
  metricsBox: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: layout.padding,
    backgroundColor: colors.white,
    marginBottom: layout.padding * 2,
    borderRadius: layout.borderRadius,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  metricRow: {
    ...typography.body,
    color: colors.text,
    marginBottom: 8,
  },
  highlight: {
    color: colors.text,
    fontWeight: 'bold',
  },
  highlightGreen: {
    color: colors.success,
    fontWeight: 'bold',
  },
  actionButton: {
    borderWidth: 1,
    borderColor: '#FCD200',
    padding: 14,
    backgroundColor: '#FFD814',
    alignItems: 'center',
    marginBottom: layout.padding,
    borderRadius: layout.borderRadius,
  },
  buttonText: {
    ...typography.button,
    color: colors.text,
  }
});
