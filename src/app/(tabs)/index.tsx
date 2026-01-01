import EmptyListScreen from '@/components/empty-list';
import HomeMenu from '@/components/home-menu';
import RecentTransactions from '@/components/recent-transactions';
import SmartCapturesCard from '@/components/smart-captures-card';
import { useAuthStore } from '@/store/authStore';
import { useTransactionStore } from '@/store/transactionStore';
import { getFirstName } from '@/utils/helper';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import useResolvedTheme from '@/hooks/useResolvedTheme';
import { useEffect, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable } from 'react-native';
import useSmsImportStore from '@/store/smsImportStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PermissionsAndroid, NativeModules } from 'react-native';
import smsService from '@/lib/smsService';
            import { Platform } from 'react-native';


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
      <SmartCapturesCard />
      <View className="flex-1">
        {transactions.length ?
          <RecentTransactions /> :
          <EmptyListScreen />}
      </View>
      {/* Bottom Menu */}
      {menuVisible && <HomeMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />}
      {/* Button: fetch and process pending SMS persisted natively (for manual testing) */}
      <Pressable
        onPress={async () => {
          try {
console.log("sssdsddsds", Platform.OS);
console.log('=====NativeModules keys:', Object.keys(NativeModules));
console.log('======UIManager:', NativeModules.UIManager);
            // Try native module rawPending first (non-destructive) for debugging
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            // const { NativeModules } = require('react-native');
            const SmsMod = NativeModules?.SmsEventModule || NativeModules?.SmsEventEmitter || NativeModules?.SmsRetrieverModule || NativeModules?.SmsRetriever || null;

            console.log('NativeModules keysss:', Object.keys(require('react-native').NativeModules));
            let pending: any[] = [];
            if (SmsMod) {
              if (typeof SmsMod.rawPending === 'function') {
                const raw = await SmsMod.rawPending();
                // eslint-disable-next-line no-console
                console.log('rawPending returned', raw?.length ?? raw);
                try {
                  pending = JSON.parse(raw || '[]');
                } catch (e) {
                  console.warn('rawPending JSON parse failed', e);
                  pending = [];
                }
              } else if (typeof SmsMod.readPending === 'function') {
                // readPending is destructive (clears pending) but may be the only API available
                const arr = await SmsMod.readPending();
                // eslint-disable-next-line no-console
                console.log('readPending returned length', arr?.length ?? 0);
                pending = arr || [];
              }
            } else {
              console.warn('No native SMS module available');
            }

            console.log('Fetched pending SMS count=', pending?.length ?? 0);
            for (const m of (pending || [])) {
              try {
                const body = m?.body ?? m?.messageBody ?? m?.raw_text ?? '';
                const originatingAddress = m?.originatingAddress ?? m?.originating ?? '';
                const timestamp = m?.timestamp ?? Date.now();
                await smsService.handleIncomingSms({ body, originatingAddress, timestamp });
              } catch (e) {
                console.warn('processing pending sms failed', e);
              }
            }
          } catch (e) {
            console.warn('fetch pending sms failed', e);
          }
        }}
        className="absolute bottom-6 right-6 bg-blue-600 rounded-full px-4 py-3 shadow-lg"
      >
        <Text className="text-white font-semibold">+SMS</Text>
      </Pressable>
    </SafeAreaView>
  );
}