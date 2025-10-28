import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function EmptyListScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center bg-[#f5f8fd] px-6">
      <View className="items-center">
        <View className="bg-white rounded-full p-6 shadow-md mb-4">
          <Ionicons name="wallet-outline" size={48} color="#277cf6" />
        </View>

        <Text className="text-xl font-semibold text-gray-800 mb-2">
          No Transactions Yet
        </Text>
        <Text className="text-gray-500 text-center mb-8">
          Start tracking your expenses to see them appear here.
        </Text>

        <TouchableOpacity
          onPress={() => router.push("/add-expense")}
          className="bg-[#277cf6] rounded-full px-6 py-3 shadow-lg active:opacity-90"
        >
          <Text className="text-white text-lg font-semibold">
            Add Your First Expense
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
