import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image, ScrollView } from 'react-native';
import { colors, typography, layout } from '../theme';
import { deviceSecurityContext } from '../utils/DeviceFingerprint';

export default function ProductScreen({ navigation }) {
  const [dwellTime, setDwellTime] = useState(0);

  useEffect(() => {
    // Predictive Friction Listener: monitor session dwell time
    const timer = setInterval(() => {
      setDwellTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handlePurchaseAttempt = () => {
    // Inject dynamic UI friction if dwell time is low (simulating impulse bracketing)
    if (dwellTime < 10) {
      Alert.alert(
        'AI SIZING ANOMALY DETECTED',
        'Our models predict a 82% return probability for this size. Customers with your profile prefer size M. Switch?',
        [
          { text: 'KEEP CURRENT', style: 'cancel' },
          { text: 'SWITCH TO M (RECOMMENDED)', onPress: () => console.log('Switched size') }
        ]
      );
    } else {
      Alert.alert('CHECKOUT', `Proceeding to escrow payment.\nDevice Hash: ${deviceSecurityContext.deviceHash}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imagePlaceholder}>
        <Text style={styles.imageText}>[ PRODUCT IMAGE CATALOG ]</Text>
      </View>
      
      <View style={styles.detailsBox}>
        <Text style={styles.brandText}>AURA TECH</Text>
        <Text style={styles.titleText}>WIRELESS OVER-EAR HEADPHONES V2</Text>
        <Text style={styles.priceText}>$299.00</Text>
      </View>

      <Text style={styles.sectionHeader}>// SIZING & FIT</Text>
      <View style={styles.sizeGrid}>
        <TouchableOpacity style={styles.sizeBox}>
          <Text style={styles.sizeText}>S</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.sizeBox, styles.sizeBoxSelected]}>
          <Text style={[styles.sizeText, styles.sizeTextSelected]}>M</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sizeBox}>
          <Text style={styles.sizeText}>L</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.vtoButton}
        onPress={() => navigation.navigate('VTOEngine')}
      >
        <Text style={styles.vtoButtonText}>[ VIRTUAL TRY-ON (AI) ]</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.purchaseButton}
        onPress={handlePurchaseAttempt}
      >
        <Text style={styles.purchaseButtonText}>[ ADD TO CART / BUY ]</Text>
      </TouchableOpacity>
      
      <Text style={styles.sectionHeader}>// SECURE P2P RETURN</Text>
      <TouchableOpacity 
        style={styles.returnButton}
        onPress={() => navigation.navigate('ReturnRequest')}
      >
        <Text style={styles.returnButtonText}>[ INITIATE SMART RETURN ]</Text>
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
  imagePlaceholder: {
    height: 300,
    borderWidth: layout.borderWidth,
    borderColor: colors.text,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: layout.padding,
  },
  imageText: {
    ...typography.mono,
    color: colors.border,
  },
  detailsBox: {
    marginBottom: layout.padding * 2,
  },
  brandText: {
    ...typography.mono,
    color: colors.subtext,
    marginBottom: 4,
  },
  titleText: {
    ...typography.header,
    color: colors.text,
    fontSize: 20,
    marginBottom: 8,
  },
  priceText: {
    ...typography.header,
    color: colors.accent,
  },
  sectionHeader: {
    ...typography.mono,
    color: colors.text,
    marginBottom: 8,
  },
  sizeGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: layout.padding * 2,
  },
  sizeBox: {
    width: 50,
    height: 50,
    borderWidth: layout.borderWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeBoxSelected: {
    borderColor: colors.text,
    backgroundColor: colors.text,
  },
  sizeText: {
    ...typography.button,
    color: colors.border,
  },
  sizeTextSelected: {
    color: colors.white,
  },
  vtoButton: {
    borderWidth: layout.borderWidth,
    borderColor: colors.accent,
    padding: layout.padding,
    backgroundColor: 'transparent',
    alignItems: 'center',
    marginBottom: layout.padding,
  },
  vtoButtonText: {
    ...typography.button,
    color: colors.accent,
  },
  purchaseButton: {
    borderWidth: layout.borderWidth,
    borderColor: colors.text,
    padding: layout.padding,
    backgroundColor: colors.text,
    alignItems: 'center',
    marginBottom: layout.padding * 2,
  },
  purchaseButtonText: {
    ...typography.button,
    color: colors.white,
  },
  returnButton: {
    borderWidth: layout.borderWidth,
    borderColor: colors.border,
    padding: layout.padding,
    backgroundColor: 'transparent',
    alignItems: 'center',
    borderStyle: 'dashed',
    marginBottom: layout.padding * 2,
  },
  returnButtonText: {
    ...typography.button,
    color: colors.text,
  }
});
