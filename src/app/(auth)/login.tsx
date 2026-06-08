import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator
} from "react-native"
import { authApi } from "@/lib/api/auth"
import { useAuth } from "@/contexts/auth-context"
import { CommandIcon } from "lucide-react-native"
import { useRouter } from "expo-router"

export default function LoginScreen() {
  const { login } = useAuth()

  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState("")
  const router = useRouter()

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Email dan password wajib diisi")
      return
    }
    setLoading(true)
    setError("")
    try {
      const data = await authApi.login(email, password)
      await login(data.data.token, data.data.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal")
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerClassName="flex-1 justify-center px-6 py-12"
        keyboardShouldPersistTaps="handled"
      >
        {/* HEADER */}
        <View className="mb-10 items-center">
          <CommandIcon></CommandIcon>
          <Text className="text-3xl font-bold text-gray-900">TransparanID</Text>
          <Text className="text-sm text-gray-500 mt-1">Platform pelaporan korupsi</Text>
        </View>

        {/* FORM */}
        <View className="gap-4">
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900 bg-gray-50"
              placeholder="email@example.com"
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">Password</Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900 bg-gray-50"
              placeholder="••••••••"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {error ? (
            <Text className="text-red-500 text-sm">{error}</Text>
          ) : null}

          <TouchableOpacity
            className="bg-black rounded-xl py-4 items-center mt-2"
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text className="text-white font-semibold text-base">Masuk</Text>
            }
          </TouchableOpacity>

          <View className="flex-row justify-center mt-4">
            <Text className="text-gray-500 text-sm">Belum punya akun? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
              <Text className="text-black text-sm font-medium">Daftar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}