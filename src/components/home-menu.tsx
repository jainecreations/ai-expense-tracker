// src/components/home-menu.tsx
import React from "react";
import { View, Text, TouchableOpacity, Modal, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

interface HomeMenuProps {
  visible: boolean;
  onClose: () => void;
}

export default function HomeMenu({ visible, onClose }: HomeMenuProps) {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    onClose();
    // Navigation is handled by the root layout when `user` changes.
    // Avoid navigating here to prevent "navigate before mounting" errors.
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/30 justify-start items-end"
        onPressOut={onClose}
      >
        <View className="bg-white rounded-lg mt-16 mr-4 p-2 w-40 shadow-md">
          <TouchableOpacity
            className="py-3 px-4"
            onPress={() => {
              onClose();
              router.push("/profile");
            }}
          >
            <Text className="text-gray-800 text-base">Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity className="py-3 px-4" onPress={handleSignOut}>
            <Text className="text-gray-800 text-base">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}
