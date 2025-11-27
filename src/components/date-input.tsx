import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import useResolvedTheme from '@/hooks/useResolvedTheme';
import { format } from 'date-fns';

export default function DateInput({ date, setDate}) {
//   const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const handleDateChange = (event, selectedDate) => {
    setShowPicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const { classFor } = useResolvedTheme();

  return (
    <View className="mt-5">
      <Text className={classFor('mb-2 text-gray-500 font-medium','mb-2 text-gray-300 font-medium')}>Date</Text>

      <TouchableOpacity
        onPress={() => setShowPicker(true)}
        activeOpacity={0.8}
        className={`${classFor('flex-row items-center bg-white','flex-row items-center bg-neutral-800')} rounded-lg px-4 py-2 border border-gray-300`}
      >
        <Text className={classFor('text-gray-700 text-lg flex-1','text-gray-200 text-lg flex-1')}>
          {format(date, 'dd MMM yyyy')}
        </Text>
        <Ionicons name="calendar-outline" size={22} color="#6B7280" />
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}
    </View>
  );
}
