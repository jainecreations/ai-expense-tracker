import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import useResolvedTheme from '@/hooks/useResolvedTheme';

interface Props {
  title: string;
  message?: string;
  onDismiss?: () => void;
}

export default function AlertBanner({ title, message, onDismiss }: Props) {
  const { classFor } = useResolvedTheme();
  return (
    <View className="">
      <View className={`${classFor('bg-yellow-50','bg-yellow-900/30')} rounded-xl p-4 flex-row items-start justify-between`}>
        <View style={{ flex: 1 }}>
          <Text className={classFor('text-sm font-semibold text-yellow-800','text-sm font-semibold text-yellow-200')}>{title}</Text>
          {message ? <Text className={classFor('text-xs text-yellow-700 mt-1','text-xs text-yellow-100 mt-1')}>{message}</Text> : null}
        </View>
        {onDismiss ? (
          <TouchableOpacity onPress={onDismiss} className="ml-4 px-2 py-1">
            <Text className={classFor('text-sm text-yellow-800','text-sm text-yellow-200')}>Dismiss</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}
