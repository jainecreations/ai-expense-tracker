import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import useResolvedTheme from '@/hooks/useResolvedTheme';

/**
 * Verify OTP screen: accepts a 6-digit code sent via email and calls
 * supabase.auth.verifyOtp to validate it. On success we navigate to the
 * Reset Password screen where the user can set a new password.
 *
 * Security notes:
 * - We do not store the OTP anywhere persistent.
 * - We limit attempts and apply a temporary block after repeated failures to
 *   make brute-force attacks harder.
 */
export default function VerifyOtpScreen() {
  const { email } = useLocalSearchParams();
  const router = useRouter();
  const { classFor } = useResolvedTheme();

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null);

  useEffect(() => {
    if (!email) {
      // Email is required to verify OTP — redirect back to forgot screen.
      Alert.alert('Missing email', 'Please start the flow again.');
      router.replace('/auth/forgot-password');
    }
  }, [email, router]);

  useEffect(() => {
    if (!blockedUntil) return;
    const timer = setInterval(() => {
      if (Date.now() > (blockedUntil || 0)) {
        setBlockedUntil(null);
        setAttempts(0);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [blockedUntil]);

  const isBlocked = blockedUntil && Date.now() < blockedUntil;

  const handleVerify = async () => {
    if (isBlocked) return;
    if (!otp || otp.length < 4) {
      Alert.alert('Invalid code', 'Please enter the 6-digit code sent to your email.');
      return;
    }
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.verifyOtp({
        email: String(email),
        token: otp,
        type: 'email',
      } as any);

      setLoading(false);

      if (error) {
        // Increment attempts and apply temporary block after 5 failures.
        const nextAttempts = attempts + 1;
        setAttempts(nextAttempts);
        if (nextAttempts >= 5) {
          const blockForMs = 5 * 60 * 1000; // 5 minutes
          setBlockedUntil(Date.now() + blockForMs);
          Alert.alert('Too many attempts', 'Too many incorrect codes. Please try again later.');
        } else {
          Alert.alert('Verification failed', error.message || 'Invalid or expired code.');
        }
        return;
      }

      // Success: Supabase may create a session. Navigate to the reset password
      // screen where we will call updateUser to set the new password. We will
      // sign the user out after password update to avoid auto-login.
      router.push('/reset-password');
    } catch (err: any) {
      setLoading(false);
      console.error('verifyOtp error', err);
      Alert.alert('Error', 'Unable to verify code. Please try again.');
    }
  };

  const remainingBlockSecs = blockedUntil ? Math.ceil(((blockedUntil - Date.now()) || 0) / 1000) : 0;

  return (
    <View className={classFor('flex-1 bg-white px-6 py-16 justify-center','flex-1 bg-neutral-900 px-6 py-16 justify-center')}>
      <Text className={classFor('text-2xl font-semibold mb-4 text-gray-800','text-2xl font-semibold mb-4 text-white')}>Enter verification code</Text>
      <Text className={classFor('text-gray-600 mb-6','text-gray-300 mb-6')}>We sent a 6-digit code to your email.</Text>

      <TextInput
        className={classFor('border border-gray-300 rounded-xl px-4 py-3 text-lg text-gray-800 mb-6','border border-gray-700 rounded-xl px-4 py-3 text-lg text-gray-100 mb-6')}
        placeholder="Enter 6-digit code"
        placeholderTextColor="#9CA3AF"
        keyboardType="number-pad"
        value={otp}
        onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, '').slice(0, 6))}
        maxLength={6}
      />

      <TouchableOpacity
        onPress={handleVerify}
        disabled={loading || !!isBlocked}
        className={`rounded-full py-4 ${loading || isBlocked ? 'bg-gray-400' : 'bg-blue-600'}`}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-center text-white font-semibold text-lg">Verify code</Text>
        )}
      </TouchableOpacity>

      {isBlocked ? (
        <Text className={classFor('mt-4 text-center text-red-600','mt-4 text-center text-red-400')}>Too many attempts. Try again in {remainingBlockSecs}s</Text>
      ) : (
        <Text className={classFor('mt-4 text-center text-gray-600','mt-4 text-center text-gray-300')}>Didn't receive the code? Go back and request a new one.</Text>
      )}
    </View>
  );
}
