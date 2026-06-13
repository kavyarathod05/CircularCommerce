import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, typography, layout } from '../theme';

export default function AdminDashboardScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionHeader}>// TELEMETRY METRICS</Text>
      
      <View style={styles.grid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricTitle}>CAPITAL RECAPTURED</Text>
          <Text style={styles.metricValue}>$42,500</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricTitle}>INTERCEPT RATE</Text>
          <Text style={styles.metricValue}>34%</Text>
        </View>
        <View style={styles.metricCardFull}>
          <Text style={styles.metricTitle}>CARBON AVOIDED</Text>
          <Text style={styles.metricValue}>1,420 KG CO2</Text>
          <Text style={styles.metricSub}>EQUIVALENT TO 67 TREES</Text>
        </View>
      </View>

      <Text style={styles.sectionHeader}>// LOCATION CLUSTERS</Text>
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapText}>[ RENDER LEAFLET CLUSTER MAP HERE ]</Text>
      </View>
      
      <Text style={styles.sectionHeader}>// P2P ETA OPTIMIZATION</Text>
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapText}>[ RENDER MAPBOX ROUTE MATRIX HERE ]</Text>
      </View>
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
    marginTop: layout.padding * 2,
    marginBottom: layout.padding,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    borderWidth: layout.borderWidth,
    borderColor: colors.text,
    padding: layout.padding,
    backgroundColor: colors.white,
  },
  metricCardFull: {
    width: '100%',
    borderWidth: layout.borderWidth,
    borderColor: colors.accent,
    padding: layout.padding,
    backgroundColor: colors.text,
  },
  metricTitle: {
    ...typography.mono,
    color: colors.subtext,
    marginBottom: 8,
  },
  metricValue: {
    ...typography.header,
    color: colors.text,
  },
  metricSub: {
    ...typography.mono,
    color: colors.accent,
    marginTop: 8,
  },
  mapPlaceholder: {
    height: 150,
    borderWidth: layout.borderWidth,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: layout.padding,
  },
  mapText: {
    ...typography.mono,
    color: colors.border,
  }
});
