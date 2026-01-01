// src/components/home-menu.tsx
import React from "react";
import { View, Text, TouchableOpacity, Modal, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import useResolvedTheme from "@/hooks/useResolvedTheme";

interface HomeMenuProps {
  visible: boolean;
  onClose: () => void;
}

export default function HomeMenu({ visible, onClose }: HomeMenuProps) {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const { classFor } = useResolvedTheme();

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
        <View
          className={`${classFor(
            "bg-white",
            "bg-neutral-800"
          )} rounded-xl mt-16 mr-4 w-44 shadow-lg overflow-hidden`}
        >
          {/* Menu Items */}
          {[
            // { label: "Profile", route: "/profile" },
            { label: "Settings", route: "/settings" },
            // { label: "Budget", route: "/monthly-budget" },
            // { label: "Category Budgets", route: "/category-budgets" },
            // { label: "Recurring Expenses", route: "/recurring" },
            { label: "Export PDF", route: "/data-backup" },
          ].map((item, index) => (
            <View key={item.label}>
              <TouchableOpacity
                className="py-3 px-4 active:opacity-70"
                onPress={() => {
                  onClose();
                  router.push(item.route);
                }}
              >
                <Text
                  className={classFor(
                    "text-gray-800 text-base",
                    "text-white text-base"
                  )}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>

              {/* Separator */}
              {index !== 5 && (
                <View
                  className={classFor(
                    "h-px bg-gray-200",
                    "h-px bg-neutral-700"
                  )}
                />
              )}
            </View>
          ))}

          {/* Sign Out Section */}
          <View
            className={classFor("h-px bg-gray-300", "h-px bg-neutral-600")}
          />

          <TouchableOpacity
            className="py-3 px-4 bg-red-50 active:opacity-70"
            onPress={handleSignOut}
          >
            <Text className="text-red-600 text-base font-medium">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}
