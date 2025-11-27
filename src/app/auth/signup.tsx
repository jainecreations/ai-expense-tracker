import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import useResolvedTheme from '@/hooks/useResolvedTheme';

export default function SignUpScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert("Missing Fields", "Please enter email and password.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name || null } },
      } as any);
      setLoading(false);

      if (error) {
        Alert.alert("Sign Up Failed", error.message);
        return;
      }

      Alert.alert(
        "Sign Up Successful",
        data?.user
          ? "Account created — you are signed in."
          : "Check your email to confirm your account.",
        [{ text: "OK", onPress: () => router.replace("/auth/signin") }]
      );
    } catch (err: any) {
      setLoading(false);
      Alert.alert("Error", err.message || "Unexpected error occurred");
    }
  };

  const { classFor } = useResolvedTheme();

  return (
    <KeyboardAvoidingView
      className={classFor('flex-1 bg-white','flex-1 bg-neutral-900')}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text className={classFor('text-3xl font-bold mb-8 text-center text-gray-800','text-3xl font-bold mb-8 text-center text-white')}>
            Create Account
          </Text>

          {/* Full name */}
          <Text className={classFor('text-gray-600 mb-2','text-gray-300 mb-2')}>Full name</Text>
          <View className={`${classFor('flex-row items-center border border-gray-300 rounded-xl px-4 mb-4 bg-white','flex-row items-center border border-gray-700 rounded-xl px-4 mb-4 bg-neutral-800')}`}>
            <Ionicons name="person-outline" size={20} color="gray" />
            <TextInput
              className={classFor('flex-1 py-3 px-2 text-lg text-gray-800','flex-1 py-3 px-2 text-lg text-gray-100')}
              placeholder="Your full name"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Email */}
          <Text className={classFor('text-gray-600 mb-2','text-gray-300 mb-2')}>Email</Text>
          <View className={`${classFor('flex-row items-center border border-gray-300 rounded-xl px-4 mb-4 bg-white','flex-row items-center border border-gray-700 rounded-xl px-4 mb-4 bg-neutral-800')}`}>
            <Ionicons name="mail-outline" size={20} color="gray" />
            <TextInput
              className={classFor('flex-1 py-3 px-2 text-lg text-gray-800','flex-1 py-3 px-2 text-lg text-gray-100')}
              placeholder="Enter your email"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Password */}
          <Text className={classFor('text-gray-600 mb-2','text-gray-300 mb-2')}>Password</Text>
          <View className={`${classFor('flex-row items-center border border-gray-300 rounded-xl px-4 mb-4 bg-white','flex-row items-center border border-gray-700 rounded-xl px-4 mb-4 bg-neutral-800')}`}>
            <Ionicons name="lock-closed-outline" size={20} color="gray" />
            <TextInput
              className={classFor('flex-1 py-3 px-2 text-lg text-gray-800','flex-1 py-3 px-2 text-lg text-gray-100')}
              placeholder="Create a password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {/* Confirm Password */}
          <Text className={classFor('text-gray-600 mb-2','text-gray-300 mb-2')}>Confirm Password</Text>
          <View className={`${classFor('flex-row items-center border border-gray-300 rounded-xl px-4 mb-6 bg-white','flex-row items-center border border-gray-700 rounded-xl px-4 mb-6 bg-neutral-800')}`}>
            <Ionicons name="lock-closed-outline" size={20} color="gray" />
            <TextInput
              className={classFor('flex-1 py-3 px-2 text-lg text-gray-800','flex-1 py-3 px-2 text-lg text-gray-100')}
              placeholder="Confirm your password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          {/* Button */}
          <TouchableOpacity
            onPress={handleSignUp}
            disabled={loading}
            className={`rounded-full py-4 ${loading ? "bg-gray-400" : "bg-blue-600"}`}
          >
            {loading ? (
              <View className="flex-row justify-center items-center">
                <ActivityIndicator color="#fff" />
                <Text className="ml-3 text-center text-lg font-semibold text-white">
                  Signing Up...
                </Text>
              </View>
            ) : (
              <Text className="text-center text-white font-semibold text-lg">
                Create account
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/auth/signin")}
            className="mt-6"
          >
            <Text className={classFor('text-center text-gray-600','text-center text-gray-300')}>
              Already have an account?{" "}
              <Text className="text-blue-600 font-semibold">Sign in</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
