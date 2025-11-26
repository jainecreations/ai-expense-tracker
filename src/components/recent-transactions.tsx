import {
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
type IoniconName = ComponentProps<typeof Ionicons>["name"];
import { useTransactionStore } from "@/store/transactionStore";
import { getCategoryColor, getCategoryIcon } from "@/utils/helper";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuthStore } from "@/store/authStore";

export default function RecentTransactions() {
  const user = useAuthStore((s) => s.user);
  const transactions = useTransactionStore((state) => state.transactions);
  const loadTransactions = useTransactionStore((state) => state.loadTransactions);
  const deleteTransaction = useTransactionStore((state) => state.deleteTransaction);
  const isLoading = useTransactionStore((state) => state.isLoading);
  const deletingIds = useTransactionStore((state) => state.deletingIds);

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [datePreset, setDatePreset] = useState<"all" | "7d" | "30d" | "month">("all");
  const [sortMode, setSortMode] = useState<"latest" | "high" | "low">("latest");

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setDatePreset("all");
    setSortMode("latest");
  };

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

  // Derived list of categories for filter chips
  const allCategories = Array.from(new Set(transactions.map((t) => t.name || "Other"))).filter(Boolean) as string[];

  // Filtered + searched + sorted transactions
  const visibleTransactions = useMemo(() => {
    const q = (searchQuery || "").toLowerCase().trim();
    const now = Date.now();
    const filtered = transactions.filter((t) => {
      // search by name or category
      const name = (t.name || "").toLowerCase();
      const category = (t.name || "").toLowerCase();
      if (q && !(name.includes(q) || category.includes(q))) return false;

      // category chips
      if (selectedCategories.length > 0 && !selectedCategories.includes(t.name || t.category || "Other")) return false;

      // date presets
      if (datePreset !== "all") {
        const d = new Date(t.date).getTime();
        if (isNaN(d)) return false;
        if (datePreset === "7d" && d < now - 7 * 24 * 60 * 60 * 1000) return false;
        if (datePreset === "30d" && d < now - 30 * 24 * 60 * 60 * 1000) return false;
        if (datePreset === "month") {
          const dt = new Date();
          if (new Date(t.date).getMonth() !== dt.getMonth()) return false;
        }
      }

      return true;
    });

    if (sortMode === "latest") {
      filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (sortMode === "high") {
      filtered.sort((a, b) => (b.amount || 0) - (a.amount || 0));
    } else {
      filtered.sort((a, b) => (a.amount || 0) - (b.amount || 0));
    }

    return filtered;
  }, [transactions, searchQuery, selectedCategories, datePreset, sortMode]);

  return (
    <SafeAreaView className="flex-1 mx-2 mt-2 rounded-2xl p-2">
      <View className="px-2">
        <Text className="text-lg font-semibold mb-2 text-gray-700">Recent Transactions</Text>

        {/* Search bar + filter button */}
        <View className="flex-row items-center mb-3">
          <View className="flex-1 bg-gray-100 rounded-full px-3 py-2 mr-2 flex-row items-center">
            <Ionicons name="search" size={18} color="#6B7280" />
            <TextInput
              placeholder="Search expenses..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="ml-2 flex-1"
            />
          </View>
          <TouchableOpacity onPress={() => setFilterVisible(true)} className="bg-white p-2 rounded-full shadow">
            <Ionicons name="filter" size={20} />
          </TouchableOpacity>
        </View>

        {/* Active chips row */}
        <View className="flex-row flex-wrap mb-2">
          {selectedCategories.map((c) => (
            <TouchableOpacity key={c} onPress={() => setSelectedCategories((s) => s.filter((x) => x !== c))} className="bg-blue-100 px-3 py-1 rounded-full mr-2 mb-2">
              <Text className="text-sm text-blue-700">{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

      </View>

      {isLoading && !refreshing ? (
        <View className="flex-1 justify-center items-center py-8">
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={visibleTransactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View>
              <View className="flex-row items-center justify-between py-3">
                <View className="flex-row items-center">
                  <View className="w-12 h-12 rounded-full mr-3 flex items-center justify-center" style={{ backgroundColor: getCategoryColor(item.name) }}>
                    <Ionicons name={getCategoryIcon(item.name) as IoniconName} size={20} color="#fff" />
                  </View>
                  <View>
                    <Text className="text-gray-800 font-medium">{item.name}</Text>
                    <Text className="text-gray-400 text-sm">{item.date}</Text>
                  </View>
                </View>

                <View className="flex-row items-center">
                  <Text className="text-gray-900 font-bold">₹{(item.amount || 0).toFixed(0)}</Text>
                </View>
              </View>
              <View className="h-px bg-gray-200" />
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
                No transactions found
              </Text>
            )
          }
        />
      )}

      {/* Filter modal */}
      <Modal visible={filterVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black bg-opacity-30">
          <View className="bg-white rounded-t-2xl p-4">
            <Text className="text-lg font-semibold mb-3">Filters</Text>

            <Text className="text-sm text-gray-600 mb-2">Date range</Text>
            <View className="flex-row mb-3">
              <TouchableOpacity onPress={() => setDatePreset("7d")} className={`px-3 py-2 mr-2 rounded-full ${datePreset === "7d" ? "bg-gray-200" : "bg-gray-100"}`}>
                <Text>Last 7 days</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setDatePreset("30d")} className={`px-3 py-2 mr-2 rounded-full ${datePreset === "30d" ? "bg-gray-200" : "bg-gray-100"}`}>
                <Text>Last 30 days</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setDatePreset("month")} className={`px-3 py-2 mr-2 rounded-full ${datePreset === "month" ? "bg-gray-200" : "bg-gray-100"}`}>
                <Text>This month</Text>
              </TouchableOpacity>
            </View>

            <Text className="text-sm text-gray-600 mb-2">Categories</Text>
            <View className="flex-row flex-wrap mb-3">
              {allCategories.map((c) => {
                const active = selectedCategories.includes(c);
                return (
                  <TouchableOpacity key={c} onPress={() => setSelectedCategories((s) => active ? s.filter(x => x !== c) : [...s, c])} className={`px-3 py-2 mr-2 mb-2 rounded-full ${active ? "bg-blue-600" : "bg-gray-100"}`}>
                    <Text className={`${active ? "text-white" : "text-gray-700"}`}>{c}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text className="text-sm text-gray-600 mb-2">Sort</Text>
            <View className="flex-row mb-4">
              <TouchableOpacity onPress={() => setSortMode("latest")} className={`px-3 py-2 mr-2 rounded-full ${sortMode === "latest" ? "bg-gray-200" : "bg-gray-100"}`}>
                <Text>Latest</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSortMode("high")} className={`px-3 py-2 mr-2 rounded-full ${sortMode === "high" ? "bg-gray-200" : "bg-gray-100"}`}>
                <Text>High → Low</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSortMode("low")} className={`px-3 py-2 mr-2 rounded-full ${sortMode === "low" ? "bg-gray-200" : "bg-gray-100"}`}>
                <Text>Low → High</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row justify-end">
              <Pressable onPress={() => { clearFilters(); }} className="px-4 py-2 mr-2">
                <Text className="text-red-600">Clear</Text>
              </Pressable>
              <Pressable onPress={() => { setFilterVisible(false); }} className="px-4 py-2 mr-2">
                <Text className="text-gray-700">Close</Text>
              </Pressable>
              <Pressable onPress={() => { setFilterVisible(false); }} className="bg-blue-600 px-4 py-2 rounded-full">
                <Text className="text-white">Apply</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
