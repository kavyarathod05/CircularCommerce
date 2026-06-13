import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { colors, typography, layout } from '../theme';

export default function InspectionResultScreen() {
  // Mock data mimicking Nova Pro API output
  const inspectionData = {
    grade: "B",
    ebayConditionId: 3000,
    ebayConditionName: "Used",
    damages: [
      {
        type: "scratch",
        description: "2cm surface scratch",
        boundingBox: {
          xmin: 0.40,
          ymin: 0.20,
          xmax: 0.55,
          ymax: 0.45
        }
      }
    ]
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionHeader}>// AI INSPECTION REPORT</Text>
      
      <View style={styles.imageContainer}>
        <View style={styles.placeholderImg}>
           <Text style={styles.placeholderText}>[ ANALYZED IMAGE ]</Text>
           
           {/* Render Dynamic Bounding Boxes */}
           {inspectionData.damages.map((defect, index) => {
             const boxStyle = {
               position: 'absolute',
               left: `${defect.boundingBox.xmin * 100}%`,
               top: `${defect.boundingBox.ymin * 100}%`,
               width: `${(defect.boundingBox.xmax - defect.boundingBox.xmin) * 100}%`,
               height: `${(defect.boundingBox.ymax - defect.boundingBox.ymin) * 100}%`,
             };
             
             return (
               <View key={index} style={[styles.dynamicBoundingBox, boxStyle]}>
                 <Text style={styles.boundingText}>DEFECT: {defect.type.toUpperCase()}</Text>
               </View>
             );
           })}
        </View>
      </View>

      <View style={styles.reportBox}>
        <Text style={styles.reportRow}>GRADE: <Text style={styles.highlight}>{inspectionData.grade} / {inspectionData.ebayConditionName.toUpperCase()}</Text></Text>
        <Text style={styles.reportRow}>EBAY TAXONOMY: <Text style={styles.highlight}>ID {inspectionData.ebayConditionId}</Text></Text>
        <Text style={styles.reportRow}>CONFIDENCE: <Text style={styles.highlight}>94.2%</Text></Text>
        <Text style={styles.reportRow}>FRAUD RISK: <Text style={styles.highlightGreen}>LOW</Text></Text>
        <View style={styles.separator} />
        <Text style={styles.reportText}>
          Amazon Nova Pro assessment complete. Minor cosmetic scratch detected on left panel. 
          Cross-modal Swapped Goods detection verified match with original SKU. 
          Liveness check verified.
        </Text>
      </View>

      <View style={styles.actionBox}>
        <Text style={styles.actionText}>[ KMS-SIGNED CERTIFICATE GENERATED ]</Text>
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
    marginBottom: layout.padding,
  },
  imageContainer: {
    borderWidth: layout.borderWidth,
    borderColor: colors.text,
    height: 300,
    marginBottom: layout.padding * 2,
    position: 'relative',
  },
  placeholderImg: {
    flex: 1,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    ...typography.mono,
    color: colors.border,
  },
  dynamicBoundingBox: {
    borderWidth: 2,
    borderColor: colors.error,
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
  },
  boundingText: {
    ...typography.mono,
    color: colors.white,
    backgroundColor: colors.error,
    fontSize: 10,
    alignSelf: 'flex-start',
    paddingHorizontal: 2,
  },
  reportBox: {
    borderWidth: layout.borderWidth,
    borderColor: colors.text,
    padding: layout.padding,
    backgroundColor: colors.white,
    marginBottom: layout.padding,
  },
  reportRow: {
    ...typography.mono,
    color: colors.subtext,
    marginBottom: 4,
  },
  highlight: {
    color: colors.accent,
    fontWeight: 'bold',
  },
  highlightGreen: {
    color: '#00C853',
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  reportText: {
    ...typography.body,
    color: colors.text,
  },
  actionBox: {
    borderWidth: layout.borderWidth,
    borderColor: colors.text,
    padding: layout.padding,
    backgroundColor: colors.text,
    alignItems: 'center',
    marginTop: layout.padding,
  },
  actionText: {
    ...typography.button,
    color: colors.white,
    fontSize: 12,
  }
});
