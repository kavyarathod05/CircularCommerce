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
      <Text style={styles.sectionHeader}>Return Status: Approved</Text>
      
      <View style={styles.imageContainer}>
        <View style={styles.placeholderImg}>
           <Text style={styles.placeholderText}>Item Condition Photo</Text>
           
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
                 <Text style={styles.boundingText}>Noted: {defect.type}</Text>
               </View>
             );
           })}
        </View>
      </View>

      <View style={styles.reportBox}>
        <Text style={styles.reportRow}>Condition: <Text style={styles.highlight}>Used - {inspectionData.grade}</Text></Text>
        <Text style={styles.reportRow}>Resale Category: <Text style={styles.highlight}>Electronics (Used)</Text></Text>
        <Text style={styles.reportRow}>Verification: <Text style={styles.highlightGreen}>Successful</Text></Text>
        <View style={styles.separator} />
        <Text style={styles.reportText}>
          Your return has been verified and processed. We noted a minor cosmetic scratch on the left panel, but the item matches the original SKU. Your refund has been authorized and will be issued to your Amazon account balance.
        </Text>
      </View>

      <View style={styles.actionBox}>
        <Text style={styles.actionText}>View Return Details</Text>
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
    color: colors.success,
    fontSize: 20,
    marginBottom: layout.padding,
  },
  imageContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    height: 300,
    marginBottom: layout.padding * 2,
    position: 'relative',
    borderRadius: layout.borderRadius,
    overflow: 'hidden',
  },
  placeholderImg: {
    flex: 1,
    backgroundColor: '#F3F3F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    ...typography.body,
    color: colors.border,
  },
  dynamicBoundingBox: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: 'rgba(255, 153, 0, 0.1)',
  },
  boundingText: {
    ...typography.body,
    color: colors.white,
    backgroundColor: colors.primary,
    fontSize: 10,
    alignSelf: 'flex-start',
    paddingHorizontal: 4,
    fontWeight: 'bold',
  },
  reportBox: {
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
  reportRow: {
    ...typography.body,
    color: colors.text,
    marginBottom: 6,
  },
  highlight: {
    color: colors.text,
    fontWeight: 'bold',
  },
  highlightGreen: {
    color: colors.success,
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
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    marginTop: layout.padding,
    borderRadius: layout.borderRadius,
  },
  actionText: {
    ...typography.button,
    color: colors.text,
    fontSize: 14,
    fontWeight: 'normal',
  }
});
