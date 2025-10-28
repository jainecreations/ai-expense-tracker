import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import GoogleSignInButton from "./google-login";

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Missing Fields", "Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setLoading(false);

      if (error) {
        Alert.alert("Login Failed", error.message);
      } else {
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      setLoading(false);
      Alert.alert("Error", err.message);
    }
  };

  const goToSignup = () => router.push("/auth/signup");

  return (
    <View className="flex-1 bg-white px-6 py-16 justify-center">
      {/* Header */}
      <Text className="text-3xl font-bold mb-8 text-center text-gray-800">
        Welcome Back 👋
      </Text>

      {/* Email */}
      <Text className="text-gray-600 mb-2">Email</Text>
      <View className="flex-row items-center border border-gray-300 rounded-xl px-4 mb-4">
        <Ionicons name="mail-outline" size={20} color="gray" />
        <TextInput
          className="flex-1 py-3 px-2 text-lg"
          placeholder="Enter your email"
          placeholderTextColor="#9CA3AF"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      {/* Password */}
      <Text className="text-gray-600 mb-2">Password</Text>
      <View className="flex-row items-center border border-gray-300 rounded-xl px-4 mb-6">
        <Ionicons name="lock-closed-outline" size={20} color="gray" />
        <TextInput
          className="flex-1 py-3 px-2 text-lg text-gray-800"
          placeholder="Enter your password"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      {/* Sign In Button */}
      <TouchableOpacity
        onPress={handleSignIn}
        disabled={loading}
        className={`rounded-full py-4 ${loading ? "bg-gray-400" : "bg-blue-600"}`}
      >
        <Text className="text-center text-white font-semibold text-lg">
          {loading ? "Signing In..." : "Sign In"}
        </Text>
      </TouchableOpacity>

      {/* Divider */}
      <Text className="text-center text-gray-500 my-6">or</Text>

      {/* Google Sign-In */}
      <GoogleSignInButton />

      {/* Sign Up */}
      <TouchableOpacity onPress={goToSignup} className="mt-8">
        <Text className="text-center text-gray-600">
          Don’t have an account?{" "}
          <Text className="text-blue-600 font-semibold">Sign up</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}
