import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { PieChart, LineChart, BarChart } from "react-native-chart-kit";
import { useTransactionStore } from "@/store/transactionStore";
import { getCategoryColor } from "@/utils/helper";
import { SafeAreaView } from "react-native-safe-area-context";

const screenWidth = Dimensions.get("window").width - 32;

function formatMonthLabel(date: Date) {
  return date.toLocaleString(undefined, { month: "long", year: "numeric" });
}

export default function Insights() {
  const transactions = useTransactionStore((state) => state.transactions) as any[];
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  // Filter transactions for selected month/year
  const monthlyTx = useMemo(() => {
    const m = currentMonth.getMonth();
    const y = currentMonth.getFullYear();
    return transactions.filter((tx) => {
      const d = new Date(tx.date || tx.created_at || tx.timestamp || tx.time);
      return d.getMonth() === m && d.getFullYear() === y;
    });
  }, [transactions, currentMonth]);

  const totalAmount = monthlyTx.reduce((s, t) => s + (t.amount || 0), 0);

  // Category aggregation
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    monthlyTx.forEach((tx) => {
      const key = tx.category || tx.categoryId || tx.title || "Other";
      map[key] = (map[key] || 0) + (tx.amount || 0);
    });
    const arr = Object.entries(map).map(([name, amount]) => ({ name, amount }));
    arr.sort((a, b) => b.amount - a.amount);
    return arr;
  }, [monthlyTx]);

  const pieData = categoryData.map((c) => ({
    name: c.name,
    amount: c.amount,
    color: getCategoryColor(c.name),
    legendFontColor: "#6B7280",
    legendFontSize: 12,
  }));

  // Simple weekly buckets (Week 1..4)
  const weekly = useMemo(() => {
    const buckets = [0, 0, 0, 0];
    monthlyTx.forEach((tx) => {
      const d = new Date(tx.date || tx.created_at || tx.timestamp || tx.time);
      const day = d.getDate();
      const week = Math.min(3, Math.floor((day - 1) / 7));
      buckets[week] += tx.amount || 0;
    });
    return buckets;
  }, [monthlyTx]);

  // Previous month total for comparison
  const prevMonthTotal = useMemo(() => {
    const prev = new Date(currentMonth);
    prev.setMonth(prev.getMonth() - 1);
    const m = prev.getMonth();
    const y = prev.getFullYear();
    return transactions
      .filter((tx) => {
        const d = new Date(tx.date || tx.created_at || tx.timestamp || tx.time);
        return d.getMonth() === m && d.getFullYear() === y;
      })
      .reduce((s, t) => s + (t.amount || 0), 0);
  }, [transactions, currentMonth]);

  const prevMonthDate = new Date(currentMonth);
  prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
  const prevMonthLabel = formatMonthLabel(prevMonthDate);

  const percentChange = useMemo(() => {
    if (prevMonthTotal === 0) return null;
    return ((totalAmount - prevMonthTotal) / prevMonthTotal) * 100;
  }, [totalAmount, prevMonthTotal]);

  const prevMonth = () => {
    const d = new Date(currentMonth);
    d.setMonth(d.getMonth() - 1);
    setCurrentMonth(d);
  };
  const nextMonth = () => {
    const d = new Date(currentMonth);
    d.setMonth(d.getMonth() + 1);
    setCurrentMonth(d);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 bg-white px-4 py-6">
        {/* Header */}
        <Text className="text-3xl font-bold text-gray-800 mb-4">Insights</Text>

        {/* Month selector pill */}
        <View className="flex-row items-center justify-center mb-6">
          <View className="flex-row items-center bg-white rounded-full px-3 py-2 shadow">
            <TouchableOpacity onPress={prevMonth} className="px-2">
              <Text className="text-lg">◀</Text>
            </TouchableOpacity>
            <Text className="px-4 text-gray-700 font-medium">{formatMonthLabel(currentMonth)}</Text>
            <TouchableOpacity onPress={nextMonth} className="px-2">
              <Text className="text-lg">▶</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Grid of cards */}
        <View className="space-y-4">
          {/* Card 1: Total Expenses */}
          <View className="bg-white rounded-2xl p-4 shadow-lg items-center">
            <Text className="text-sm text-gray-400">Total Expenses This Month</Text>
            <Text className="text-4xl font-bold text-red-500 mt-2">₹{totalAmount.toFixed(2)}</Text>

            {/* Sparkline */}
            {/* <View className="mt-3">
              <LineChart
                data={{
                  labels: [],
                  datasets: [
                    { data: monthlyTx.slice(-8).map((t) => t.amount || 0) || [0, 0, 0, 0, 0] },
                  ],
                }}
                width={screenWidth}
                height={60}
                withDots={false}
                withInnerLines={false}
                withOuterLines={false}
                chartConfig={{
                  backgroundGradientFrom: "#fff",
                  backgroundGradientTo: "#fff",
                  color: () => `#34D399`,
                }}
                bezier
                style={{ paddingRight: 0 }}
              />
            </View> */}

            {/* Dynamic comparison vs previous month */}
            {prevMonthTotal === 0 ? (
              totalAmount === 0 ? (
                <Text className="mt-2 text-sm text-gray-500">No expenses compared to {prevMonthLabel}</Text>
              ) : (
                <Text className="mt-2 text-sm text-yellow-600"></Text>
              )
            ) : percentChange === 0 ? (
              <Text className="mt-2 text-sm text-gray-500">No change compared to {prevMonthLabel}</Text>
            ) : percentChange! > 0 ? (
              <Text className="mt-2 text-sm text-red-600">↑ {Math.abs(percentChange!).toFixed(0)}% compared to {prevMonthLabel}</Text>
            ) : (
              <Text className="mt-2 text-sm text-green-600">↓ {Math.abs(percentChange!).toFixed(0)}% compared to {prevMonthLabel}</Text>
            )}
          </View>

          {/* Card 2: Donut + Legend */}
          <View className="bg-white rounded-2xl p-4 shadow-lg mt-4">
            <Text className="text-lg font-semibold mb-3 text-gray-700">Category Breakdown</Text>
            {pieData.length > 0 ? (
              <View className="flex-row">
                {/* <View style={{ position: "relative", flex: 1, alignItems: "center" }}> */}
                  <PieChart
                    data={pieData}
                    width={screenWidth}
                    height={200}
                    chartConfig={{
                      backgroundGradientFrom: "#fff",
                      backgroundGradientTo: "#fff",
                      color: () => `#000`,
                    }}
                    accessor="amount"
                    backgroundColor="transparent"
                    paddingLeft="0"
                    hasLegend={true}
                    absolute
                  />
                {/* </View> */}

                {/* <View style={{ flex: 1, paddingLeft: 8 }}> */}
                  {/* <View style={{ flexDirection: "column", flexWrap: "wrap" }}>
                    {pieData.map((p, idx) => (
                      <View key={p.name} style={{ width: "50%", flexDirection: "row", alignItems: "center", paddingVertical: 6 }}>
                        <View style={{ width: 10, height: 10, backgroundColor: p.color, borderRadius: 3, marginRight: 8 }} />
                        <View>
                          <Text className="text-sm text-gray-700">{p.name}</Text>
                          <Text className="text-xs text-gray-400">₹{p.amount.toFixed(0)}</Text>
                        </View>
                      </View>
                    ))}
                  </View> */}
                {/* </View> */}
              </View>
            ) : (
              <Text className="text-gray-400 text-center py-8">No data</Text>
            )}
          </View>

          {/* Card 3: Top Categories */}
          <View className="bg-white rounded-2xl p-4 shadow-lg mt-4">
            <Text className="text-lg font-semibold mb-3 text-gray-700">Top Categories This Month</Text>
            <View className="space-y-3">
              {categoryData.slice(0, 5).map((c, i) => {
                const pct = categoryData.length ? (c.amount / categoryData[0].amount) : 0;
                return (
                  <View key={c.name} className="flex-row items-center">
                    <View className="w-14">
                      <Text className="text-sm text-gray-700">{c.name}</Text>
                      <Text className="text-xs text-gray-400">₹{c.amount.toFixed(0)}</Text>
                    </View>
                    <View className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden mr-2">
                      <View style={{ width: `${Math.max(8, pct * 100)}%`, height: 32, backgroundColor: getCategoryColor(c.name) }} />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Card 4: Weekly Spend */}
          <View className="bg-white rounded-2xl p-4 shadow-lg my-4">
            <Text className="text-lg font-semibold mb-3 text-gray-700">Weekly Spend</Text>
            <BarChart
              data={{ labels: ["W1", "W2", "W3", "W4"], datasets: [{ data: weekly }] }}
              width={screenWidth}
              height={160}
              fromZero
              showValuesOnTopOfBars={true}
              withInnerLines={false}
              withHorizontalLabels={false}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{
                backgroundGradientFrom: "#fff",
                backgroundGradientTo: "#fff",
                color: () => `#60A5FA`,
                fillShadowGradient: "#60A5FA",
                fillShadowGradientOpacity: 1,
              }}
              style={{ paddingRight: 0 }}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({});
