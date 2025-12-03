import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useSmsImportStore from '@/store/smsImportStore';
import useResolvedTheme from '@/hooks/useResolvedTheme';
import { useTransactionStore } from '@/store/transactionStore';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';

function LoadingDots({ className }: { className?: string }) {
  const [dots, setDots] = useState('');
  
  useEffect(() => {
    let i = 0;
    const tid = setInterval(() => {
      i = (i % 3) + 1;  // 1..3
      setDots('•'.repeat(i));  // bigger dots
    }, 400);
    return () => clearInterval(tid);
  }, []);

  // fixed width equals 3 dots space
  return (
    <Text className={`w-8 text-center ${className}`}>
      {dots}
    </Text>
  );
}

export default function SmartCapturesScreen() {
  const { classFor } = useResolvedTheme();
  const allPending = useSmsImportStore((s) => s.pending);
  const pending = useMemo(() => allPending.filter((p) => p.status === 'pending'), [allPending]);
  const markAdded = useSmsImportStore((s) => s.markAdded);
  const markIgnored = useSmsImportStore((s) => s.markIgnored);
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [toast, setToast] = useState("");
  const [loadingIds, setLoadingIds] = useState<string[]>([]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 5000);
  }

  useEffect(() => {
    // ensure store loaded
    useSmsImportStore.getState().load();
  }, []);

  const aiSMSParse = async (raw: string) => {
    // use AI classifier to extract fields
    const apiKey = "AIzaSyA_4ptYrQCcHFLtYGFYbd7SJl5ajK3O0q0";
    const prompt = `From this SMS, return ONLY:
    {"amount":A,"category":"C","date":"D","name":"N"}
    Rules:
    - A = amount in SMS
    - C = closest of [Food,Bills,Travel,Health,Entertainment,Shopping,Other]
    - D = date in SMS, else now (ISO8601)
    - N = merchant/description`;
    try {

      const model = "gemini-2.0-flash-lite";

      const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent`;

      const body = {
        contents: [
          {
            parts: [
              {
                text: `From this SMS return ONLY:
{"amount":A,"category":"C","date":"D","name":"N"}
A=amount, C from [Food,Bills,Travel,Health,Entertainment,Shopping,Other],
D=date or now ISO8601, N=merchant.`
              },
              { text: raw }
            ]
          }
        ]
      };
      console.log(apiKey, body);
      console.log('====================================');
      const res = await fetch(`${url}?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      // Important: parse body
      const json = await res.json();

      // Gemini returns text here:
      const text =
        json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

      // Parse the JSON returned by Gemini
      let parsed: any;
      try {
        console.log("text -- ", text);

        parsed = JSON.parse(text);
      } catch (err) {
        console.log("Gemini JSON parse error:", err, text);
        return null;
      }

      return parsed; // final JSON object {amount, category, date, name}
    } catch (e) {
      console.warn('AI SMS parse failed, falling back to regex parse', e);
      return { category: null, confidence: 0 };
    }
  };

  const handleAdd = async (item: any) => {
    try {
      console.log('111====================================');
      console.log(item);
      console.log('====================================');
      // mark this item as loading to show feedback in UI
      setLoadingIds((s) => [...s, item.id]);
      const txn = await aiSMSParse(item.raw_text);
      console.log("#####", txn);

      // create transaction with parsed fields
      const result = await addTransaction({
        name: txn?.name || item.title || item.bank || 'SMS Transaction',
        amount: Number(txn?.amount ?? item.amount ?? 0),
        date: txn?.date || item.date || new Date().toISOString(),
        category: txn?.category || item.category_suggested || 'Misc',
        user_id: user?.id,
      });
      console.log("*******", result);
      
      await markAdded(item.id);
      showToast(`Added to ${txn?.category || item.category_suggested || "Misc"}`);

      //   Alert.alert(`Success', 'Transaction added successfully to ${txn.category || item.category_suggested || 'Misc'} category.`);
    } catch (e) {
      console.warn('Failed to add transaction from sms import', e);
      Alert.alert('Error', 'Failed to add transaction.');
    }
    finally {
      // clear loading state for this item
      setLoadingIds((s) => s.filter((id) => id !== item.id));
    }
  };

  const handleIgnore = async (id: string) => {
    await markIgnored(id);
  };

  return (
    <SafeAreaView className={classFor('flex-1 bg-[#f7fafc]', 'flex-1 bg-neutral-900')}>
      <View className="px-4 py-4 flex-row items-center">
        <Pressable onPress={() => router.back()} className="mr-4">
          {/* <Text className={classFor('text-blue-600','text-blue-400')}>Back</Text> */}
          <Ionicons onPress={() => router.back()} name="arrow-back-outline" size={24} color="#000" />
        </Pressable>
        <Text className={classFor('text-xl font-bold', 'text-xl font-bold text-white')}>Smart Captures</Text>
      </View>
      <FlatList
        data={pending}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View className={`${classFor('bg-white', 'bg-neutral-800')} mx-4 my-2 rounded-xl p-4 shadow-sm`}>
            <Text className={classFor('text-base font-semibold text-gray-800', 'text-base font-semibold text-white')}>{item.bank || item.title || 'Bank'}</Text>
            <Text className={classFor('text-sm text-gray-600 mt-1', 'text-sm text-gray-300 mt-1')}>₹{item.amount}</Text>
            <Text className={classFor('text-sm text-gray-500 mt-2', 'text-sm text-gray-300 mt-2')}>{item.raw_text}</Text>
            <View className="flex-row justify-end mt-3">
              <Pressable onPress={() => handleIgnore(item.id)} className="px-3 py-2 mr-2">
                <Text className={classFor('text-sm text-gray-600', 'text-sm text-gray-300')}>Ignore</Text>
              </Pressable>
              <Pressable
                onPress={() => handleAdd(item)}
                disabled={loadingIds.includes(item.id)}
                className="bg-blue-500 rounded-full px-4 py-2"
                style={{ opacity: loadingIds.includes(item.id) ? 0.7 : 1 }}
              >
                {loadingIds.includes(item.id) ? (
                  <LoadingDots className="text-white font-semibold" />
                ) : (
                  <Text className="text-white font-semibold">Add</Text>
                )}
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <View className="px-4 py-6">
            <Text className={classFor('text-gray-500', 'text-gray-300')}>No pending SMS captures.</Text>
          </View>
        )}
      />
      {toast !== "" && (
        <View className="absolute bottom-10 self-center bg-black/80 px-4 py-2 rounded-xl">
          <Text className="text-white font-semibold">{toast}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}
