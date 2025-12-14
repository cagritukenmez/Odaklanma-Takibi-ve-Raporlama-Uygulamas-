import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitleAlign: "center",

        // Tab bar görünümü
        tabBarActiveTintColor: "#0A84FF",
        tabBarInactiveTintColor: "#8E8E93",
        tabBarStyle: {
          height: 62,
          paddingTop: 6,
          paddingBottom: 8,
          borderTopWidth: 0.5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Zamanlayıcı",
          tabBarLabel: "Odak",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "timer" : "timer-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="reports"
        options={{
          title: "Raporlar",
          tabBarLabel: "Rapor",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "stats-chart" : "stats-chart-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
