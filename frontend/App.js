import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomeScreen from './src/screens/HomeScreen';
import ReturnRequestScreen from './src/screens/ReturnRequestScreen';
import CameraScreen from './src/screens/CameraScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import InspectionResultScreen from './src/screens/InspectionResultScreen';
import VTOEngineScreen from './src/screens/VTOEngineScreen';
import ProductScreen from './src/screens/ProductScreen';
import UserDashboardScreen from './src/screens/UserDashboardScreen';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.text,
            headerTitleStyle: {
              fontFamily: 'Courier New',
              fontWeight: 'bold',
            },
            contentStyle: {
              backgroundColor: colors.background,
            }
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ title: 'SECONDLIFE PORTAL' }}
          />
          <Stack.Screen 
            name="Product" 
            component={ProductScreen} 
            options={{ title: 'PRODUCT CATALOG' }}
          />
          <Stack.Screen 
            name="UserDashboard" 
            component={UserDashboardScreen} 
            options={{ title: 'CUSTOMER PORTAL' }}
          />
          <Stack.Screen 
            name="ReturnRequest" 
            component={ReturnRequestScreen} 
            options={{ title: 'INITIATE RETURN' }}
          />
          <Stack.Screen 
            name="Camera" 
            component={CameraScreen} 
            options={{ title: 'LIVENESS VERIFICATION', headerShown: false }}
          />
          <Stack.Screen 
            name="AdminDashboard" 
            component={AdminDashboardScreen} 
            options={{ title: 'TELEMETRY DASHBOARD' }}
          />
          <Stack.Screen 
            name="InspectionResult" 
            component={InspectionResultScreen} 
            options={{ title: 'AI INSPECTION' }}
          />
          <Stack.Screen 
            name="VTOEngine" 
            component={VTOEngineScreen} 
            options={{ title: 'VIRTUAL TRY-ON' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
