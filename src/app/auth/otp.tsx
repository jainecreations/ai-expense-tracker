import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import useResolvedTheme from '@/hooks/useResolvedTheme';

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

  const { classFor } = useResolvedTheme();

  return (
    <View className={`${classFor('flex-1 bg-white px-6 py-16 justify-center','flex-1 bg-neutral-900 px-6 py-16 justify-center')}`}>
      <Text className={classFor('text-3xl font-bold mb-6 text-center text-gray-800','text-3xl font-bold mb-6 text-center text-white')}>Enter OTP</Text>

      <Text className={classFor('text-gray-500 text-center mb-4','text-gray-300 text-center mb-4')}>
        Sent to +91 {phone}
      </Text>

      <TextInput
        className={classFor('border border-gray-300 rounded-xl text-center text-2xl py-3 mb-6','border border-gray-700 rounded-xl text-center text-2xl py-3 mb-6 bg-neutral-800 text-white')}
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
