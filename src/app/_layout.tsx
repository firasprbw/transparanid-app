import "../global.css"
import { useEffect } from "react"
import { Stack, useRouter, useSegments } from "expo-router"
import { Provider as PaperProvider } from "react-native-paper"
import { AuthProvider, useAuth } from "@/contexts/auth-context"

function AuthGate() {
  const { user, loading } = useAuth()
  const segments           = useSegments()
  const router             = useRouter()

  useEffect(() => {
    if (loading) return

    const inAuth = segments[0] === "(auth)"

    if (!user && !inAuth) {
      router.replace("/(auth)/login")
    } else if (user && inAuth) {
      router.replace("/(tabs)")
    }
  }, [user, loading])

  return null
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <PaperProvider>
        <AuthGate />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)"  options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)"  options={{ headerShown: false }} />
          <Stack.Screen
            name="report/[slug]"
            options={{
              headerShown: true,
              title: "Detail Laporan",
              headerBackTitle: "Kembali"
            }}
          />
        </Stack>
      </PaperProvider>
    </AuthProvider>
  )
}