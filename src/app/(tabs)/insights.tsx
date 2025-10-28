import React, { useMemo } from "react";
import { View, Text, Dimensions, ScrollView } from "react-native";
import { PieChart } from "react-native-chart-kit";
import { useTransactionStore } from "@/store/transactionStore";
import { getCategoryColor } from "@/utils/helper";
import { SafeAreaView } from "react-native-safe-area-context";

const screenWidth = Dimensions.get("window").width - 32;

export default function Insights() {
  const transactions = useTransactionStore((state) => state.transactions);

  // Prepare chart data
  const chartData = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach((tx) => {
      map[tx.category] = (map[tx.category] || 0) + tx.amount;
    });

    return Object.entries(map).map(([category, amount]) => ({
      name: category,
      amount,
      color: getCategoryColor(category),
      legendFontColor: "#6B7280",
      legendFontSize: 14,
    }));
  }, [transactions]);

  const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 bg-[#F3F4F6] px-4 py-6">
        {/* Header */}
        <Text className="text-3xl font-bold text-gray-800 mb-6">Insights</Text>

        {/* Total Expenses Card */}
        <View className="bg-white rounded-2xl p-6 mb-6 shadow-lg">
          <Text className="text-gray-400 font-medium text-sm text-center">Total Expenses</Text>
          <Text className="text-4xl font-bold text-red-500 mt-2 text-center">
            ₹{totalAmount.toFixed(2)}
          </Text>
        </View>

        {/* Donut Chart Card */}
        <View className="bg-white rounded-2xl p-4 shadow-lg">
          <Text className="text-lg font-semibold mb-4 text-gray-700">
            Expenses by Category
          </Text>

          {chartData.length > 0 ? (
            <View style={{ position: "relative", alignItems: "center" }}>
              <PieChart
                data={chartData}
                width={screenWidth}
                height={220}
                chartConfig={{
                  backgroundGradientFrom: "#fff",
                  backgroundGradientTo: "#fff",
                  color: () => `#000`,
                }}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="8"
                absolute
              />
              {/* Inner circle for donut effect */}
              {/* <View
              style={{
                position: "absolute",
                top: 60,
                left: screenWidth / 2 - 155,
                width: 110,
                height: 110,
                borderRadius: 55,
                backgroundColor: "#F3F4F6",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text className="text-gray-800 font-bold text-xl">
                ₹{totalAmount.toFixed(0)}
              </Text>
            </View> */}
            </View>
          ) : (
            <Text className="text-gray-400 text-center py-20">
              No transactions to show
            </Text>
          )}
        </View>
      </ScrollView>
      </SafeAreaView>
      );
}
