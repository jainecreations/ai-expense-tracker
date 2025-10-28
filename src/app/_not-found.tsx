import { useEffect } from "react";
import { useRouter } from "expo-router";
import { View, ActivityIndicator } from "react-native";

export default function NotFoundScreen() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home/index when any unmatched route is hit
    router.replace("/(tabs)");
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
}
