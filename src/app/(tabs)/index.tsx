import EmptyListScreen from '@/components/empty-list';
import HomeMenu from '@/components/home-menu';
import RecentTransactions from '@/components/recent-transactions';
import { useAuthStore } from '@/store/authStore';
import { useTransactionStore } from '@/store/transactionStore';
import { getFirstName } from '@/utils/helper';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
    const user = useAuthStore((s) => s.user);
  
  const [menuVisible, setMenuVisible] = useState(false);

  const transactions = useTransactionStore((state) => state.transactions);
  const totalExpenses = transactions.reduce((sum, txn) => sum + txn.amount, 0).toFixed(2);
  const loadTransactions = useTransactionStore((state) => state.loadTransactions);
  
    useEffect(() => {
      loadTransactions();
    }, [user]);

  return (
    <SafeAreaView className="flex-1 flex pt-4 bg-white">
      <StatusBar style="dark" />
      <View className="flex-row justify-between items-center px-4 mb-4">
        <View className="mb-4">
        <Text className="text-2xl font-bold text-gray-800 mb-1">
          Hi {getFirstName(user?.user_metadata?.full_name)} 👋
        </Text>
        <Text>
            Track smarter. Spend wiser.
        </Text>
        </View>
        <Pressable onPress={() => setMenuVisible(true)}>
          <Ionicons name="person-circle-outline" size={32} />
        </Pressable>
      </View>
      {/* <Text className="text-xl font-bold text-center">
        Monthly Summary
      </Text> */}
      <View className="bg-neutral-800 shadow-md rounded-2xl p-6 mx-4 my-4 items-center">
        <Text className="text-3xl font-bold text-white mb-2">
          ₹{totalExpenses}
        </Text>
        <Text className="text-gray-500 text-sm">
          Total Expenses This Month
        </Text>
      </View>
      <View className="flex-1">
        {transactions.length ?
          <RecentTransactions /> :
          <EmptyListScreen />}
      </View>
      {/* Bottom Menu */}
      {menuVisible && <HomeMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />}
    </SafeAreaView>
  );
}