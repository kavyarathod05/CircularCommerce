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
        'Size Recommendation',
        'Customers with your profile prefer size M based on millions of customer reviews. Switch to size M for a better fit?',
        [
          { text: 'Keep Current', style: 'cancel' },
          { text: 'Switch to M (Recommended)', onPress: () => console.log('Switched size') }
        ]
      );
    } else {
      Alert.alert('Checkout', `Proceeding to secure checkout.\nDevice Hash: ${deviceSecurityContext.deviceHash}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imagePlaceholder}>
        <Text style={styles.imageText}>Product Image</Text>
      </View>
      
      <View style={styles.detailsBox}>
        <Text style={styles.brandText}>Visit the Aura Tech Store</Text>
        <Text style={styles.titleText}>Wireless Over-Ear Headphones V2</Text>
        <View style={styles.ratingRow}>
          <Text style={styles.ratingStars}>⭐⭐⭐⭐⭐ 4.8</Text>
          <Text style={styles.ratingCount}>12,402 ratings</Text>
        </View>
        <Text style={styles.priceText}>$299.00</Text>
        <Text style={styles.primeText}>✓ prime <Text style={styles.deliveryText}>FREE delivery Tomorrow</Text></Text>
      </View>

      <Text style={styles.sectionHeader}>Size</Text>
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
        <Text style={styles.vtoButtonText}>Virtual Try-On</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.purchaseButton}
        onPress={handlePurchaseAttempt}
      >
        <Text style={styles.purchaseButtonText}>Add to Cart</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.buyNowButton}
        onPress={handlePurchaseAttempt}
      >
        <Text style={styles.buyNowButtonText}>Buy Now</Text>
      </TouchableOpacity>
      
      <View style={styles.divider} />
      
      <Text style={styles.sectionHeader}>Orders & Returns</Text>
      <TouchableOpacity 
        style={styles.returnButton}
        onPress={() => navigation.navigate('ReturnRequest')}
      >
        <Text style={styles.returnButtonText}>Return or Replace Items</Text>
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
    height: 350,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: layout.padding,
    borderRadius: layout.borderRadius,
  },
  imageText: {
    ...typography.body,
    color: colors.border,
  },
  detailsBox: {
    marginBottom: layout.padding,
  },
  brandText: {
    ...typography.body,
    color: colors.accent,
    marginBottom: 4,
  },
  titleText: {
    ...typography.header,
    fontSize: 18,
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingStars: {
    fontSize: 14,
    color: colors.warning,
    marginRight: 8,
  },
  ratingCount: {
    ...typography.body,
    color: colors.accent,
  },
  priceText: {
    ...typography.header,
    fontSize: 28,
    color: colors.error,
    marginBottom: 4,
  },
  primeText: {
    fontSize: 14,
    color: colors.success,
    fontWeight: 'bold',
  },
  deliveryText: {
    fontWeight: 'normal',
    color: colors.text,
  },
  sectionHeader: {
    ...typography.header,
    fontSize: 16,
    marginBottom: 8,
  },
  sizeGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: layout.padding * 1.5,
  },
  sizeBox: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  sizeBoxSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FFF8F0',
    borderWidth: 2,
  },
  sizeText: {
    ...typography.body,
    color: colors.text,
  },
  sizeTextSelected: {
    color: colors.text,
    fontWeight: 'bold',
  },
  vtoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: layout.padding * 1.5,
  },
  vtoButtonText: {
    ...typography.body,
    color: colors.accent,
    fontWeight: 'bold',
  },
  purchaseButton: {
    borderWidth: 1,
    borderColor: '#FCD200',
    borderRadius: 24,
    padding: 14,
    backgroundColor: '#FFD814',
    alignItems: 'center',
    marginBottom: 12,
  },
  purchaseButtonText: {
    ...typography.button,
    color: colors.text,
  },
  buyNowButton: {
    borderWidth: 1,
    borderColor: '#FF8F00',
    borderRadius: 24,
    padding: 14,
    backgroundColor: '#FFA41C',
    alignItems: 'center',
    marginBottom: layout.padding * 1.5,
  },
  buyNowButtonText: {
    ...typography.button,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: layout.padding,
  },
  returnButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: layout.borderRadius,
    padding: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    marginBottom: layout.padding * 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  returnButtonText: {
    ...typography.button,
    color: colors.text,
    fontWeight: 'normal',
  }
});
