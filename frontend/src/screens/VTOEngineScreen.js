import React from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { colors, typography, layout } from '../theme';

export default function VTOEngineScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>// VTO ENGINE</Text>
      
      <View style={styles.signatureElement}>
        <View style={styles.vtoFrame}>
          <Text style={styles.vtoText}>[ VIRTUAL DRAPING IN PROGRESS ]</Text>
          <View style={styles.scanningLine} />
        </View>
      </View>

      <View style={styles.metricsBox}>
        <Text style={styles.metricRow}>MODEL: <Text style={styles.highlight}>DIFFUSION-GAN</Text></Text>
        <Text style={styles.metricRow}>USER DIMENSIONS: <Text style={styles.highlight}>MAPPED</Text></Text>
        <Text style={styles.metricRow}>RETURN PROBABILITY: <Text style={styles.highlightGreen}>REDUCED TO 8%</Text></Text>
      </View>

      <TouchableOpacity style={styles.actionButton}>
        <Text style={styles.buttonText}>[ CONFIRM SIZE MATCH ]</Text>
      </TouchableOpacity>
    </View>
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
  signatureElement: {
    flex: 1,
    borderWidth: 4,
    borderColor: colors.accent,
    backgroundColor: colors.white,
    marginBottom: layout.padding * 2,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 18,
    textAlign: 'center',
  },
  scanningLine: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: 4,
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
    // In a real app, this would be animated
  },
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
