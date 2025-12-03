import React, { useMemo } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import useResolvedTheme from '@/hooks/useResolvedTheme';
import { useRouter } from 'expo-router';
import useSmsImportStore from '@/store/smsImportStore';

export default function SmartCapturesCard() {
  if (Platform.OS !== 'android') return null;
  const allPending = useSmsImportStore((s) => s.pending);
  const pending = useMemo(() => allPending.filter((p) => p.status === 'pending'), [allPending]);
  const count = pending.length;
  const router = useRouter();
  const { classFor } = useResolvedTheme();

  if (!count) return null;

  return (
    <View className={`${classFor('bg-white','bg-neutral-800')} rounded-2xl p-4 mx-4 my-2 shadow-md`}>
      <View className="flex-row justify-between items-center">
        <View>
          <Text className={classFor('text-lg font-semibold text-gray-800','text-lg font-semibold text-white')}>Smart Captures</Text>
          <Text className={classFor('text-sm text-gray-500','text-sm text-gray-300')}>{count} new SMS detected</Text>
        </View>
        <Pressable onPress={() => router.push('/smart-captures')} className="bg-blue-500 rounded-full px-4 py-2">
          <Text className="text-white font-semibold">Review</Text>
        </Pressable>
      </View>
    </View>
  );
}
