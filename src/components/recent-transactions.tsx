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
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import useResolvedTheme from '@/hooks/useResolvedTheme';

export default function RecentTransactions() {
  const user = useAuthStore((s) => s.user);
  const transactions = useTransactionStore((state) => state.transactions);
  const loadTransactions = useTransactionStore((state) => state.loadTransactions);
  const deleteTransaction = useTransactionStore((state) => state.deleteTransaction);
  const isLoading = useTransactionStore((state) => state.isLoading);
  const deletingIds = useTransactionStore((state) => state.deletingIds);
  const router = useRouter();
  
  const { resolved, classFor } = useResolvedTheme();
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

  // choose some color fallbacks for inline icons/placeholders
  const iconTint = resolved === 'dark' ? '#9CA3AF' : '#6B7280';

  return (
    <SafeAreaView className={`flex-1 mx-2 mt-2 rounded-2xl p-2 ${classFor('bg-white','bg-neutral-900')}`}>
      <View className="px-2">
        {/* resolve theme for inner text/colors */}
        {/* use hook locally */}
        {/**/}
        <Text className={classFor('text-lg font-semibold mb-2 text-gray-700','text-lg font-semibold mb-2 text-white')}>Recent Transactions</Text>

        {/* Search bar + filter button */}
        <View className="flex-row items-center mb-3">
          <View className={`${classFor('flex-1 bg-gray-100','flex-1 bg-neutral-800')} rounded-full px-3 py-2 mr-2 flex-row items-center`}>
            <Ionicons name="search" size={18} color={iconTint} />
            <TextInput
              placeholder="Search expenses..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              className={classFor('ml-2 flex-1','ml-2 flex-1 text-gray-100')}
              placeholderTextColor={resolved === 'dark' ? '#9CA3AF' : '#6B7280'}
            />
          </View>
          <TouchableOpacity onPress={() => setFilterVisible(true)} className={classFor('bg-white p-2 rounded-full shadow','bg-neutral-800 p-2 rounded-full shadow')}>
            <Ionicons name="filter" size={20} color={iconTint} />
          </TouchableOpacity>
        </View>

        {/* Active chips row */}
        <View className="flex-row flex-wrap mb-2">
          {selectedCategories.map((c) => (
            <TouchableOpacity key={c} onPress={() => setSelectedCategories((s) => s.filter((x) => x !== c))} className={classFor('bg-blue-100 px-3 py-1 rounded-full mr-2 mb-2','bg-blue-800 px-3 py-1 rounded-full mr-2 mb-2')}>
              <Text className={classFor('text-sm text-blue-700','text-sm text-blue-100')}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

      </View>

        {isLoading && !refreshing ? (
        <View className="flex-1 justify-center items-center py-8">
          <ActivityIndicator size="large" color={resolved === 'dark' ? '#ffffff' : '#444444'} />
        </View>
      ) : (
        <FlatList
          data={visibleTransactions}
          keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/transaction/${item.id}`)}>
              <View>
                <View className="flex-row items-center justify-between py-3">
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 rounded-full mr-3 flex items-center justify-center" style={{ backgroundColor: getCategoryColor(item.name) }}>
                      <Ionicons name={getCategoryIcon(item.name) as IoniconName} size={20} color="#fff" />
                    </View>
                    <View>
                        <Text className={classFor('text-gray-800 font-medium','text-white font-medium')}>{item.name}</Text>
                        <Text className={classFor('text-gray-400 text-sm','text-neutral-400 text-sm')}>{item.date}</Text>
                    </View>
                  </View>

                  <View className="flex-row items-center">
                    <Text className={classFor('text-gray-900 font-bold','text-white font-bold')}>₹{(item.amount || 0).toFixed(0)}</Text>
                  </View>
                </View>
                <View className={classFor('h-px bg-gray-200','h-px bg-neutral-700')} />
              </View>
            </Pressable>
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
              <Text className={classFor('text-center text-gray-400 mt-10','text-center text-neutral-400 mt-10')}>
                No transactions found
              </Text>
            )
          }
        />
      )}

      {/* Filter modal */}
      <Modal visible={filterVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black bg-opacity-30">
          <View className={classFor('bg-white rounded-t-2xl p-4','bg-neutral-800 rounded-t-2xl p-4')}>
            <Text className={classFor('text-lg font-semibold mb-3 text-gray-800','text-lg font-semibold mb-3 text-white')}>Filters</Text>

            <Text className={classFor('text-sm text-gray-600 mb-2','text-sm text-neutral-300 mb-2')}>Date range</Text>
            <View className="flex-row mb-3">
              <TouchableOpacity onPress={() => setDatePreset("7d")} className={`px-3 py-2 mr-2 rounded-full ${datePreset === "7d" ? classFor('bg-gray-400','bg-neutral-700') : classFor('bg-gray-100','bg-neutral-800')}`}>
                <Text className={classFor('text-gray-800','text-white')}>Last 7 days</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setDatePreset("30d")} className={`px-3 py-2 mr-2 rounded-full ${datePreset === "30d" ? classFor('bg-gray-400','bg-neutral-700') : classFor('bg-gray-100','bg-neutral-800')}`}>
                <Text className={classFor('text-gray-800','text-white')}>Last 30 days</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setDatePreset("month")} className={`px-3 py-2 mr-2 rounded-full ${datePreset === "month" ? classFor('bg-gray-400','bg-neutral-700') : classFor('bg-gray-100','bg-neutral-800')}`}>
                <Text className={classFor('text-gray-800','text-white')}>This month</Text>
              </TouchableOpacity>
            </View>

            <Text className={classFor('text-sm text-gray-600 mb-2','text-sm text-neutral-300 mb-2')}>Categories</Text>
            <View className="flex-row flex-wrap mb-3">
              {allCategories.map((c) => {
                const active = selectedCategories.includes(c);
                return (
                  <TouchableOpacity key={c} onPress={() => setSelectedCategories((s) => active ? s.filter(x => x !== c) : [...s, c])} className={`${active ? classFor('px-3 py-2 mr-2 mb-2 rounded-full bg-blue-600','px-3 py-2 mr-2 mb-2 rounded-full bg-blue-700') : classFor('px-3 py-2 mr-2 mb-2 rounded-full bg-gray-100','px-3 py-2 mr-2 mb-2 rounded-full bg-neutral-800')}`}>
                    <Text className={active ? classFor('text-white','text-white') : classFor('text-gray-700','text-neutral-300')}>{c}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text className={classFor('text-sm text-gray-600 mb-2','text-sm text-neutral-300 mb-2')}>Sort</Text>
            <View className="flex-row mb-4">
              <TouchableOpacity onPress={() => setSortMode("latest")} className={`px-3 py-2 mr-2 rounded-full ${sortMode === "latest" ? classFor('bg-gray-400','bg-neutral-700') : classFor('bg-gray-100','bg-neutral-800')}`}>
                <Text className={classFor('text-gray-800','text-white')}>Latest</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSortMode("high")} className={`px-3 py-2 mr-2 rounded-full ${sortMode === "high" ? classFor('bg-gray-400','bg-neutral-700') : classFor('bg-gray-100','bg-neutral-800')}`}>
                <Text className={classFor('text-gray-800','text-white')}>High → Low</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSortMode("low")} className={`px-3 py-2 mr-2 rounded-full ${sortMode === "low" ? classFor('bg-gray-400','bg-neutral-700') : classFor('bg-gray-100','bg-neutral-800')}`}>
                <Text className={classFor('text-gray-800','text-white')}>Low → High</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row justify-end">
              <Pressable onPress={() => { clearFilters(); }} className="px-4 py-2 mr-2">
                <Text className={classFor('text-red-600','text-red-400')}>Clear</Text>
              </Pressable>
              <Pressable onPress={() => { setFilterVisible(false); }} className="px-4 py-2 mr-2">
                <Text className={classFor('text-gray-700','text-neutral-300')}>Close</Text>
              </Pressable>
              <Pressable onPress={() => { setFilterVisible(false); }} className={classFor('bg-blue-600 px-4 py-2 rounded-full','bg-blue-600 px-4 py-2 rounded-full')}>
                <Text className="text-white">Apply</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
