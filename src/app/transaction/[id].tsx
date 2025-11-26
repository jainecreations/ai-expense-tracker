import React, { useEffect } from "react";
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTransactionStore } from "@/store/transactionStore";
import { getCategoryColor, getCategoryIcon } from "@/utils/helper";
import { SafeAreaView } from "react-native-safe-area-context";

function formatDate(d?: string) {
  if (!d) return "-";
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return d;
  }
}

export default function TransactionDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const transactions = useTransactionStore((s) => s.transactions);
  const loadTransactions = useTransactionStore((s) => s.loadTransactions);
  const isLoading = useTransactionStore((s) => s.isLoading);
  const deleteTransaction = useTransactionStore((s) => s.deleteTransaction);
  
  // Robust lookup: compare string forms (route params may be strings)
  const tx = transactions.find((t) => String(t.id) === String(id));
  
  useEffect(() => {
    // If transactions aren't loaded yet, fetch them so we can find the one by id
    if ((!transactions || transactions.length === 0) && !isLoading) {
      loadTransactions();
    }
  }, [id, transactions, isLoading]);
  const t = tx as any;

  if (!tx) {
    // show loader while transactions are being fetched
    if (isLoading) {
      return (
        <SafeAreaView className="flex-1 bg-white px-4 py-6 justify-center items-center">
          <ActivityIndicator size="large" />
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView className="flex-1 bg-white px-4 py-6 justify-center items-center">
        <Text className="text-gray-500">Transaction not found</Text>
      </SafeAreaView>
    );
  }

  const handleDelete = () => {
    Alert.alert("Delete Transaction", "Are you sure you want to delete this transaction?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        await deleteTransaction(id as string);
        router.back();
      } }
    ]);
  };

  const handleEdit = () => {
    // Navigate to add-expense with id param (edit flow can read this param)
    router.push(`/add-expense?id=${id}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f5f8fd]">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Header with back button */}
        <View className="flex-row items-center mb-4">
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back-outline" size={22} color="#000" />
          </Pressable>
          <Text className="flex-1 text-center text-lg font-semibold">Transaction details</Text>
          <View style={{ width: 22 }} />
        </View>
        {/* Icon */}
        <View className="items-center mb-6">
          <View className="w-24 h-24 rounded-full items-center justify-center" style={{ backgroundColor: getCategoryColor(tx.name) }}>
            <Ionicons name={getCategoryIcon(tx.name) as any} size={44} color="#fff" />
          </View>
        </View>

        {/* Amount and category */}
        <View className="items-center mb-6">
          <Text className="text-4xl font-bold text-gray-900">₹{(tx.amount || 0).toFixed(2)}</Text>
          <Text className="text-gray-600 mt-1">{tx.name}</Text>
        </View>

        {/* Details card */}
        <View className="bg-white rounded-2xl p-4 shadow-lg mb-6">
          <View className="mb-3">
            <Text className="text-sm text-gray-500">Title</Text>
            <Text className="text-gray-800 font-medium">{t?.title || tx.name}</Text>
          </View>

          <View className="mb-3">
            <Text className="text-sm text-gray-500">Date</Text>
            <Text className="text-gray-800">{formatDate(tx.date)}</Text>
          </View>

          <View className="mb-3">
            <Text className="text-sm text-gray-500">Category</Text>
            <Text className="text-gray-800">{tx.category || tx.name}</Text>
          </View>

          <View>
            <Text className="text-sm text-gray-500">Notes</Text>
            <Text className="text-gray-800">{t?.notes || t?.note || "—"}</Text>
          </View>
        </View>

        {/* Buttons */}
        <View className="flex-row justify-between">
          <Pressable onPress={handleEdit} className="flex-1 mr-2 bg-white py-3 rounded-full items-center shadow">
            <Text className="text-blue-600 font-semibold">Edit</Text>
          </Pressable>
          <Pressable onPress={handleDelete} className="flex-1 ml-2 bg-red-600 py-3 rounded-full items-center shadow">
            <Text className="text-white font-semibold">Delete</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
