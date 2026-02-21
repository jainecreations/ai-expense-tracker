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

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleReset = async () => {
        if (!email) {
            Alert.alert("Missing Email", "Please enter your email address.");
            return;
        }

        try {
            setLoading(true);

            // Use Supabase OTP sign-in to send a one-time code to the user's email.
            // We set `shouldCreateUser: false` so we don't create accounts for unknown emails.
            // For security we do NOT reveal whether the email exists — always show a
            // generic success message so attackers can't enumerate accounts.
            const { data, error } = await supabase.auth.signInWithOtp({
                email,
                options: { shouldCreateUser: false },
            } as any);

            setLoading(false);

            if (error) {
                // If this is a network or server error, show a generic failure message.
                // Do not disclose whether the email exists.
                console.warn('signInWithOtp error', error);
                Alert.alert(
                    'Unable to send OTP',
                    'Unable to send OTP right now. Please try again later.'
                );
                return;
            }

            // Always show a neutral success message (do not reveal existence of email).
            Alert.alert('OTP sent', 'If an account exists for that email, an OTP has been sent.');

            // Navigate to OTP verification screen and pass the email as a query param.
            router.push(`/auth/verify-otp?email=${encodeURIComponent(email)}`);
        } catch (err: any) {
            setLoading(false);
            Alert.alert(
                "Error",
                err?.message || "Unexpected error occurred"
            );
        }
    };

    const { classFor } = useResolvedTheme();

    return (
        <KeyboardAvoidingView
            className={classFor('flex-1 bg-white', 'flex-1 bg-neutral-900')}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 32 }}
                    keyboardShouldPersistTaps="handled"
                >
                    <Text className={classFor('text-3xl font-bold mb-8 text-center text-gray-800', 'text-3xl font-bold mb-8 text-center text-white')}>
                        Forgot password
                    </Text>

                    <Text className={classFor('text-gray-600 mb-2', 'text-gray-300 mb-2')}>Email</Text>
                    <View className={`${classFor('flex-row items-center border border-gray-300 rounded-xl px-4 mb-6 bg-white', 'flex-row items-center border border-gray-700 rounded-xl px-4 mb-6 bg-neutral-800')}`}>
                        <Ionicons name="mail-outline" size={20} color="gray" />
                        <TextInput
                            className={classFor('flex-1 py-3 px-2 text-lg text-gray-800', 'flex-1 py-3 px-2 text-lg text-gray-100')}
                            placeholder="Enter your account email"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                        />
                    </View>

                    <TouchableOpacity
                        onPress={handleReset}
                        disabled={loading}
                        className={`rounded-full py-4 ${loading ? "bg-gray-400" : "bg-blue-600"}`}
                    >
                        {loading ? (
                            <View className="flex-row justify-center items-center">
                                <ActivityIndicator color="#fff" />
                                <Text className="ml-3 text-center text-lg font-semibold text-white">Sending...</Text>
                            </View>
                        ) : (
                            <Text className="text-center text-white font-semibold text-lg">Send OTP</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.push('/auth/signin')} className="mt-6">
                        <Text className={classFor('text-center text-gray-600', 'text-center text-gray-300')}>
                            Back to sign in
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}
