import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Redirect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image, Pressable, Text, View } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { SafeAreaView } from 'react-native-safe-area-context';
import AlertBanner from '@/components/alert-banner';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCategoryBudgetStore } from '@/store/categoryBudgetStore';
import { useTransactionStore } from '@/store/transactionStore';

export default function HomeScreen() {
	const router = useRouter();
	const user = useAuthStore((s) => s.user);
	const { budgets, loadCategoryBudgets } = useCategoryBudgetStore();
	const transactions = useTransactionStore((s) => s.transactions) as any[];
	const [showBanner, setShowBanner] = useState(false);

	useEffect(() => {
		(async () => {
			try {
				const overspend = (await AsyncStorage.getItem('settings:overspendingAlerts')) === '1';
				const b80 = (await AsyncStorage.getItem('settings:budgetAlert80')) === '1';
				if (!overspend) return setShowBanner(false);
				// compute top category this month
				const now = new Date();
				const monthKey = now.toISOString().slice(0,7);
				await loadCategoryBudgets(monthKey);
				const map: Record<string, number> = {};
				transactions.forEach((tx) => {
					const d = new Date(tx.date || tx.created_at || tx.timestamp || tx.time);
					if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
						map[tx.category || tx.title || 'Other'] = (map[tx.category || tx.title || 'Other'] || 0) + (tx.amount || 0);
					}
				});
				const entries = Object.entries(map).sort((a,b)=>b[1]-a[1]);
				if (entries.length === 0) return setShowBanner(false);
				const [name, spent] = entries[0];
				const budget = budgets[name];
				if (budget && spent / budget >= 0.8) setShowBanner(true);
			} catch (err) {
				console.warn('Failed to compute home banner', err);
			}
		})();
	}, [transactions]);
	if (!user) return <Redirect href="/auth/signin" />;

	return (
		<View className="flex-1 justify-center items-center">
		<Text className="text-2xl font-bold">Welcome, {user?.phone || user?.email}</Text>
		</View>
	);
	// return (
	// 	<SafeAreaView className="flex-1 flex bg-white">
	// 		<StatusBar style="dark" />
	// 		<Text className="font-bold mt-20 text-4xl text-center">
	// 			AI Expense Manager
	// 		</Text>
	// 		<Text className="text-center mt-4 text-lg px-8 text-gray-600">
	// 			Track smarter. Spend wiser.
	// 		</Text>
	// 		<View className="flex-1 bg-white justify-center items-center">
	// 			<Image className="h-full w-full" source={require('@/assets/home.png')} />
	// 		</View>
	// 		<View className="flex-1 justify-end">
	// 			<Pressable onPress={() => router.push("/(tabs)")} className="bg-blue-500 mx-8 rounded-full py-4 items-center mb-10">
	// 				<Text className="text-white text-lg font-semibold">Get Started</Text>
	// 			</Pressable>
	// 		</View>
	// 	</SafeAreaView>
	// );
}
