import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Switch, Alert, ScrollView, Platform, PermissionsAndroid } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useThemeStore } from "@/store/themeStore";
import { SafeAreaView } from "react-native-safe-area-context";
import useResolvedTheme from '@/hooks/useResolvedTheme';
import { useAuthStore } from "@/store/authStore";
import { useTransactionStore } from "@/store/transactionStore";
import { Ionicons } from "@expo/vector-icons";

type Appearance =  "light" | "dark" | "system";

const APPEARANCE_KEY = "settings:appearance";
const WEEKLY_KEY = "settings:weeklySummary";
const OVERSPEND_KEY = "settings:overspendingAlerts";
const SMART_SMS_KEY = 'settings:smartSmsCapture';

export default function SettingsScreen() {
    const router = useRouter();
    const signOut = useAuthStore((s) => s.signOut);
    const clearTransactions = () => useTransactionStore.setState({ transactions: [] });

    const [appearance, setAppearance] = useState<Appearance>("light");
    const [weeklySummary, setWeeklySummary] = useState(false);
    const [overspendAlerts, setOverspendAlerts] = useState(false);
    const [smartSmsEnabled, setSmartSmsEnabled] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const a = await AsyncStorage.getItem(APPEARANCE_KEY);
                if (a === "light" || a === "dark" || a === "system") setAppearance(a as Appearance);
                const w = await AsyncStorage.getItem(WEEKLY_KEY);
                if (w != null) setWeeklySummary(w === "1");
                const o = await AsyncStorage.getItem(OVERSPEND_KEY);
                if (o != null) setOverspendAlerts(o === "1");
                const s = await AsyncStorage.getItem(SMART_SMS_KEY);
                if (s != null) setSmartSmsEnabled(s === '1');
            } catch (err) {
                console.warn("Failed to load settings", err);
            }
        })();
    }, []);

        const setTheme = useThemeStore((s) => s.setAppearance);

        const saveAppearance = async (a: Appearance) => {
            setAppearance(a);
            try {
                // update central theme store (it will persist)
                await setTheme(a);
            } catch (err) {
                console.warn("Failed to save appearance", err);
            }
        };

    const toggleWeekly = async (v: boolean) => {
        setWeeklySummary(v);
        try {
            await AsyncStorage.setItem(WEEKLY_KEY, v ? "1" : "0");
        } catch (err) {
            console.warn("Failed to save weekly summary setting", err);
        }
    };

    const toggleOverspend = async (v: boolean) => {
        setOverspendAlerts(v);
        try {
            await AsyncStorage.setItem(OVERSPEND_KEY, v ? "1" : "0");
        } catch (err) {
            console.warn("Failed to save overspend setting", err);
        }
    };

    const toggleSmartSms = async (v: boolean) => {
        if (Platform.OS !== 'android') {
            Alert.alert('Smart SMS Capture', 'This feature is available on Android only.');
            return;
        }

        if (v) {
            // show permission UX
            Alert.alert(
                'Smart SMS Capture',
                'Read transaction SMS to auto-add expenses. We only scan OTP/transaction messages, not personal chats.',
                [
                    {
                        text: 'Not Now',
                        style: 'cancel',
                        onPress: async () => {
                            setSmartSmsEnabled(false);
                            await AsyncStorage.setItem(SMART_SMS_KEY, '0');
                        },
                    },
                    {
                        text: 'Allow SMS Access',
                        onPress: async () => {
                            try {
                                const receive = PermissionsAndroid.PERMISSIONS.RECEIVE_SMS;
                                const read = PermissionsAndroid.PERMISSIONS.READ_SMS;
                                const grantedReceive = await PermissionsAndroid.request(receive, {
                                    title: 'Receive SMS Permission',
                                    message: 'This app needs permission to receive SMS to detect incoming transaction messages.',
                                    buttonPositive: 'OK',
                                });
                                const grantedRead = await PermissionsAndroid.request(read, {
                                    title: 'Read SMS Permission',
                                    message: 'This app needs permission to read SMS to detect incoming transaction messages.',
                                    buttonPositive: 'OK',
                                });

                                const ok = grantedReceive === PermissionsAndroid.RESULTS.GRANTED;
                                if (ok) {
                                    setSmartSmsEnabled(true);
                                    await AsyncStorage.setItem(SMART_SMS_KEY, '1');
                                } else {
                                    Alert.alert('Permission denied', 'Receive SMS permission denied; Smart Capture will remain disabled.');
                                    setSmartSmsEnabled(false);
                                    await AsyncStorage.setItem(SMART_SMS_KEY, '0');
                                }
                            } catch (e) {
                                console.warn('Failed to request SMS permissions', e);
                                setSmartSmsEnabled(false);
                                await AsyncStorage.setItem(SMART_SMS_KEY, '0');
                            }
                        },
                    },
                ]
            );
        } else {
            setSmartSmsEnabled(false);
            await AsyncStorage.setItem(SMART_SMS_KEY, '0');
        }
    };

    const handleClearCache = () => {
        Alert.alert(
            "Clear local cache",
            "This will remove locally cached data and settings. This does not delete server data. Continue?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Clear",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            // Remove only known settings keys instead of clearing all AsyncStorage
                            const keysToRemove = [APPEARANCE_KEY, WEEKLY_KEY, OVERSPEND_KEY];
                            await AsyncStorage.multiRemove(keysToRemove);
                            clearTransactions();
                            Alert.alert("Cleared", "Selected local settings and cache were cleared.");
                        } catch (err) {
                            console.warn(err);
                            Alert.alert("Error", "Failed to clear local cache.");
                        }
                    },
                },
            ]
        );
    };

    const handleLogout = async () => {
        await signOut();
        // Root layout reacts to user change; avoid navigation here.
    };

    const { classFor } = useResolvedTheme();

    return (
        <SafeAreaView className={classFor('flex-1 bg-[#f7fafc]','flex-1 bg-neutral-900')}>
            <ScrollView className="px-5 py-6">
                {/* Header */}
                <View className="flex-row items-center my-4">
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="gray" />
                    </TouchableOpacity>
                    <Text className={classFor('flex-1 text-center text-2xl font-bold text-gray-800','flex-1 text-center text-2xl font-bold text-white')}>Settings</Text>
                </View>

                {/* Appearance */}
                <View className={`${classFor('mb-6 bg-white','mb-6 bg-neutral-800')} rounded-2xl p-4 shadow-sm`}>
                    <Text className={classFor('text-lg font-semibold mb-3','text-lg font-semibold mb-3 text-white')}>Appearance</Text>
                    {(["light", "dark", "system"] as Appearance[]).map((opt) => (
                        <TouchableOpacity
                            key={opt}
                            onPress={() => saveAppearance(opt)}
                            className="flex-row items-center justify-between py-3"
                        >
                            <Text className={classFor('text-base capitalize','text-base capitalize text-white')}>{opt.replace(/^[a-z]/, (c) => c.toUpperCase())}</Text>
                            <View className={`w-4 h-4 rounded-full ${appearance === opt ? 'bg-blue-500' : 'border border-gray-300'}`} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Notifications */}
                <View className={`${classFor('mb-6 bg-white','mb-6 bg-neutral-800')} rounded-2xl p-4 shadow-sm`}>
                    <Text className={classFor('text-lg font-semibold mb-3','text-lg font-semibold mb-3 text-white')}>Notifications</Text>
                    <View className="flex-row items-center justify-between py-3">
                        <View>
                            <Text className={classFor('text-base','text-base text-white')}>Weekly summary</Text>
                            <Text className={classFor('text-sm text-gray-500','text-sm text-gray-300')}>A weekly email / summary of spending</Text>
                        </View>
                        <Switch value={weeklySummary} onValueChange={toggleWeekly} />
                    </View>
                    <View className="flex-row items-center justify-between py-3">
                        <View>
                            <Text className={classFor('text-base','text-base text-white')}>Overspending alerts</Text>
                            <Text className={classFor('text-sm text-gray-500','text-sm text-gray-300')}>Notify when spending exceeds budget</Text>
                        </View>
                        <Switch value={overspendAlerts} onValueChange={toggleOverspend} />
                    </View>

                    {/* <View className="flex-row items-center justify-between py-3">
                        <View style={{ flex: 1 }}>
                            <Text className={classFor('text-base','text-base text-white')}>Smart SMS Capture</Text>
                            <Text className={classFor('text-sm text-gray-500','text-sm text-gray-300')}>Read transaction SMS to auto-add expenses. (Android only)</Text>
                        </View>
                        <Switch value={smartSmsEnabled} onValueChange={toggleSmartSms} />
                    </View> */}
                </View>

                {/* Data & Backup */}
                <View className={`${classFor('mb-6 bg-white','mb-6 bg-neutral-800')} rounded-2xl p-4 shadow-sm`}>
                    <Text className={classFor('text-lg font-semibold mb-3','text-lg font-semibold mb-3 text-white')}>Data & Backup</Text>
                    <TouchableOpacity onPress={() => router.push('/data-backup')} className="py-3">
                        <Text className={classFor('text-base','text-base text-white')}>Export / Import</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleClearCache} className="py-3">
                        <Text className="text-base text-red-600">Clear local cache</Text>
                    </TouchableOpacity>
                </View>

                {/* About */}
                <View className={`${classFor('mb-6 bg-white','mb-6 bg-neutral-800')} rounded-2xl p-4 shadow-sm`}>
                    <Text className={classFor('text-lg font-semibold mb-3','text-lg font-semibold mb-3 text-white')}>About</Text>
                    <View className="py-3">
                        <Text className={classFor('text-base','text-base text-white')}>Version</Text>
                        <Text className={classFor('text-sm text-gray-500','text-sm text-gray-300')}>{(require("../../package.json").version) || "—"}</Text>
                    </View>
                    {/* <TouchableOpacity onPress={() => Alert.alert("Privacy", "Privacy policy placeholder — add your URL here.")} className="py-3">
                        <Text className={classFor('text-base','text-base')}>Privacy</Text>
                    </TouchableOpacity> */}
                </View>

                {/* Logout */}
                {/* <View className="my-6">
                    <TouchableOpacity onPress={handleLogout} className="bg-red-600 rounded-full py-3">
                        <Text className="text-center text-white font-semibold">Logout</Text>
                    </TouchableOpacity>
                </View> */}
            </ScrollView>
        </SafeAreaView>
    );
}
