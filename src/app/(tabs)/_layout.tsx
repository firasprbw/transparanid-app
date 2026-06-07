import { Tabs } from "expo-router"
import { Home, PlusCircle, User } from "lucide-react-native"
import { Platform, View } from "react-native"
import { BlurView } from "expo-blur"

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#000000",
        tabBarInactiveTintColor: "#a3a3a3",
        tabBarStyle: {
          position: "absolute",
          bottom: 24,
          left: 24,
          right: 24,
          height: 68,
          borderRadius: 32,
          borderTopWidth: 0,
          backgroundColor: "transparent",
          elevation: 0,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={80}
            tint="light"
            style={{
              flex: 1,
              borderRadius: 32,
              overflow: "hidden",
              backgroundColor: "rgba(255, 255, 255, 0.14)",
              borderWidth: 0.5,
              borderColor: "rgba(255, 255, 255, 0.75)",
            }}
          />
        ),
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginBottom: 6,
        },
        tabBarIconStyle: {
          marginTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Beranda",
          tabBarIcon: ({ color, size }) => <Home color={color} size={22} strokeWidth={1.75} />
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Laporan",
          tabBarIcon: ({ color, focused }) => (
            <View>
              <PlusCircle
                color={focused ? "black" : "#a3a3a3"}
                size={22}
                strokeWidth={1.75}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => <User color={color} size={22} strokeWidth={1.75} />
        }}
      />
    </Tabs>
  )
}