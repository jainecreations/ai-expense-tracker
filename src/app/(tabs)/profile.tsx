import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import useResolvedTheme from "@/hooks/useResolvedTheme";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const router = useRouter();
  const { classFor, resolved } = useResolvedTheme();

  const displayName =
    user?.user_metadata?.full_name || user?.email || "User Name";
  const avatarUri =
    user?.user_metadata?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=4F46E5&color=FFFFFF&rounded=true&size=128`;
  const chevronColor = resolved === "dark" ? "#9CA3AF" : "#6B7280";

  const handleSignOut = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          // redirect to auth screen if appropriate
          try {
            router.replace("/auth/signin");
          } catch (e) {
            /* noop */
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView
      className={classFor("flex-1 bg-[#f7fafc]", "flex-1 bg-neutral-900")}
    >
      <ScrollView className="py-6">
        {/* <ScrollView className={`${classFor('flex-1 px-5 py-8 bg-[#f5f8fd]','flex-1 px-5 py-8 bg-neutral-900')}`}> */}
        {/* Header
      <View className="flex-row items-center my-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={resolved === 'dark' ? '#fff' : '#6B7280'} />
        </TouchableOpacity>
        <Text className={classFor('flex-1 text-center text-2xl font-bold text-gray-800','flex-1 text-center text-2xl font-bold text-white')}>
          PROFILE
        </Text>
      </View> */}
        {/* Header */}
        <View className="flex-row items-center my-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="gray" />
          </TouchableOpacity>
          <Text
            className={classFor(
              "flex-1 text-center text-2xl font-bold text-gray-800",
              "flex-1 text-center text-2xl font-bold text-white"
            )}
          >
            Profile
          </Text>
        </View>

        {/* Profile Info */}
        <View
          className={`${classFor(
            "bg-white",
            "bg-neutral-800"
          )} mx-5 mt-6 rounded-2xl items-center p-6 shadow`}
        >
          <Image
            source={{ uri: avatarUri }}
            className="w-24 h-24 rounded-full mb-4"
          />
          <Text
            className={classFor(
              "text-xl font-semibold text-gray-800 mb-1",
              "text-xl font-semibold text-white mb-1"
            )}
          >
            {displayName}
          </Text>
          <Text
            className={classFor("text-gray-500 mb-3", "text-gray-300 mb-3")}
          >
            {user?.email}
          </Text>
        </View>

        {/* Menu Rows */}
        <View
          className={`${classFor(
            "mt-6 mx-5 bg-white",
            "mt-6 mx-5 bg-neutral-800"
          )} rounded-2xl shadow overflow-hidden`}
        >
          <TouchableOpacity
            className="flex-row items-center px-6 py-4 border-b border-gray-100"
            onPress={() => router.push("/settings")}
          >
            <Ionicons name="settings-outline" size={22} color={chevronColor} />
            <Text className="ml-4 text-gray-700 text-base font-medium">
              Settings
            </Text>
            <View style={{ flex: 1 }} />
            <Ionicons name="chevron-forward" size={20} color={chevronColor} />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center px-6 py-4 border-b border-gray-100"
            onPress={() => router.push("/category-budgets")}
          >
            <Text style={{ fontSize: 20 }} className="ml-0">
              💰
            </Text>
            <Text className="ml-4 text-gray-700 text-base font-medium">
              Category Budgets
            </Text>
            <View style={{ flex: 1 }} />
            <Ionicons name="chevron-forward" size={20} color={chevronColor} />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center px-6 py-4 border-b border-gray-100"
            onPress={() => router.push("/recurring")}
          >
            <Text style={{ fontSize: 20 }} className="ml-0">
              🔁
            </Text>
            <Text className="ml-4 text-gray-700 text-base font-medium">
              Recurring Expenses
            </Text>
            <View style={{ flex: 1 }} />
            <Ionicons name="chevron-forward" size={20} color={chevronColor} />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center px-6 py-4 border-b border-gray-100"
            onPress={() => router.push("/data-backup")}
          >
            <Text style={{ fontSize: 20 }} className="ml-0">
              📄
            </Text>
            <Text className="ml-4 text-gray-700 text-base font-medium">
              Export PDF
            </Text>
            <View style={{ flex: 1 }} />
            <Ionicons name="chevron-forward" size={20} color={chevronColor} />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center px-6 py-4"
            onPress={handleSignOut}
          >
            <Text style={{ fontSize: 20 }} className="ml-0">
              🚪
            </Text>
            <Text className="ml-4 text-red-500 text-base font-medium">
              Sign Out
            </Text>
            <View style={{ flex: 1 }} />
            <Ionicons name="chevron-forward" size={20} color={chevronColor} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
