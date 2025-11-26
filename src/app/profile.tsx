import React from "react";
import { View, Text, TouchableOpacity, Image, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/auth/signin");
  };

  return (
    <ScrollView className="flex-1 px-5 py-8 bg-[#f5f8fd]">
      {/* Header */}
      <View className="flex-row items-center my-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="gray" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-2xl font-bold text-gray-800">
          Profile
        </Text>
      </View>

      {/* Profile Info */}
      <View className="bg-white mx-5 mt-6 rounded-2xl items-center p-6 shadow">
        <Image
          source={{
            uri:
              user?.user_metadata?.avatar_url ||
              "https://ui-avatars.com/api/?name=" +
                encodeURIComponent(user?.user_metadata?.full_name || "U"),
          }}
          className="w-24 h-24 rounded-full mb-4"
        />
        <Text className="text-xl font-semibold text-gray-800 mb-1">
          {user?.user_metadata?.full_name || "User Name"}
        </Text>
        <Text className="text-gray-500 mb-3">{user?.email}</Text>
      </View>

      {/* More Options */}
      <View className="mt-6 mx-5 bg-white rounded-2xl shadow overflow-hidden">
        {/* <TouchableOpacity
          className="flex-row items-center px-6 py-4 border-b border-gray-100"
          onPress={() => router.push("/settings")}
        >
          <Ionicons name="settings-outline" size={22} color="#4B5563" />
          <Text className="ml-4 text-gray-700 text-base font-medium">
            Settings
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center px-6 py-4 border-b border-gray-100"
          onPress={() => router.push("/help")}
        >
          <Ionicons name="help-circle-outline" size={22} color="#4B5563" />
          <Text className="ml-4 text-gray-700 text-base font-medium">Help</Text>
        </TouchableOpacity> */}

        <TouchableOpacity
          className="flex-row items-center px-6 py-4"
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          <Text className="ml-4 text-red-500 text-base font-medium">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
