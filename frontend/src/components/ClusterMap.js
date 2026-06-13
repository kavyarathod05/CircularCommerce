import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, layout } from '../theme';

export default function ClusterMap() {
  const clusters = [
    { id: 1, top: '20%', left: '30%', size: 40, count: 12 },
    { id: 2, top: '60%', left: '70%', size: 30, count: 5 },
    { id: 3, top: '50%', left: '20%', size: 25, count: 3 },
    { id: 4, top: '80%', left: '50%', size: 45, count: 18 },
  ];

  return (
    <View style={styles.mapContainer}>
      <View style={styles.gridOverlay}>
        {Array.from({ length: 10 }).map((_, i) => (
          <View key={`h-${i}`} style={[styles.horizontalLine, { top: `${i * 10}%` }]} />
        ))}
        {Array.from({ length: 10 }).map((_, i) => (
          <View key={`v-${i}`} style={[styles.verticalLine, { left: `${i * 10}%` }]} />
        ))}
      </View>

      {clusters.map((cluster) => (
        <View 
          key={cluster.id} 
          style={[
            styles.clusterNode, 
            { 
              top: cluster.top, 
              left: cluster.left, 
              width: cluster.size, 
              height: cluster.size,
              borderRadius: cluster.size / 2
            }
          ]}
        >
          <Text style={styles.clusterText}>{cluster.count}</Text>
        </View>
      ))}

      <View style={styles.dataBox}>
        <Text style={styles.dataText}>ACTIVE MICRO-NODES: 4</Text>
        <Text style={styles.dataTextHighlight}>[ COMMODITY ROUTING ]</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    height: 180,
    borderWidth: layout.borderWidth,
    borderColor: colors.text,
    backgroundColor: colors.white,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: layout.padding,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  horizontalLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.3,
  },
  verticalLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: colors.border,
    opacity: 0.3,
  },
  clusterNode: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 90, 0, 0.3)', // Accent color with opacity
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clusterText: {
    ...typography.mono,
    color: colors.text,
    fontSize: 10,
    fontWeight: 'bold',
  },
  dataBox: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.text,
    padding: 6,
  },
  dataText: {
    ...typography.mono,
    fontSize: 10,
    color: colors.text,
  },
  dataTextHighlight: {
    ...typography.mono,
    fontSize: 10,
    color: colors.subtext,
    marginTop: 4,
  }
});
