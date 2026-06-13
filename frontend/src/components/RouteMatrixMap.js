import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { colors, typography, layout } from '../theme';

export default function RouteMatrixMap({ eta = "14 MIN", distance = "2.4 KM" }) {
  // Simple animation for the "route scanning" effect
  const [scanAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.loop(
      Animated.timing(scanAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();
  }, [scanAnim]);

  const scanLineTop = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

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

      <Animated.View style={[styles.scanningLine, { top: scanLineTop }]} />

      {/* Origin Node */}
      <View style={[styles.node, styles.originNode]}>
        <Text style={styles.nodeLabel}>RETURNER</Text>
      </View>

      {/* Destination Node */}
      <View style={[styles.node, styles.destinationNode]}>
        <Text style={styles.nodeLabel}>BUYER</Text>
      </View>

      {/* Route Path (Diagonal line mock) */}
      <View style={styles.routePath} />

      <View style={styles.dataBox}>
        <Text style={styles.dataText}>ETA: {eta}</Text>
        <Text style={styles.dataText}>DIST: {distance}</Text>
        <Text style={styles.dataTextHighlight}>[ OPTIMIZED ROUTE ]</Text>
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
  scanningLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.accent,
    opacity: 0.8,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  node: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 0, // Industrial square
    borderWidth: 2,
  },
  originNode: {
    top: '70%',
    left: '20%',
    borderColor: colors.text,
    backgroundColor: colors.white,
  },
  destinationNode: {
    top: '30%',
    left: '70%',
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  nodeLabel: {
    ...typography.mono,
    fontSize: 8,
    color: colors.text,
    position: 'absolute',
    top: 15,
    width: 50,
  },
  routePath: {
    position: 'absolute',
    top: '50%',
    left: '45%',
    width: '60%',
    height: 2,
    backgroundColor: colors.accent,
    transform: [{ rotate: '-35deg' }],
    opacity: 0.6,
    borderStyle: 'dashed',
  },
  dataBox: {
    position: 'absolute',
    bottom: 10,
    left: 10,
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
    color: colors.accent,
    fontWeight: 'bold',
    marginTop: 4,
  }
});
