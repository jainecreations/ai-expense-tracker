import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, TextInput, Modal, Animated, LayoutChangeEvent, ScrollView } from 'react-native';
import useResolvedTheme from '@/hooks/useResolvedTheme';
import { categories } from '@/store/categories';
import { useTransactionStore } from '@/store/transactionStore';
import { useCategoryBudgetStore } from '@/store/categoryBudgetStore';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

function monthKey(d = new Date()) { return d.toISOString().slice(0, 7); }

export default function CategoryBudgets() {
    const router = useRouter();
    const { classFor } = useResolvedTheme();
    const transactions = useTransactionStore((s) => s.transactions) as any[];
    const { budgets, loadCategoryBudgets, setCategoryBudget } = useCategoryBudgetStore();
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [widths, setWidths] = useState<Record<string, number>>({});
    const anims = useRef<Record<string, Animated.Value>>({}).current;

    const now = new Date();
    const key = monthKey(now);

    useEffect(() => { loadCategoryBudgets(key); }, [key]);

    // ensure animated values exist
    categories.forEach((c) => {
        if (!anims[c.name]) anims[c.name] = new Animated.Value(0);
    });

    // compute spent per category
    const spentFor = (catName: string) => {
        const arr = transactions.filter((t) => {
            const d = new Date((t as any).date || (t as any).created_at || (t as any).timestamp || (t as any).time);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && ((t.category || t.name) === catName || (t.name === catName));
        });
        return arr.reduce((s, t) => s + (t.amount || 0), 0);
    };

    // animate when budgets or spent change
    useEffect(() => {
        categories.forEach((c) => {
            const budget = budgets[c.name] ?? 0;
            const spent = spentFor(c.name);
            const pct = budget > 0 ? Math.min(1, spent / budget) : 0;
            Animated.timing(anims[c.name], { toValue: pct, duration: 600, useNativeDriver: false }).start();
        });
    }, [budgets, transactions]);

    const openSetModal = (c: string) => {
        setSelectedCategory(c);
        const b = budgets[c];
        setEditValue(b != null ? String(Math.round(b)) : '');
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!selectedCategory) return setModalVisible(false);
        const v = Number(editValue.replace(/[^0-9.]/g, '')) || 0;
        await setCategoryBudget(selectedCategory, v, key);
        setModalVisible(false);
    };

    return (
        <SafeAreaView className={`flex-1 ${classFor('bg-white', 'bg-neutral-900')}`}>
            <ScrollView
                contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 40 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View className="flex-row items-center my-4">
                    <Ionicons onPress={() => router.back()} name="arrow-back-outline" size={24} color={classFor('#000', '#fff')} />
                    <Text className={classFor('flex-1 text-center text-2xl font-bold', 'flex-1 text-center text-2xl font-bold text-white')}>Category Budgets</Text>
                </View>

                <View className="space-y-4">
                    {categories.map((c) => {
                        const spent = spentFor(c.name);
                        const budget = budgets[c.name] ?? null;
                        const pct = budget && budget > 0 ? Math.round((spent / budget) * 100) : 0;
                        const color = budget && spent > budget ? '#EF4444' : (budget && pct >= 80 ? '#F59E0B' : '#10B981');
                        return (
                            <View key={c.name} className={`${classFor('bg-white', 'bg-neutral-800')} rounded-2xl p-4 mb-4 shadow-lg`}>
                                <View className="flex-row items-center justify-between">
                                    <Text className={classFor('text-base text-gray-800', 'text-base text-white')}>{c.name}</Text>
                                    <TouchableOpacity onPress={() => openSetModal(c.name)} className="px-3 py-1 bg-blue-600 rounded-full">
                                        <Text className="text-white">Set Budget</Text>
                                    </TouchableOpacity>
                                </View>
                                <View className="mt-3">
                                    <View onLayout={(e: LayoutChangeEvent) => {
                                        const w = e?.nativeEvent?.layout?.width;
                                        if (typeof w === 'number') setWidths((s) => ({ ...s, [c.name]: w }));
                                    }} className={`${classFor('w-full bg-gray-200 h-4 rounded-full overflow-hidden', 'w-full bg-neutral-700 h-4 rounded-full overflow-hidden')}`}>
                                        <Animated.View style={{ width: anims[c.name].interpolate({ inputRange: [0, 1], outputRange: [0, widths[c.name] || 0] }), height: 12, backgroundColor: color, borderRadius: 6 }} />
                                    </View>
                                    <Text className={classFor('mt-2 text-sm text-gray-600', 'mt-2 text-sm text-neutral-300')}>{budget != null ? `₹${spent.toFixed(0)} / ₹${budget.toFixed(0)} (${pct}%)` : `₹${spent.toFixed(0)} — No budget set`}</Text>
                                    <Text className={classFor('text-xs mt-1 text-gray-500', 'text-xs mt-1 text-neutral-400')}>{budget != null ? (spent > budget ? 'Over budget' : pct >= 80 ? 'Approaching budget' : 'Good') : 'No budget set'}</Text>
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* Modal */}
                <Modal visible={modalVisible} transparent animationType="slide">
                    <View className="flex-1 justify-end bg-black bg-opacity-30">
                        <View className={`${classFor('bg-white', 'bg-neutral-800')} rounded-t-2xl p-4`}>
                            <Text className={classFor('text-lg font-semibold mb-3 text-gray-800', 'text-lg font-semibold mb-3 text-white')}>Set Budget for {selectedCategory}</Text>
                            <View className="flex-row items-center">
                                <Text className={classFor('text-xl mr-2 text-gray-800', 'text-xl mr-2 text-white')}>₹</Text>
                                <TextInput value={editValue} onChangeText={setEditValue} keyboardType="numeric" className={classFor('flex-1 py-3 px-3 rounded-lg border border-gray-500 bg-white', 'flex-1 py-3 px-3 rounded-lg border border-neutral-700 bg-neutral-800')} placeholder="Enter amount" placeholderTextColor="#9CA3AF" />
                            </View>
                            <View className="flex-row justify-end mt-4">
                                <TouchableOpacity onPress={() => setModalVisible(false)} className="px-4 py-2 mr-2">
                                    <Text className={classFor('text-gray-700', 'text-neutral-300')}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleSave} className="bg-blue-600 px-4 py-2 rounded-full">
                                    <Text className="text-white">Save</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        </SafeAreaView>
    );
}
