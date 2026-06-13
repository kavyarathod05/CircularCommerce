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
      Alert.alert('PHOTO UPLOADED', 'Initializing Diffusion-GAN draping model...');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionHeader}>// VTO DRAPING ENGINE</Text>
      
      {!hasPhoto ? (
        <View style={styles.uploadState}>
          <Text style={styles.uploadText}>UPLOAD REFERENCE PHOTO FOR VIRTUAL FIT</Text>
          <TouchableOpacity style={styles.uploadButton} onPress={handleUploadPhoto}>
            <Text style={styles.uploadButtonText}>[ SELECT PHOTO ]</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.editorialGrid}>
            <View style={styles.signatureElement}>
              <View style={styles.vtoFrame}>
                <Text style={styles.vtoText}>[ GENERATING MESH ]</Text>
                <Animated.View style={[styles.scanningLine, { top: scanLineTop }]} />
                <View style={styles.targetCornerTL} />
                <View style={styles.targetCornerTR} />
                <View style={styles.targetCornerBL} />
                <View style={styles.targetCornerBR} />
              </View>
            </View>
            
            <View style={styles.editorialSidePanel}>
              <Text style={styles.editorialLabel}>SKU</Text>
              <Text style={styles.editorialValue}>HDPN-V2</Text>
              <Text style={styles.editorialLabel}>FIT</Text>
              <Text style={styles.editorialValue}>TRUE</Text>
              <Text style={styles.editorialLabel}>MODEL</Text>
              <Text style={styles.editorialValue}>DIFFUSION-GAN</Text>
            </View>
          </View>

          <View style={styles.metricsBox}>
            <Text style={styles.metricRow}>MODEL: <Text style={styles.highlight}>DIFFUSION-GAN</Text></Text>
            <Text style={styles.metricRow}>USER DIMENSIONS: <Text style={styles.highlight}>MAPPED</Text></Text>
            <Text style={styles.metricRow}>RETURN PROBABILITY: <Text style={styles.highlightGreen}>REDUCED TO 8%</Text></Text>
          </View>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>[ CONFIRM SIZE MATCH ]</Text>
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
    fontSize: 16,
    marginBottom: layout.padding,
  },
  editorialGrid: {
    flexDirection: 'row',
    marginBottom: layout.padding * 2,
  },
  uploadState: {
    borderWidth: layout.borderWidth,
    borderColor: colors.border,
    padding: layout.padding * 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    marginBottom: layout.padding * 2,
  },
  uploadText: {
    ...typography.mono,
    color: colors.subtext,
    textAlign: 'center',
    marginBottom: layout.padding,
  },
  uploadButton: {
    borderWidth: 1,
    borderColor: colors.accent,
    padding: layout.padding,
  },
  uploadButtonText: {
    ...typography.button,
    color: colors.accent,
  },
  editorialSidePanel: {
    width: 80,
    marginLeft: layout.padding,
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    paddingLeft: layout.padding,
  },
  editorialLabel: {
    ...typography.mono,
    color: colors.subtext,
    fontSize: 10,
  },
  editorialValue: {
    ...typography.mono,
    color: colors.text,
    marginBottom: layout.padding,
    fontWeight: 'bold',
  },
  signatureElement: {
    flex: 1,
    height: 350,
    borderWidth: 4,
    borderColor: colors.accent,
    backgroundColor: colors.white,
    position: 'relative',
    overflow: 'hidden',
  },
  vtoFrame: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  vtoText: {
    ...typography.header,
    color: colors.border,
    fontSize: 16,
    textAlign: 'center',
  },
  scanningLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  targetCornerTL: { position: 'absolute', top: 10, left: 10, width: 20, height: 20, borderTopWidth: 2, borderLeftWidth: 2, borderColor: colors.text },
  targetCornerTR: { position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderTopWidth: 2, borderRightWidth: 2, borderColor: colors.text },
  targetCornerBL: { position: 'absolute', bottom: 10, left: 10, width: 20, height: 20, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: colors.text },
  targetCornerBR: { position: 'absolute', bottom: 10, right: 10, width: 20, height: 20, borderBottomWidth: 2, borderRightWidth: 2, borderColor: colors.text },
  metricsBox: {
    borderWidth: layout.borderWidth,
    borderColor: colors.text,
    padding: layout.padding,
    backgroundColor: colors.white,
    marginBottom: layout.padding * 2,
  },
  metricRow: {
    ...typography.mono,
    color: colors.subtext,
    marginBottom: 8,
  },
  highlight: {
    color: colors.text,
    fontWeight: 'bold',
  },
  highlightGreen: {
    color: '#00C853',
    fontWeight: 'bold',
  },
  actionButton: {
    borderWidth: layout.borderWidth,
    borderColor: colors.text,
    padding: layout.padding,
    backgroundColor: colors.text,
    alignItems: 'center',
    marginBottom: layout.padding,
  },
  buttonText: {
    ...typography.button,
    color: colors.white,
  }
});
