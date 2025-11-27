import "../global.css";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { View, ActivityIndicator, Platform, useColorScheme } from "react-native";
import { useThemeStore } from "@/store/themeStore";
import SmsListener from "@/components/SmsListener";

export default function Layout() {
  const { user, setUser, loading, setLoading } = useAuthStore();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const initSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data?.session?.user || null);
      setLoading(false);
    };

    initSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // load persisted theme on startup
  useEffect(() => {
    (async () => {
      await useThemeStore.getState().loadAppearance();
    })();
  }, []);

  // ✅ Wait until mounted and loading is done before navigating
  useEffect(() => {
    if (!isMounted || loading) return;

    const timeout = setTimeout(() => {
      if (user) router.replace("/(tabs)");
      else router.replace("/auth/signin");
    }, 50); // short delay gives Stack time to mount

    return () => clearTimeout(timeout);
  }, [user, loading, isMounted]);

  const appearance = useThemeStore((s) => s.appearance);
  const sys = useColorScheme();
  const resolved = appearance === 'system' ? (sys || 'light') : appearance;

  if (loading || !isMounted) {
    return (
      <View className={`flex-1 justify-center items-center ${resolved === 'dark' ? 'bg-neutral-900' : 'bg-white'}`}>
        <ActivityIndicator size="large" color={resolved === 'dark' ? '#fff' : '#000'} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {Platform.OS === 'android' ? <SmsListener /> : null}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth/signin" options={{ headerShown: false }} />
      <Stack.Screen
        name="add-expense"
        options={{
          presentation: "modal",
          title: "Add Expense",
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          presentation: "modal",
          title: "Profile",
        }}
      />
    </Stack>
  );
}
