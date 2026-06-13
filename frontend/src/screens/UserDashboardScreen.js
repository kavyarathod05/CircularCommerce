import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, layout } from '../theme';

export default function UserDashboardScreen() {
  return (
    <ScrollView style={styles.container}>
      {/* Eco-Points Wallet */}
      <View style={styles.walletBox}>
        <View style={styles.walletHeader}>
          <Text style={styles.walletTitle}>ECO-POINTS WALLET</Text>
          <Text style={styles.walletTier}>TIER: ECO WARRIOR</Text>
        </View>
        <Text style={styles.walletBalance}>3,450 PTS</Text>
        <Text style={styles.walletSub}>[ REDEEMABLE FOR OPEN-BOX CREDIT ]</Text>
      </View>

      <Text style={styles.sectionHeader}>// ACTIVE RETURNS TIMELINE</Text>
      <View style={styles.timelineBox}>
        <Text style={styles.itemTitle}>WIRELESS OVER-EAR HEADPHONES V2</Text>
        <Text style={styles.timelineStep}>[1] INITIATED: 10:42 AM</Text>
        <Text style={styles.timelineStep}>[2] AI INSPECTION: GRADE B (PASSED)</Text>
        <Text style={styles.timelineStepHighlight}>[3] ESCROW STATUS: FUNDS SECURED</Text>
        <Text style={styles.timelineStepPending}>[4] AWAITING LOCAL HANDOFF</Text>
      </View>

      <Text style={styles.sectionHeader}>// DIGITAL PRODUCT PASSPORT (DPP)</Text>
      <View style={styles.dppBox}>
        <View style={styles.dppHeader}>
          <Text style={styles.dppTitle}>AUTHENTICITY TRAIL</Text>
          <Text style={styles.dppHash}>UUID: 9f8a-4b2c</Text>
        </View>
        <Text style={styles.dppRow}>ORIGIN: FACTORY A, VIETNAM</Text>
        <Text style={styles.dppRow}>PURCHASED: OCT 12, 2026 (USER B001)</Text>
        <Text style={styles.dppRow}>TRANSFERRED: OCT 15, 2026 (USER B042)</Text>
        <TouchableOpacity style={styles.dppButton}>
          <Text style={styles.dppButtonText}>[ VIEW CRYPTOGRAPHIC LEDGER ]</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionHeader}>// PERSONAL CARBON IMPACT</Text>
      <View style={styles.carbonBox}>
        <View style={styles.carbonRow}>
          <Text style={styles.carbonLabel}>CO2 AVOIDED:</Text>
          <Text style={styles.carbonValue}>18.4 KG</Text>
        </View>
        <View style={styles.carbonRow}>
          <Text style={styles.carbonLabel}>TREE EQUIVALENT:</Text>
          <Text style={styles.carbonValue}>0.87 TREES</Text>
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
    borderWidth: layout.borderWidth,
    borderColor: colors.accent,
    backgroundColor: colors.text,
    padding: layout.padding,
    marginBottom: layout.padding,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  walletTitle: {
    ...typography.mono,
    color: colors.white,
  },
  walletTier: {
    ...typography.mono,
    color: colors.accent,
  },
  walletBalance: {
    ...typography.header,
    color: colors.accent,
    fontSize: 32,
  },
  walletSub: {
    ...typography.mono,
    color: colors.subtext,
    marginTop: 8,
  },
  timelineBox: {
    borderWidth: layout.borderWidth,
    borderColor: colors.text,
    padding: layout.padding,
    backgroundColor: colors.white,
    marginBottom: layout.padding,
  },
  itemTitle: {
    ...typography.header,
    color: colors.text,
    fontSize: 16,
    marginBottom: 12,
  },
  timelineStep: {
    ...typography.mono,
    color: colors.text,
    marginBottom: 6,
  },
  timelineStepHighlight: {
    ...typography.mono,
    color: colors.white,
    backgroundColor: colors.accent,
    padding: 4,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  timelineStepPending: {
    ...typography.mono,
    color: colors.border,
    marginTop: 4,
  },
  dppBox: {
    borderWidth: layout.borderWidth,
    borderColor: colors.border,
    padding: layout.padding,
    backgroundColor: colors.background,
    borderStyle: 'dashed',
    marginBottom: layout.padding,
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
    ...typography.mono,
    color: colors.subtext,
    fontSize: 10,
  },
  dppRow: {
    ...typography.mono,
    color: colors.text,
    marginBottom: 6,
  },
  dppButton: {
    borderWidth: 1,
    borderColor: colors.text,
    padding: 8,
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: colors.white,
  },
  dppButtonText: {
    ...typography.button,
    color: colors.text,
    fontSize: 12,
  },
  carbonBox: {
    borderWidth: layout.borderWidth,
    borderColor: colors.text,
    padding: layout.padding,
    backgroundColor: colors.white,
    marginBottom: layout.padding * 2,
  },
  carbonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  carbonLabel: {
    ...typography.mono,
    color: colors.subtext,
  },
  carbonValue: {
    ...typography.mono,
    color: colors.text,
    fontWeight: 'bold',
  }
});
