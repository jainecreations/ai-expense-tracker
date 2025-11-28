import React, { useEffect, useState, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TextInput, TouchableOpacity, Animated, LayoutChangeEvent } from 'react-native';
import { useTransactionStore } from '@/store/transactionStore';
import { useBudgetStore } from '@/store/budgetStore';
import useResolvedTheme from '@/hooks/useResolvedTheme';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

function monthKey(d = new Date()) {
  return d.toISOString().slice(0, 7); // YYYY-MM
}

export default function MonthlyBudget() {
    const router = useRouter();
  const { classFor } = useResolvedTheme();
  const transactions = useTransactionStore((s) => s.transactions) as any[];
  const { amount: storedBudget, month, loadBudget, setBudget, loading } = useBudgetStore();
  const [editValue, setEditValue] = useState<string>('');

  // compute current month totals
  const now = new Date();
  const key = monthKey(now);
  useEffect(() => {
    loadBudget(key);
  }, [key]);

  useEffect(() => {
    if (storedBudget != null) setEditValue(String(Math.round(storedBudget)));
  }, [storedBudget]);

  const monthTx = transactions.filter((t) => {
    const d = new Date(t.date || t.created_at || t.timestamp || t.time);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const spent = monthTx.reduce((s, t) => s + (t.amount || 0), 0);
  const budget = storedBudget || 0;
  const pct = budget > 0 ? Math.round((spent / budget) * 100) : 0;

  // colors (hex) for progress bar
  const progressColorHex = pct >= 100 ? '#EF4444' : pct >= 80 ? '#F59E0B' : '#10B981';

  // animated width logic: measure container width and animate numeric value to target
  const [barWidth, setBarWidth] = useState(0);
  const anim = useRef(new Animated.Value(0)).current; // 0..1

  useEffect(() => {
    const target = Math.min(100, Math.max(0, pct)) / 100;
    Animated.timing(anim, { toValue: target, duration: 600, useNativeDriver: false }).start();
  }, [pct, anim]);

  const animatedWidth = anim.interpolate({ inputRange: [0, 1], outputRange: [0, barWidth] });

  const handleSave = async () => {
    const v = Number(editValue.replace(/[^0-9.]/g, '')) || 0;
    await setBudget(v, key);
  };

  return (
    <SafeAreaView className={`flex-1 ${classFor('bg-white','bg-neutral-900')}`}>
      <View className="px-4 py-6">
        {/* Header */}
        <View className="flex-row items-center my-4">
            <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="gray" />
            </TouchableOpacity>
            <Text className={classFor('flex-1 text-center text-2xl font-bold text-gray-800','flex-1 text-center text-2xl font-bold text-white')}>Monthly Budget</Text>
        </View>

        {/* Progress Card */}
        <View className={`${classFor('bg-white','bg-neutral-800')} rounded-2xl p-4 shadow-lg mb-4`}>
          <Text className={classFor('text-sm text-gray-500','text-sm text-gray-300')}>{format(now, 'MMMM yyyy')}</Text>
          <Text className={classFor('text-4xl font-bold text-gray-900 mt-2','text-4xl font-bold text-white mt-2')}>₹{spent.toFixed(0)}</Text>

          <View className="mt-4">
            <View onLayout={(e: LayoutChangeEvent) => setBarWidth(e.nativeEvent.layout.width)} className={`${classFor('w-full bg-gray-200 rounded-full h-4 overflow-hidden','w-full bg-neutral-700 rounded-full h-4 overflow-hidden')}`}>
              <Animated.View style={{ width: animatedWidth, height: 16, backgroundColor: progressColorHex, borderRadius: 8 }} />
            </View>
            <Text className={classFor('mt-2 text-sm text-gray-600','mt-2 text-sm text-neutral-300')}>₹{spent.toFixed(0)} spent of ₹{budget.toFixed(0)} ({pct}%)</Text>
            <View className="mt-2">
              {pct >= 100 ? (
                <Text className="text-sm text-red-600 font-semibold">Over Budget</Text>
              ) : pct >= 80 ? (
                <Text className="text-sm text-yellow-600 font-semibold">Approaching budget</Text>
              ) : (
                <Text className="text-sm text-emerald-600 font-semibold">On Track</Text>
              )}
            </View>
          </View>
        </View>

        {/* Edit Budget Card */}
        <View className={`${classFor('bg-white','bg-neutral-800')} rounded-2xl p-4 shadow-lg`}>
          <Text className={classFor('text-lg font-semibold mb-2 text-gray-700','text-lg font-semibold mb-2 text-white')}>Edit Monthly Budget</Text>
          <View className="flex-row items-center">
            <Text className={classFor('text-xl mr-2 text-gray-800','text-xl mr-2 text-white')}>₹</Text>
            <TextInput
              value={editValue}
              onChangeText={setEditValue}
              keyboardType="numeric"
              className={classFor('flex-1 py-3 px-3 rounded-lg border border-gray-200 bg-white','flex-1 py-3 px-3 rounded-lg border border-neutral-700 bg-neutral-800')}
              placeholder="Enter monthly budget"
              placeholderTextColor={"#9CA3AF"}
            />
          </View>
          <TouchableOpacity onPress={handleSave} disabled={loading} className="mt-4 bg-blue-600 py-3 rounded-full">
            <Text className="text-center text-white font-semibold">Save Budget</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
