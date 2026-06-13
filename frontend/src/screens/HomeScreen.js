import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { colors, typography, layout } from '../theme';

export default function HomeScreen({ navigation }) {
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
      Alert.alert('CHECKOUT', 'Proceeding to escrow payment.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBox}>
        <Text style={styles.headerText}>SYSTEM READY</Text>
        <Text style={styles.subtext}>AWAITING INSTRUCTION</Text>
      </View>

      <View style={styles.actionGrid}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handlePurchaseAttempt}
        >
          <Text style={styles.buttonText}>[ SIMULATE PURCHASE ]</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('ReturnRequest')}
        >
          <Text style={styles.buttonText}>[ INITIATE RETURN ]</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('AdminDashboard')}
        >
          <Text style={styles.buttonText}>[ TELEMETRY DASHBOARD ]</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('InspectionResult')}
        >
          <Text style={styles.buttonText}>[ VIEW AI INSPECTION ]</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('VTOEngine')}
        >
          <Text style={styles.buttonText}>[ VTO ENGINE ]</Text>
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
    borderWidth: layout.borderWidth,
    borderColor: colors.text,
    padding: layout.padding,
    marginBottom: layout.padding * 2,
    backgroundColor: colors.border,
  },
  headerText: {
    ...typography.header,
    color: colors.text,
  },
  subtext: {
    ...typography.mono,
    color: colors.text,
    marginTop: 8,
  },
  actionGrid: {
    gap: 16,
  },
  actionButton: {
    borderWidth: layout.borderWidth,
    borderColor: colors.text,
    padding: layout.padding,
    backgroundColor: colors.accent,
    alignItems: 'center',
  },
  actionButtonDisabled: {
    borderWidth: layout.borderWidth,
    borderColor: colors.border,
    padding: layout.padding,
    backgroundColor: 'transparent',
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  buttonText: {
    ...typography.button,
    color: colors.white,
  },
  buttonTextDisabled: {
    ...typography.button,
    color: colors.border,
  }
});
