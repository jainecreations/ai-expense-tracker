import { View, Text, Pressable } from 'react-native'
import React from 'react'
import { Stack, Tabs, useRouter } from 'expo-router'
import { Ionicons } from "@expo/vector-icons";

const TabLayout = () => {
    const router = useRouter();
    return (
        <>
            <Tabs
                screenOptions={{ headerShown: false }}
            >
                <Tabs.Screen name="index" options={{
                    tabBarLabel: "Home",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" size={size} color={color} />
                    )
                }} />
                <Tabs.Screen name="monthly-budget" options={{
                    tabBarLabel: "Budget",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="cash-outline" size={size} color={color} />
                    ),
                }} />
                <Tabs.Screen
                    name="dummy-screen"
                    options={{ tabBarLabel: "" }} // hide label if needed
                />
                <Tabs.Screen
                    name="insights"
                    options={{
                        tabBarLabel: "Insights",
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="stats-chart" size={size} color={color} />
                        ),
                    }}
                // listeners={{
                //   tabPress: (e) => {
                //     router.push("/add-expense");
                //   },
                // }}
                />
                <Tabs.Screen name="profile" options={{
                    tabBarLabel: "Profile",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person-circle" size={size} color={color} />
                    ),
                }} />
            </Tabs>

            <Pressable
                onPress={() => router.push("/add-expense")}
                className="absolute bottom-8 self-center w-[68px] h-[68px] bg-blue-500 rounded-full items-center justify-center shadow-lg shadow-black/30 active:scale-95"
            >
                <Ionicons name="add" size={38} color="white" />
            </Pressable>
        </>
    )
}

export default TabLayout