import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, layout } from '../theme';

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.headerBox}>
        <Text style={styles.headerText}>Amazon Shopping</Text>
        <Text style={styles.subtext}>Welcome back. What are you looking for today?</Text>
      </View>

      <View style={styles.actionGrid}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Product')}
        >
          <Text style={styles.buttonText}>Browse Products</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('UserDashboard')}
        >
          <Text style={styles.buttonText}>Your Orders & Account</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('ReturnRequest')}
        >
          <Text style={styles.secondaryButtonText}>Returns & Replacements</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('AdminDashboard')}
        >
          <Text style={styles.secondaryButtonText}>Seller Central</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('InspectionResult')}
        >
          <Text style={styles.secondaryButtonText}>View AI Inspection</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('VTOEngine')}
        >
          <Text style={styles.secondaryButtonText}>Virtual Try-On Experience</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: layout.padding,
    backgroundColor: colors.background,
  },
  headerBox: {
    padding: layout.padding,
    marginBottom: layout.padding * 2,
    backgroundColor: colors.secondary,
    borderRadius: layout.borderRadius,
  },
  headerText: {
    ...typography.header,
    color: colors.white,
    fontSize: 24,
  },
  subtext: {
    ...typography.body,
    color: colors.white,
    marginTop: 4,
    opacity: 0.9,
  },
  actionGrid: {
    gap: 12,
  },
  actionButton: {
    borderWidth: 1,
    borderColor: '#FCD200',
    padding: 16,
    backgroundColor: '#FFD814',
    alignItems: 'center',
    borderRadius: layout.borderRadius,
  },
  buttonText: {
    ...typography.button,
    color: colors.text,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    backgroundColor: colors.white,
    alignItems: 'center',
    borderRadius: layout.borderRadius,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  secondaryButtonText: {
    ...typography.button,
    color: colors.text,
    fontWeight: 'normal',
  }
});
