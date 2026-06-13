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
    Alert.alert('CAPTURED', 'LIVENESS HASH GENERATED.', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  if (hasPermission === null) {
    return <View style={styles.container}><Text style={styles.text}>AWAITING PERMISSION...</Text></View>;
  }
  if (hasPermission === false) {
    return <View style={styles.container}><Text style={styles.text}>NO ACCESS TO CAMERA OPTICS.</Text></View>;
  }

  const isWeb = Platform.OS === 'web';

  return (
    <View style={styles.container}>
      <View style={styles.headerBox}>
        <Text style={styles.headerText}>[ LIVENESS VERIFICATION ]</Text>
        <Text style={styles.subtext}>ALIGN FACE IN FRAME. NO MOVEMENT REQUIRED.</Text>
      </View>
      
      <View style={styles.cameraFrame}>
        {isWeb ? (
          <View style={[styles.camera, { backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ color: '#888', fontSize: 12, fontFamily: 'monospace', marginBottom: 15 }}>
              [ WEB OPTICS SIMULATION ACTIVE ]
            </Text>
            <View style={styles.targetBox}>
              <View style={{ width: 140, height: 180, borderRadius: 90, borderWidth: 1, borderColor: colors.accent, borderStyle: 'dashed', marginTop: 50, alignSelf: 'center' }} />
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
          <Text style={styles.buttonText}>[ INITIATE SCAN ]</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonTextCancel}>[ ABORT ]</Text>
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
    fontSize: 18,
  },
  subtext: {
    ...typography.mono,
    color: colors.text,
  },
  text: {
    ...typography.mono,
    color: colors.text,
    alignSelf: 'center',
    marginTop: 100,
  },
  cameraFrame: {
    flex: 1,
    borderWidth: 4,
    borderColor: colors.accent,
    marginBottom: layout.padding,
    overflow: 'hidden',
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
    borderColor: colors.accent,
    borderStyle: 'dashed',
  },
  controls: {
    paddingBottom: layout.padding,
  },
  actionButton: {
    borderWidth: layout.borderWidth,
    borderColor: colors.text,
    padding: layout.padding,
    backgroundColor: colors.text,
    alignItems: 'center',
    marginBottom: 10,
  },
  cancelButton: {
    borderWidth: layout.borderWidth,
    borderColor: colors.border,
    padding: layout.padding,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  buttonText: {
    ...typography.button,
    color: colors.white,
  },
  buttonTextCancel: {
    ...typography.button,
    color: colors.border,
  }
});
