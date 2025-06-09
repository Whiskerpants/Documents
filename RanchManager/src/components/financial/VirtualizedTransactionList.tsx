import React, { useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ListRenderItem,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Transaction } from '../../store/types/financial';
import { TransactionCard } from './TransactionCard';
import { PerformanceService } from '../../services/performanceService';
import { useTranslation } from 'react-i18next';

interface VirtualizedTransactionListProps {
  transactions: Transaction[];
  onLoadMore: () => Promise<void>;
  onRefresh: () => Promise<void>;
  isLoading: boolean;
  hasMore: boolean;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
}

const ITEM_HEIGHT = 100; // Approximate height of TransactionCard
const PAGE_SIZE = 20;

export const VirtualizedTransactionList: React.FC<VirtualizedTransactionListProps> = ({
  transactions,
  onLoadMore,
  onRefresh,
  isLoading,
  hasMore,
  ListHeaderComponent,
  ListEmptyComponent,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const perfService = PerformanceService.getInstance();

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  const renderItem: ListRenderItem<Transaction> = useCallback(
    ({ item }) => (
      <TransactionCard
        transaction={item}
        style={styles.transactionCard}
      />
    ),
    []
  );

  const keyExtractor = useCallback((item: Transaction) => item.id, []);

  const handleLoadMore = useCallback(async () => {
    if (!isLoading && hasMore) {
      await perfService.measureAsync('load_more_transactions', onLoadMore);
    }
  }, [isLoading, hasMore, onLoadMore]);

  const handleRefresh = useCallback(async () => {
    await perfService.measureAsync('refresh_transactions', onRefresh);
  }, [onRefresh]);

  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={isLoading}
        onRefresh={handleRefresh}
        colors={[colors.primary]}
        tintColor={colors.primary}
      />
    ),
    [isLoading, colors.primary, handleRefresh]
  );

  const ListFooterComponent = useCallback(
    () =>
      hasMore ? (
        <View style={styles.footer}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null,
    [hasMore, colors.primary]
  );

  return (
    <FlatList
      data={transactions}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      initialNumToRender={PAGE_SIZE}
      maxToRenderPerBatch={PAGE_SIZE}
      windowSize={5}
      removeClippedSubviews={true}
      refreshControl={refreshControl}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent}
      ListFooterComponent={ListFooterComponent}
      contentContainerStyle={styles.contentContainer}
    />
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
  },
  transactionCard: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
}); 