import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Pressable, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
type IoniconName = ComponentProps<typeof Ionicons>["name"];
import { useRouter, useLocalSearchParams } from "expo-router";
import DateInput from "@/components/date-input";
import { useTransactionStore } from "@/store/transactionStore";
import { useAuthStore } from "@/store/authStore";

type Category = {
  name: string;
  icon: IoniconName;
  color: string;
};

export default function AddExpenseScreen() {
  const router = useRouter();
  const addTransaction = useTransactionStore((state) => state.addTransaction);
  const updateTransaction = useTransactionStore((state) => (state as any).updateTransaction);
  const transactions = useTransactionStore((state) => state.transactions);
  const isSaving = useTransactionStore((state) => state.isSaving);
  const { id } = useLocalSearchParams();
  const user = useAuthStore((s) => s.user);

  const isEditing = Boolean(id);

  const categories: Category[] = [
    { name: "Food", icon: "restaurant-outline", color: "#e0583b" },
    { name: "Travel", icon: "airplane-outline", color: "#34a853" },
    { name: "Shopping", icon: "cart-outline", color: "#fbbc05" },
    { name: "Bills", icon: "document-text-outline", color: "#4285f4" },
    { name: "Entertainment", icon: "film-outline", color: "#aa66cc" },
    { name: "Health", icon: "heart-outline", color: "#ff4444" },
    { name: "Misc", icon: "ellipsis-horizontal-outline", color: "#9e9e9e" }
  ];

  // Local state
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [date, setDate] = useState(new Date());
  const [title, setTitle] = useState("");

  const handleSave = async () => {
    if (!amount || !selectedCategory || isSaving) return Alert.alert("Error", "Please fill amount and category.");
    const transaction = {
      name: title || selectedCategory.name,
      amount: parseFloat(amount),
      date: date.toISOString(),
      category: selectedCategory.name,
      user_id: user?.id,
    };
    console.log("Saving transaction:", transaction);
    try {
      if (id) {
        // editing existing transaction
        await updateTransaction(id as string, transaction);
      } else {
        await addTransaction(transaction); // store handles saving flag + supabase call
      }
      router.back();
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Failed to save transaction. Please try again.");
    }
  };

  // Prefill when editing
  useEffect(() => {
    if (!id) return;
    const tx = transactions.find((t) => String(t.id) === String(id)) as any;
    if (!tx) return;
    setAmount(String(tx.amount || ""));
    setTitle(tx.title || tx.name || "");
    setDate(tx.date ? new Date(tx.date) : new Date());
    const cat = categories.find((c) => c.name === (tx.category || tx.name));
    if (cat) setSelectedCategory(cat);
  }, [id, transactions]);
  return (
    <ScrollView className="flex-1 px-5 py-8 bg-[#f5f8fd]">
      <View>
        {/* Header */}
        <View className="flex-row items-center my-4">
          <Ionicons onPress={() => router.back()} name="arrow-back-outline" size={24} color="#000" />
          <Text className="flex-1 text-center text-2xl font-bold">{isEditing ? "Edit Expense" : "Add Expense"}</Text>
        </View>

        {/* Amount */}
        <Text className="mt-5 mb-2 text-gray-500 font-medium">Amount</Text>
        <View className="flex-row items-center bg-white rounded-lg px-4 border-gray-300 border">
          <Text className="text-xl mr-2">₹</Text>
          <TextInput
            className="text-xl flex-1 py-2"
            placeholder="Enter amount"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
        </View>

        {/* Expense Title */}
        <Text className="mt-5 mb-2 text-gray-500 font-medium">Title (Optional)</Text>
        <View className="flex-row items-center bg-white rounded-lg px-4 border-gray-300 border">
          <Ionicons name="document-text-outline" size={20} color="#777" />
          <TextInput
            className="text-xl flex-1 py-2 ml-2"
            placeholder="What was the expense for?"
            value={title}
            onChangeText={setTitle}
          />
        </View>


        {/* Category */}
        <Text className="mt-5 mb-2 text-gray-500 font-medium">Category</Text>
        <View className="flex-row flex-wrap mt-3">
          {categories.map((category, index) => (
            <Pressable
              key={index}
              onPress={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full mr-3 mb-3 flex-row items-center shadow-sm border ${selectedCategory?.name === category.name
                  ? "border-blue-500 bg-blue-100"
                  : "border-gray-200 bg-white"
                }`}
            >
              <Ionicons name={category.icon} size={20} color={category.color} style={{ marginRight: 6 }} />
              <Text className="text-neutral-700 font-medium">{category.name}</Text>
            </Pressable>
          ))}
        </View>

        {/* Date */}
        <DateInput date={date} setDate={setDate} />

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          className="mt-8 bg-[#277cf6] rounded-full py-4 shadow-lg"
        >
          {isSaving ? (
            <View className="flex-row justify-center items-center">
              <ActivityIndicator color="#fff" />
              <Text className="ml-3 text-center text-lg font-semibold text-white">Saving...</Text>
            </View>
          ) : (
            <Text className="text-center text-lg font-semibold text-white">{isEditing ? "Update Expense" : "Save Expense"}</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
