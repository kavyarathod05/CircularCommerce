import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { colors, typography, layout } from '../theme';

export default function CameraScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(Platform.OS === 'web' ? true : null);
  const safeCameraType = CameraType ? (CameraType.front || 'front') : 'front';
  const [type, setType] = useState(safeCameraType);
  const cameraRef = useRef(null);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      (async () => {
        try {
          const { status } = await Camera.requestCameraPermissionsAsync();
          setHasPermission(status === 'granted');
        } catch (e) {
          console.warn("Failed to request camera permission, using fallback", e);
          setHasPermission(false);
        }
      })();
    }
  }, []);

  const handleCapture = async () => {
    Alert.alert('Success', 'Verification Complete.', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  if (hasPermission === null) {
    return <View style={styles.container}><Text style={styles.text}>Requesting camera access...</Text></View>;
  }
  if (hasPermission === false) {
    return <View style={styles.container}><Text style={styles.text}>Camera access denied. Please enable in settings.</Text></View>;
  }

  const isWeb = Platform.OS === 'web';

  return (
    <View style={styles.container}>
      <View style={styles.headerBox}>
        <Text style={styles.headerText}>Identity Verification</Text>
        <Text style={styles.subtext}>Please align your face in the frame. No movement required.</Text>
      </View>
      
      <View style={styles.cameraFrame}>
        {isWeb ? (
          <View style={[styles.camera, { backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ color: '#888', fontSize: 12, fontFamily: 'System', marginBottom: 15 }}>
              Camera Simulation Active
            </Text>
            <View style={styles.targetBox}>
              <View style={{ width: 140, height: 180, borderRadius: 90, borderWidth: 2, borderColor: colors.primary, borderStyle: 'dashed', marginTop: 50, alignSelf: 'center' }} />
            </View>
          </View>
        ) : (
          <Camera style={styles.camera} type={type} ref={cameraRef}>
            <View style={styles.overlay}>
               <View style={styles.targetBox} />
            </View>
          </Camera>
        )}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleCapture}
        >
          <Text style={styles.buttonText}>Capture Image</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonTextCancel}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: layout.padding,
    paddingTop: 60,
  },
  headerBox: {
    marginBottom: layout.padding,
  },
  headerText: {
    ...typography.header,
    color: colors.text,
    fontSize: 22,
    marginBottom: 4,
  },
  subtext: {
    ...typography.body,
    color: colors.subtext,
  },
  text: {
    ...typography.body,
    color: colors.text,
    alignSelf: 'center',
    marginTop: 100,
  },
  cameraFrame: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: layout.padding,
    overflow: 'hidden',
    borderRadius: layout.borderRadius,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetBox: {
    width: 250,
    height: 300,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 125,
  },
  controls: {
    paddingBottom: layout.padding,
  },
  actionButton: {
    borderWidth: 1,
    borderColor: '#FCD200',
    padding: 14,
    backgroundColor: '#FFD814',
    alignItems: 'center',
    marginBottom: 10,
    borderRadius: layout.borderRadius,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    borderRadius: layout.borderRadius,
  },
  buttonText: {
    ...typography.button,
    color: colors.text,
  },
  buttonTextCancel: {
    ...typography.button,
    color: colors.text,
    fontWeight: 'normal',
  }
});
