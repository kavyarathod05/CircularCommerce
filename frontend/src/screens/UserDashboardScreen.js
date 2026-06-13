import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, layout } from '../theme';

export default function UserDashboardScreen() {
  return (
    <ScrollView style={styles.container}>
      {/* Eco-Points Wallet */}
      <View style={styles.walletBox}>
        <View style={styles.walletHeader}>
          <Text style={styles.walletTitle}>Your Account Balance</Text>
          <Text style={styles.walletTier}>Prime Member</Text>
        </View>
        <Text style={styles.walletBalance}>$34.50</Text>
        <Text style={styles.walletSub}>Available to use on your next purchase</Text>
      </View>

      <Text style={styles.sectionHeader}>Your Orders & Returns</Text>
      <View style={styles.timelineBox}>
        <Text style={styles.itemTitle}>Wireless Over-Ear Headphones V2</Text>
        <Text style={styles.timelineStep}>✓ Return Initiated: Today, 10:42 AM</Text>
        <Text style={styles.timelineStep}>✓ Item Received - Refund Processed</Text>
        <Text style={styles.timelineStepHighlight}>Local Match Found - Transferring to Escrow</Text>
        <Text style={styles.timelineStepPending}>Awaiting local handoff completion</Text>
      </View>

      <Text style={styles.sectionHeader}>Product Verification</Text>
      <View style={styles.dppBox}>
        <View style={styles.dppHeader}>
          <Text style={styles.dppTitle}>Authenticity Trail</Text>
          <Text style={styles.dppHash}>ID: 9f8a-4b2c</Text>
        </View>
        <Text style={styles.dppRow}>Origin: Factory A, Vietnam</Text>
        <Text style={styles.dppRow}>Purchased: Oct 12, 2026</Text>
        <Text style={styles.dppRow}>Transferred: Oct 15, 2026</Text>
        <TouchableOpacity style={styles.dppButton}>
          <Text style={styles.dppButtonText}>View Digital Receipt</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionHeader}>Climate Pledge Impact</Text>
      <View style={styles.carbonBox}>
        <View style={styles.carbonRow}>
          <Text style={styles.carbonLabel}>CO2 Avoided by Local Return:</Text>
          <Text style={styles.carbonValue}>18.4 kg</Text>
        </View>
        <View style={styles.carbonRow}>
          <Text style={styles.carbonLabel}>Tree Equivalent:</Text>
          <Text style={styles.carbonValue}>0.87 trees</Text>
        </View>
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
    marginTop: layout.padding,
    marginBottom: layout.padding,
  },
  walletBox: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: layout.padding,
    marginBottom: layout.padding,
    borderRadius: layout.borderRadius,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  walletTitle: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.text,
  },
  walletTier: {
    ...typography.body,
    color: colors.success,
    fontWeight: 'bold',
  },
  walletBalance: {
    ...typography.header,
    color: colors.error,
    fontSize: 28,
  },
  walletSub: {
    ...typography.body,
    color: colors.subtext,
    marginTop: 4,
    fontSize: 12,
  },
  timelineBox: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: layout.padding,
    backgroundColor: colors.white,
    marginBottom: layout.padding,
    borderRadius: layout.borderRadius,
  },
  itemTitle: {
    ...typography.header,
    color: colors.accent,
    fontSize: 16,
    marginBottom: 12,
  },
  timelineStep: {
    ...typography.body,
    color: colors.text,
    marginBottom: 6,
  },
  timelineStepHighlight: {
    ...typography.body,
    color: colors.secondary,
    fontWeight: 'bold',
    backgroundColor: '#FFF8F0',
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
    marginBottom: 6,
  },
  timelineStepPending: {
    ...typography.body,
    color: colors.subtext,
    marginTop: 4,
  },
  dppBox: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: layout.padding,
    backgroundColor: colors.white,
    marginBottom: layout.padding,
    borderRadius: layout.borderRadius,
  },
  dppHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dppTitle: {
    ...typography.header,
    color: colors.text,
    fontSize: 14,
  },
  dppHash: {
    ...typography.body,
    color: colors.subtext,
    fontSize: 12,
  },
  dppRow: {
    ...typography.body,
    color: colors.text,
    marginBottom: 6,
  },
  dppButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: '#F3F3F3',
  },
  dppButtonText: {
    ...typography.button,
    color: colors.text,
    fontWeight: 'normal',
    fontSize: 13,
  },
  carbonBox: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: layout.padding,
    backgroundColor: '#E8F5E9', // Soft green to signify climate
    marginBottom: layout.padding * 2,
    borderRadius: layout.borderRadius,
  },
  carbonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  carbonLabel: {
    ...typography.body,
    color: colors.secondary,
  },
  carbonValue: {
    ...typography.body,
    color: colors.success,
    fontWeight: 'bold',
  }
});
