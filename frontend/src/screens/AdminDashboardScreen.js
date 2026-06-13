import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, typography, layout } from '../theme';
import RouteMatrixMap from '../components/RouteMatrixMap';
import ClusterMap from '../components/ClusterMap';
import { fetchAdminMetrics } from '../utils/api';

export default function AdminDashboardScreen() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const data = await fetchAdminMetrics();
        setMetrics(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadMetrics();
  }, []);

  if (loading || !metrics) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ ...typography.body, color: colors.text, marginTop: 16 }}>Loading Dashboard Data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionHeader}>Seller Metrics</Text>
      
      <View style={styles.grid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricTitle}>Capital Recaptured</Text>
          <Text style={styles.metricValue}>${metrics.capitalRecaptured.toLocaleString()}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricTitle}>Return Intercept Rate</Text>
          <Text style={styles.metricValue}>{metrics.interceptRate}%</Text>
        </View>
      </View>
      
      <Text style={styles.sectionHeader}>Climate Pledge: Sustainability Impact</Text>
      <View style={styles.carbonBox}>
        <View style={styles.carbonRow}>
          <Text style={styles.carbonLabel}>Total CO2 Avoided:</Text>
          <Text style={styles.carbonValue}>{metrics.co2Saved.toLocaleString()} kg</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: '75%' }]} />
        </View>
        <View style={styles.carbonRow}>
          <Text style={styles.carbonSubText}>Tree Equivalence:</Text>
          <Text style={styles.carbonSubValue}>{metrics.treeEquivalence} Mature Trees</Text>
        </View>
        <View style={styles.carbonRow}>
          <Text style={styles.carbonSubText}>Distance Offset:</Text>
          <Text style={styles.carbonSubValue}>{metrics.distanceOffset.toLocaleString()} km avoided</Text>
        </View>
      </View>

      <Text style={styles.sectionHeader}>Local Inventory Distribution</Text>
      <ClusterMap />
      
      <Text style={styles.sectionHeader}>Delivery Logistics</Text>
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
    fontSize: 18,
    marginTop: layout.padding * 1.5,
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
    borderWidth: 1,
    borderColor: colors.border,
    padding: layout.padding,
    backgroundColor: colors.white,
    borderRadius: layout.borderRadius,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  metricCardFull: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    padding: layout.padding,
    backgroundColor: colors.white,
    borderRadius: layout.borderRadius,
  },
  metricTitle: {
    ...typography.body,
    color: colors.subtext,
    marginBottom: 8,
  },
  metricValue: {
    ...typography.header,
    color: colors.text,
    fontSize: 22,
  },
  metricSub: {
    ...typography.body,
    color: colors.primary,
    marginTop: 8,
  },
  carbonSubValue: {
    ...typography.body,
    color: colors.success,
    fontWeight: 'bold',
  },
  carbonBox: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: layout.padding,
    backgroundColor: colors.white,
    marginBottom: layout.padding,
    borderRadius: layout.borderRadius,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  carbonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  carbonLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: 'bold',
  },
  carbonValue: {
    ...typography.header,
    color: colors.success,
    fontSize: 20,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.border,
    marginBottom: 16,
    borderRadius: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 4,
  },
  carbonSubText: {
    ...typography.body,
    color: colors.subtext,
  }
});
