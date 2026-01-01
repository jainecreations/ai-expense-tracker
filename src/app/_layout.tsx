import "../global.css";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { NativeModules } from "react-native";
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
      // Poll for native module availability (some RN builds initialize native
      // modules slightly after JS startup). Try up to 10 times, 300ms apart.
      const RN = require('react-native');
      const { NativeModules } = RN;
      // eslint-disable-next-line no-console
      console.log('NativeModules keys (initial):', Object.keys(NativeModules || {}));
      const candidates = ['SmsEventModule', 'SmsEventEmitter', 'SmsRetriever', 'SmsRetrieverModule'];

      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      let found = false;
      for (let attempt = 0; attempt < 10 && !found; attempt++) {
        // Refresh reference
        const keys = Object.keys(NativeModules || {});
        // eslint-disable-next-line no-console
        console.log(`native discovery attempt=${attempt} keys=`, keys);
        for (const name of candidates) {
          try {
            const mod = NativeModules[name];
            if (!mod) continue;
            // eslint-disable-next-line no-console
            console.log(`Found native module ${name} on attempt=${attempt}`);
            if (typeof mod.rawPending === 'function') {
              try {
                const raw = await mod.rawPending();
                // eslint-disable-next-line no-console
                console.log(`raw pending from ${name}:`, raw);
              } catch (e) {
                console.warn(`rawPending call failed on ${name}`, e);
              }
            }
            if (typeof mod.readPending === 'function') {
              try {
                const res = await mod.readPending();
                // eslint-disable-next-line no-console
                console.log(`readPending from ${name}:`, res);
              } catch (e) {
                console.warn(`readPending call failed on ${name}`, e);
              }
            }
            found = true;
            break;
          } catch (e) {
            console.warn('candidate native call failed', name, e);
          }
        }
        if (!found) await sleep(300);
      }
      if (!found) console.warn('Native SmsEvent module not found after retries');
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
    <>
      {Platform.OS === 'android' ? <SmsListener /> : null}
      <Stack screenOptions={{ headerShown: false }}>
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
    </>
  );
}
