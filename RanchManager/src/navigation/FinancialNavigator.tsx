import React, { lazy } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { useTheme } from '../theme/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

// Lazy load financial screens
const TransactionsScreen = lazy(() => import('../screens/financial/TransactionsScreen'));
const BudgetsScreen = lazy(() => import('../screens/financial/BudgetsScreen'));
const ReportsScreen = lazy(() => import('../screens/financial/ReportsScreen'));
const FinancialSummaryScreen = lazy(() => import('../screens/financial/FinancialSummaryScreen'));

// Screens
import { FinancialDashboard } from '../screens/financial/FinancialDashboard';
import { TransactionList } from '../screens/financial/TransactionList';
import { TransactionDetail } from '../screens/financial/TransactionDetail';
import { AddEditTransaction } from '../screens/financial/AddEditTransaction';
import { BudgetList } from '../screens/financial/BudgetList';
import { BudgetDetail } from '../screens/financial/BudgetDetail';
import { AddEditBudget } from '../screens/financial/AddEditBudget';
import { Reports } from '../screens/financial/Reports';
import { EntityProfitability } from '../screens/financial/EntityProfitability';
import { FinancialSettingsScreen as FinancialSettings } from '../screens/financial/FinancialSettings';

// Types
export type FinancialStackParamList = {
  FinancialDashboard: undefined;
  TransactionList: undefined;
  TransactionDetail: { transactionId: string };
  AddEditTransaction: { transactionId?: string };
  BudgetList: undefined;
  BudgetDetail: { budgetId: string };
  AddEditBudget: { budgetId?: string };
  Reports: undefined;
  EntityProfitability: undefined;
  FinancialSettings: undefined;
};

export type FinancialTabParamList = {
  Dashboard: undefined;
  Transactions: undefined;
  Budgets: undefined;
  Reports: undefined;
};

const Stack = createStackNavigator<FinancialStackParamList>();
const Tab = createBottomTabNavigator<FinancialTabParamList>();

// Tab Navigator
const FinancialTabNavigator = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { budgets } = useSelector((state: RootState) => state.financial);
  const { transactions } = useSelector((state: RootState) => state.financial);

  // Calculate badges for notifications
  const getBudgetAlerts = () => {
    return budgets.items.filter(budget => {
      const progress = (budget.spent / budget.total) * 100;
      return progress >= 80; // Alert threshold
    }).length;
  };

  const getTransactionAlerts = () => {
    return transactions.items.filter(transaction => {
      // Add your transaction alert logic here
      return false;
    }).length;
  };

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.primary,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={FinancialDashboard}
        options={{
          tabBarLabel: t('financial.tabs.dashboard'),
          tabBarIcon: ({ color, size }) => (
            <Icon name="view-dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Transactions"
        component={TransactionList}
        options={{
          tabBarLabel: t('financial.tabs.transactions'),
          tabBarIcon: ({ color, size }) => (
            <Icon name="swap-horizontal" size={size} color={color} />
          ),
          tabBarBadge: getTransactionAlerts() || undefined,
        }}
      />
      <Tab.Screen
        name="Budgets"
        component={BudgetList}
        options={{
          tabBarLabel: t('financial.tabs.budgets'),
          tabBarIcon: ({ color, size }) => (
            <Icon name="wallet" size={size} color={color} />
          ),
          tabBarBadge: getBudgetAlerts() || undefined,
        }}
      />
      <Tab.Screen
        name="Reports"
        component={Reports}
        options={{
          tabBarLabel: t('financial.tabs.reports'),
          tabBarIcon: ({ color, size }) => (
            <Icon name="chart-bar" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Stack Navigator
export const FinancialNavigator: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isOffline = useSelector((state: RootState) => state.network.isOffline);

  return (
    <React.Suspense fallback={<LoadingScreen />}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.background,
          },
          headerTintColor: theme.colors.text,
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      >
        <Stack.Screen
          name="FinancialDashboard"
          component={FinancialTabNavigator}
          options={{
            title: t('financial.dashboard.title'),
            headerRight: () => (
              <Icon
                name={isOffline ? 'wifi-off' : 'wifi'}
                size={24}
                color={theme.colors.text}
                style={{ marginRight: 16 }}
              />
            ),
          }}
        />
        <Stack.Screen
          name="TransactionDetail"
          component={TransactionDetail}
          options={{
            title: t('financial.transactions.detail'),
          }}
        />
        <Stack.Screen
          name="AddEditTransaction"
          component={AddEditTransaction}
          options={({ route }) => ({
            title: route.params?.transactionId
              ? t('financial.transactions.edit')
              : t('financial.transactions.add'),
          })}
        />
        <Stack.Screen
          name="BudgetDetail"
          component={BudgetDetail}
          options={{
            title: t('financial.budgets.detail'),
          }}
        />
        <Stack.Screen
          name="AddEditBudget"
          component={AddEditBudget}
          options={({ route }) => ({
            title: route.params?.budgetId
              ? t('financial.budgets.edit')
              : t('financial.budgets.add'),
          })}
        />
        <Stack.Screen
          name="EntityProfitability"
          component={EntityProfitability}
          options={{
            title: t('financial.reports.entityProfitability'),
          }}
        />
        <Stack.Screen
          name="FinancialSettings"
          component={FinancialSettings}
          options={{
            title: t('financial.settings.title'),
          }}
        />
      </Stack.Navigator>
    </React.Suspense>
  );
};

// Deep Linking Configuration
export const linking = {
  prefixes: ['ranchmanager://', 'https://ranchmanager.app'],
  config: {
    screens: {
      FinancialDashboard: 'dashboard',
      TransactionDetail: 'transactions/:transactionId',
      BudgetDetail: 'budgets/:budgetId',
      Reports: 'reports',
      EntityProfitability: 'reports/profitability',
      FinancialSettings: 'settings',
    },
  },
};

// Loading screen component
const LoadingScreen: React.FC = () => {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 