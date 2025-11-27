import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, Modal, TextInput, Platform, Alert, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useResolvedTheme from '@/hooks/useResolvedTheme';
import { useRecurringStore } from '@/store/recurringStore';
import { format, parseISO } from 'date-fns';

export default function RecurringScreen() {
  const { classFor } = useResolvedTheme();
  const { recurring, loadRecurring, addRecurring, deleteRecurring, generateNow, isLoading } = useRecurringStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  // mirror AddExpense category picker
  type Category = { name: string; icon: any; color: string };
  const categories: Category[] = [
    { name: 'Food', icon: 'restaurant-outline', color: '#e0583b' },
    { name: 'Travel', icon: 'airplane-outline', color: '#34a853' },
    { name: 'Shopping', icon: 'cart-outline', color: '#fbbc05' },
    { name: 'Bills', icon: 'document-text-outline', color: '#4285f4' },
    { name: 'Entertainment', icon: 'film-outline', color: '#aa66cc' },
    { name: 'Health', icon: 'heart-outline', color: '#ff4444' },
    { name: 'Misc', icon: 'ellipsis-horizontal-outline', color: '#9e9e9e' },
  ];
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(categories.find((c) => c.name === 'Misc') || null);
  const [frequency, setFrequency] = useState<'daily'|'weekly'|'monthly'>('monthly');
  const [startDate, setStartDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => { loadRecurring(); }, []);

  const openAdd = () => {
    setName(''); setAmount(''); setSelectedCategory(categories.find((c) => c.name === 'Misc') || null); setFrequency('monthly'); setStartDate(format(new Date(), 'yyyy-MM-dd'));
    setModalOpen(true);
  };

  const handleSave = async () => {
    const a = Number(amount.replace(/[^0-9.]/g, '')) || 0;
    if (!name || !a || !selectedCategory) return Alert.alert('Validation', 'Please enter title, amount and category');
    await addRecurring({ name, amount: a, category: selectedCategory.name, frequency, start_date: startDate, next_date: startDate });
    setModalOpen(false);
  };

  const handleGenerateNow = async (id?: string) => {
    if (!id) return;
    try {
      await generateNow(id);
      Alert.alert('Generated', 'Recurring expense added to transactions.');
    } catch (err) {
      console.warn(err);
      Alert.alert('Error', 'Failed to generate recurring expense.');
    }
  };

  return (
    <SafeAreaView className={classFor('flex-1 bg-[#f7fafc]','flex-1 bg-neutral-900')}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View className="flex-row items-center justify-between mb-4">
          <Text className={classFor('text-2xl font-bold text-gray-800','text-2xl font-bold text-white')}>Recurring Expenses</Text>
          <TouchableOpacity onPress={openAdd} className="bg-blue-600 px-3 py-2 rounded-full">
            <Text className="text-white">Add</Text>
          </TouchableOpacity>
        </View>

        {recurring.length === 0 && (
          <View className="py-20">
            <Text className={classFor('text-center text-gray-600','text-center text-neutral-400')}>No recurring expenses yet. Tap Add to create one.</Text>
          </View>
        )}

        {recurring.map((r) => (
          <View key={r.id} className={`${classFor('bg-white','bg-neutral-800')} rounded-2xl p-4 mb-4 shadow`}>
            <View className="flex-row justify-between items-start">
              <View>
                <Text className={classFor('text-lg font-semibold text-gray-800','text-lg font-semibold text-white')}>{r.name} — ₹{r.amount}</Text>
                <Text className={classFor('text-sm text-gray-500 mt-1','text-sm text-neutral-400 mt-1')}>Repeats: {r.frequency}</Text>
                <Text className={classFor('text-sm text-gray-500 mt-1','text-sm text-neutral-400 mt-1')}>Next: {r.next_date ? format(parseISO(r.next_date), 'dd LLL yyyy') : '—'}</Text>
                <Text className={classFor('text-sm text-gray-400 mt-1','text-sm text-neutral-500 mt-1')}>Last: {r.last_generated_at ? format(parseISO(r.last_generated_at), 'dd LLL yyyy') : 'Never'}</Text>
              </View>
              <View className="items-end">
                {r.active && <View className="bg-green-100 px-2 py-1 rounded-full mb-2"><Text className="text-sm text-green-700">Auto</Text></View>}
                <TouchableOpacity onPress={() => handleGenerateNow(r.id)} className="bg-blue-600 px-3 py-2 rounded-full mb-2">
                  <Text className="text-white">Generate now</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteRecurring(r.id as string)} className="px-3 py-2">
                  <Text className="text-red-500">Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={modalOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black bg-opacity-30">
          <View className={`${classFor('bg-white','bg-neutral-800')} rounded-t-2xl p-4`}> 
            <Text className={classFor('text-lg font-semibold mb-3 text-gray-800','text-lg font-semibold mb-3 text-white')}>Add Recurring Expense</Text>
            <TextInput value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="Amount" placeholderTextColor="#9CA3AF" className={classFor('py-3 px-3 rounded-lg border border-gray-300 bg-white mb-3','py-3 px-3 rounded-lg border border-neutral-700 bg-neutral-800 mb-3')} />
            <TextInput value={name} onChangeText={setName} placeholder="Title" placeholderTextColor="#9CA3AF" className={classFor('py-3 px-3 rounded-lg border border-gray-300 bg-white mb-3','py-3 px-3 rounded-lg border border-neutral-700 bg-neutral-800 mb-3')} />
            <Text className={classFor('mt-2 mb-2 text-gray-500 font-medium','mt-2 mb-2 text-gray-300 font-medium')}>Category</Text>
            <View className="flex-row flex-wrap mt-2 mb-3">
              {categories.map((cat, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full mr-3 mb-3 flex-row items-center shadow-sm border ${selectedCategory?.name === cat.name
                    ? 'border-blue-500 bg-blue-100'
                    : 'border-gray-200 bg-white'
                  }`}
                >
                  <Ionicons name={cat.icon as any} size={20} color={cat.color} style={{ marginRight: 6 }} />
                  <Text className="text-neutral-700 font-medium">{cat.name}</Text>
                </Pressable>
              ))}
            </View>
            <View className="flex-row items-center justify-between mb-3">
              <TouchableOpacity onPress={() => setFrequency('daily')} className={`px-3 py-2 rounded-full ${frequency === 'daily' ? 'bg-blue-600' : classFor('bg-gray-100','bg-neutral-700')}`}><Text className={frequency === 'daily' ? 'text-white' : classFor('text-gray-800','text-white')}>Daily</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setFrequency('weekly')} className={`px-3 py-2 rounded-full ${frequency === 'weekly' ? 'bg-blue-600' : classFor('bg-gray-100','bg-neutral-700')}`}><Text className={frequency === 'weekly' ? 'text-white' : classFor('text-gray-800','text-white')}>Weekly</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setFrequency('monthly')} className={`px-3 py-2 rounded-full ${frequency === 'monthly' ? 'bg-blue-600' : classFor('bg-gray-100','bg-neutral-700')}`}><Text className={frequency === 'monthly' ? 'text-white' : classFor('text-gray-800','text-white')}>Monthly</Text></TouchableOpacity>
            </View>
            <TextInput value={startDate} onChangeText={setStartDate} placeholder="Start date (YYYY-MM-DD)" placeholderTextColor="#9CA3AF" className={classFor('py-3 px-3 rounded-lg border border-gray-300 bg-white mb-3','py-3 px-3 rounded-lg border border-neutral-700 bg-neutral-800 mb-3')} />

            <View className="flex-row justify-end mt-2">
              <TouchableOpacity onPress={() => setModalOpen(false)} className="px-4 py-2 mr-2">
                <Text className={classFor('text-gray-700','text-neutral-300')}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} className="bg-blue-600 px-4 py-2 rounded-full">
                <Text className="text-white">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
