import { useAuthStore } from '@/store/authStore';
import { Redirect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image, Pressable, Text, View } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
	const router = useRouter();
	const user = useAuthStore((s) => s.user);
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
