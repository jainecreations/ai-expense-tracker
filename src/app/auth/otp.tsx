import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function OtpScreen() {
  const { phone } = useLocalSearchParams();
  const [otp, setOtp] = useState("");
  const router = useRouter();

  const verifyOtp = async () => {
    const { error } = await supabase.auth.verifyOtp({
      phone: "+91" + phone,
      token: otp,
      type: "sms",
    });

    if (error) Alert.alert("Error", error.message);
    else router.replace("/"); // redirect to home
  };

  return (
    <View className="flex-1 bg-white px-6 py-16 justify-center">
      <Text className="text-3xl font-bold mb-6 text-center text-gray-800">Enter OTP</Text>

      <Text className="text-gray-500 text-center mb-4">
        Sent to +91 {phone}
      </Text>

      <TextInput
        className="border border-gray-300 rounded-xl text-center text-2xl py-3 mb-6"
        keyboardType="number-pad"
        placeholder="••••••"
        value={otp}
        onChangeText={setOtp}
      />

      <TouchableOpacity
        onPress={verifyOtp}
        className="bg-blue-600 rounded-full py-4 mt-4"
      >
        <Text className="text-center text-white font-semibold text-lg">Verify & Continue</Text>
      </TouchableOpacity>
    </View>
  );
}
