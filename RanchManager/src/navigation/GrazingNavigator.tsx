import React from 'react';
import { Platform } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

// Screens
import PastureList from '../screens/grazing/PastureList';
import PastureDetail from '../screens/grazing/PastureDetail';
import RotationalGrazingPlanner from '../screens/grazing/RotationalGrazingPlanner';
import SoilHealthDashboard from '../screens/grazing/SoilHealthDashboard';
import EconomicImpactCalculator from '../screens/grazing/EconomicImpactCalculator';
import WeatherDashboard from '../screens/grazing/WeatherDashboard';
import KnowledgeResource from '../screens/grazing/KnowledgeResource';

// Types
export type GrazingStackParamList = {
  MainTabs: undefined;
  PastureList: undefined;
  PastureDetail: { pastureId: string };
  RotationalGrazingPlanner: { pastureId?: string };
  SoilHealthDashboard: undefined;
  EconomicImpactCalculator: undefined;
  WeatherDashboard: undefined;
  KnowledgeResource: undefined;
};

export type GrazingTabParamList = {
  Pastures: undefined;
  Planning: undefined;
  Health: undefined;
  Economics: undefined;
  Weather: undefined;
  Resources: undefined;
};

const Stack = createStackNavigator<GrazingStackParamList>();
const Tab = createBottomTabNavigator<GrazingTabParamList>();

// Custom Header Component
const CustomHeader = ({ navigation, route, options }: any) => {
  const theme = useTheme();
  const isAuthenticated = useSelector((state: RootState) => state.auth?.isAuthenticated ?? false);

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerRight: () => (
          <Icon
            name="dots-vertical"
            size={24}
            color="#fff"
            style={{ marginRight: 16 }}
            onPress={() => {
              // Show bottom sheet with actions
            }}
          />
        ),
      }}
    >
      <Stack.Screen
        name="PastureList"
        component={PastureList}
        options={{
          title: 'Pastures',
          headerRight: () => (
            <Icon
              name="plus"
              size={24}
              color="#fff"
              style={{ marginRight: 16 }}
              onPress={() => {
                // Navigate to add pasture
              }}
            />
          ),
        }}
      />
      <Stack.Screen
        name="PastureDetail"
        component={PastureDetail}
        options={({ route }) => ({
          title: 'Pasture Details',
          headerRight: () => (
            <Icon
              name="pencil"
              size={24}
              color="#fff"
              style={{ marginRight: 16 }}
              onPress={() => {
                // Navigate to edit pasture
              }}
            />
          ),
        })}
      />
      <Stack.Screen
        name="RotationalGrazingPlanner"
        component={RotationalGrazingPlanner}
        options={{
          title: 'Grazing Planner',
          headerRight: () => (
            <Icon
              name="content-save"
              size={24}
              color="#fff"
              style={{ marginRight: 16 }}
              onPress={() => {
                // Save plan
              }}
            />
          ),
        }}
      />
      <Stack.Screen
        name="SoilHealthDashboard"
        component={SoilHealthDashboard}
        options={{
          title: 'Soil Health',
          headerRight: () => (
            <Icon
              name="chart-line"
              size={24}
              color="#fff"
              style={{ marginRight: 16 }}
              onPress={() => {
                // Show trends
              }}
            />
          ),
        }}
      />
      <Stack.Screen
        name="EconomicImpactCalculator"
        component={EconomicImpactCalculator}
        options={{
          title: 'Economic Impact',
          headerRight: () => (
            <Icon
              name="file-pdf-box"
              size={24}
              color="#fff"
              style={{ marginRight: 16 }}
              onPress={() => {
                // Generate report
              }}
            />
          ),
        }}
      />
      <Stack.Screen
        name="WeatherDashboard"
        component={WeatherDashboard}
        options={{
          title: 'Weather',
          headerRight: () => (
            <Icon
              name="refresh"
              size={24}
              color="#fff"
              style={{ marginRight: 16 }}
              onPress={() => {
                // Refresh weather data
              }}
            />
          ),
        }}
      />
      <Stack.Screen
        name="KnowledgeResource"
        component={KnowledgeResource}
        options={{
          title: 'Resources',
          headerRight: () => (
            <Icon
              name="bookmark"
              size={24}
              color="#fff"
              style={{ marginRight: 16 }}
              onPress={() => {
                // Save to bookmarks
              }}
            />
          ),
        }}
      />
    </Stack.Navigator>
  );
};

// Tab Navigator
const GrazingTabNavigator = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceDisabled,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
      }}
    >
      <Tab.Screen
        name="Pastures"
        component={PastureList}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="grass" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Planning"
        component={RotationalGrazingPlanner}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="calendar-clock" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Health"
        component={SoilHealthDashboard}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="leaf" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Economics"
        component={EconomicImpactCalculator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="chart-bar" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Weather"
        component={WeatherDashboard}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="weather-partly-cloudy" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Resources"
        component={KnowledgeResource}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="book-open-variant" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Main Navigator Component
const GrazingNavigator = () => {
  const linking = {
    prefixes: ['ranchmanager://', 'https://ranchmanager.app'],
    config: {
      screens: {
        Pastures: 'pastures',
        'PastureDetail': 'pastures/:pastureId',
        'Planning': 'planning',
        'Health': 'health',
        'Economics': 'economics',
        'Weather': 'weather',
        'Resources': 'resources',
      },
    },
  };

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="MainTabs" component={GrazingTabNavigator} />
        <Stack.Screen name="PastureDetail" component={PastureDetail} />
        <Stack.Screen name="RotationalGrazingPlanner" component={RotationalGrazingPlanner} />
        <Stack.Screen name="SoilHealthDashboard" component={SoilHealthDashboard} />
        <Stack.Screen name="EconomicImpactCalculator" component={EconomicImpactCalculator} />
        <Stack.Screen name="WeatherDashboard" component={WeatherDashboard} />
        <Stack.Screen name="KnowledgeResource" component={KnowledgeResource} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default GrazingNavigator; 