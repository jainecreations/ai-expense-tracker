import EmptyListScreen from '@/components/empty-list';
import HomeMenu from '@/components/home-menu';
import RecentTransactions from '@/components/recent-transactions';
import { useAuthStore } from '@/store/authStore';
import { useTransactionStore } from '@/store/transactionStore';
import { getFirstName } from '@/utils/helper';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import useResolvedTheme from '@/hooks/useResolvedTheme';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
    const user = useAuthStore((s) => s.user);
  
  const [menuVisible, setMenuVisible] = useState(false);

  const transactions = useTransactionStore((state) => state.transactions);
  // monthly expenses: sum transactions for current month/year
  const now = new Date();
  const monthlyExpenses = transactions
    .filter((tx) => {
      const d = new Date((tx as any).date || (tx as any).created_at || (tx as any).timestamp || (tx as any).time);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, txn) => sum + (txn.amount || 0), 0)
    .toFixed(2);
  const loadTransactions = useTransactionStore((state) => state.loadTransactions);
  
    useEffect(() => {
      loadTransactions();
    }, [user]);

  const { resolved, classFor } = useResolvedTheme();
  const statusBarStyle = resolved === 'dark' ? 'light' : 'dark';

  return (
    <SafeAreaView className={`flex-1 flex pt-4 ${classFor('bg-white','bg-neutral-900')}`}>
      <StatusBar style={statusBarStyle} />
      <View className="flex-row justify-between items-center px-4 mb-4">
        <View className="mb-4">
        <Text className={classFor('text-2xl font-bold text-gray-800 mb-1','text-2xl font-bold text-white mb-1')}>
          Hi {getFirstName(user?.user_metadata?.full_name)} 👋
        </Text>
        <Text className={classFor('text-gray-500','text-neutral-300')}>
            Track smarter. Spend wiser.
        </Text>
        </View>
        <Pressable onPress={() => setMenuVisible(true)}>
          <Ionicons color={classFor('bg-neutral-900','white')} name="person-circle-outline" size={32} />
        </Pressable>
      </View>
      {/* <Text className="text-xl font-bold text-center">
        Monthly Summary
      </Text> */}
      <View className={`${classFor('bg-neutral-800', 'bg-white')} shadow-md rounded-2xl p-6 mx-4 my-4 items-center`}>
          <Text className={classFor('text-3xl font-bold text-white mb-2','text-3xl font-bold text-gray-800 mb-2')}>
          ₹{monthlyExpenses}
        </Text>
        <Text className={classFor('text-gray-500 text-sm','text-neutral-700 text-sm')}>
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