import { useEffect } from "react";
import { useRouter } from "expo-router";
import { View, ActivityIndicator, useColorScheme } from "react-native";
import useResolvedTheme from '@/hooks/useResolvedTheme';

export default function NotFoundScreen() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home/index when any unmatched route is hit
    router.replace("/(tabs)");
  }, []);

  const { classFor } = useResolvedTheme();
  const { isDark } = useResolvedTheme();

  return (
    <View className={`${classFor('flex-1 items-center justify-center bg-white','flex-1 items-center justify-center bg-neutral-900')}`}>
      <ActivityIndicator size="large" color={isDark ? '#fff' : '#007AFF'} />
    </View>
  );
}
