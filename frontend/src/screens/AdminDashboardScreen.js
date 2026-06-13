import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, typography, layout } from '../theme';
import RouteMatrixMap from '../components/RouteMatrixMap';
import ClusterMap from '../components/ClusterMap';

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
      </View>
      <Text style={styles.sectionHeader}>// CARBON OPTIMIZATION VISUALIZER</Text>
      <View style={styles.carbonBox}>
        <View style={styles.carbonRow}>
          <Text style={styles.carbonLabel}>TOTAL CO2 SAVED:</Text>
          <Text style={styles.carbonValue}>1,420 KG</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: '75%' }]} />
        </View>
        <View style={styles.carbonRow}>
          <Text style={styles.carbonSubText}>TREE EQUIVALENCE:</Text>
          <Text style={styles.carbonSubValue}>[ 67 MATURE TREES ]</Text>
        </View>
        <View style={styles.carbonRow}>
          <Text style={styles.carbonSubText}>DISTANCE OFFSET:</Text>
          <Text style={styles.carbonSubValue}>[ 8,500 KM AVOIDED ]</Text>
        </View>
      </View>

      <Text style={styles.sectionHeader}>// SPATIAL ROUTING & CLUSTERS</Text>
      <ClusterMap />
      
      <Text style={styles.sectionHeader}>// P2P ETA OPTIMIZATION</Text>
      <RouteMatrixMap eta="14 MINS" distance="2.4 KM" />
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
  carbonSubValue: {
    ...typography.mono,
    color: colors.white,
  },
  carbonBox: {
    borderWidth: layout.borderWidth,
    borderColor: colors.accent,
    padding: layout.padding,
    backgroundColor: colors.text,
    marginBottom: layout.padding,
  },
  carbonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  carbonLabel: {
    ...typography.mono,
    color: colors.white,
  },
  carbonValue: {
    ...typography.header,
    color: colors.accent,
  },
  progressBarBg: {
    height: 12,
    backgroundColor: colors.border,
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.accent,
  },
  carbonSubText: {
    ...typography.mono,
    color: colors.subtext,
  }
});
