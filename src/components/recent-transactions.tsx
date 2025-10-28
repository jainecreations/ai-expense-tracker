import { 
  View, 
  Text, 
  FlatList, 
  Pressable, 
  Alert, 
  ActivityIndicator, 
  RefreshControl 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
type IoniconName = ComponentProps<typeof Ionicons>["name"];
import { useTransactionStore } from "@/store/transactionStore";
import { getCategoryColor, getCategoryIcon } from "@/utils/helper";
import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";

export default function RecentTransactions() {
  const user = useAuthStore((s) => s.user);
  const transactions = useTransactionStore((state) => state.transactions);
  const loadTransactions = useTransactionStore((state) => state.loadTransactions);
  const deleteTransaction = useTransactionStore((state) => state.deleteTransaction);
  const isLoading = useTransactionStore((state) => state.isLoading);
  const deletingIds = useTransactionStore((state) => state.deletingIds);

  const [refreshing, setRefreshing] = useState(false);

  // Load transactions only when user changes
  useEffect(() => {
    if (user) loadTransactions();
  }, [user]);

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Transaction",
      "Are you sure you want to delete this transaction?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteTransaction(id),
        },
      ]
    );
  };

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  }, [loadTransactions]);

  return (
    <View className="flex-1 mx-2 mt-2 rounded-2xl p-4">
      <Text className="text-lg font-semibold mb-4 text-gray-700">
        Recent Transactions
      </Text>

      {isLoading && !refreshing ? (
        <View className="flex-1 justify-center items-center py-8">
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="bg-white shadow-sm rounded-2xl p-4 mb-4 flex-row items-center justify-between">
              {/* Icon */}
              <View className="bg-white p-3 rounded-full mr-4">
                <Ionicons
                  name={getCategoryIcon(item.name) as IoniconName}
                  size={24}
                  color={getCategoryColor(item.name)}
                />
              </View>

              {/* Transaction info */}
              <View className="flex-1">
                <Text className="text-gray-700 font-medium">{item.name}</Text>
                <Text className="text-gray-400 text-sm">{item.date}</Text>
              </View>

              {/* Amount and Delete */}
              <View className="flex-row items-center">
                <Text className="text-gray-900 font-bold mr-4">
                  ₹{item.amount.toFixed(2)}
                </Text>
                <View>
                  {deletingIds.includes(item.id) ? (
                    <ActivityIndicator size="small" color="#ff4444" />
                  ) : (
                    <Pressable onPress={() => handleDelete(item.id)}>
                      <Ionicons name="trash-outline" size={22} color="#ff4444" />
                    </Pressable>
                  )}
                </View>
              </View>
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#ff4444"]}
              tintColor="#ff4444"
            />
          }
          ListEmptyComponent={
            !isLoading && (
              <Text className="text-center text-gray-400 mt-10">
                No transactions yet
              </Text>
            )
          }
        />
      )}
    </View>
  );
}
