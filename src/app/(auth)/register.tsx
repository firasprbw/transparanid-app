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
import { useRouter } from "expo-router"
import { authApi } from "@/lib/api/auth"

export default function RegisterScreen() {
  const router = useRouter()

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    phoneNumber: ""
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState("")

  const update = (key: keyof typeof form) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }))

  const handleRegister = async () => {
    const { username, email, password, phoneNumber } = form
    if (!username || !email || !password || !phoneNumber) {
      setError("Semua field wajib diisi")
      return
    }
    setLoading(true)
    setError("")
    try {
      await authApi.register(form)
      router.replace("/(auth)/login")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Register gagal")
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
        contentContainerClassName="px-6 py-12"
        keyboardShouldPersistTaps="handled"
      >
        {/* HEADER */}
        <View className="mb-10 items-center">
          <Text className="text-3xl font-bold text-gray-900">TransparanID</Text>
          <Text className="text-sm text-gray-500 mt-1">Buat akun baru</Text>
        </View>

        {/* FORM */}
        <View className="gap-4">
          {[
            { key: "username",    label: "Username",      placeholder: "johndoe",            keyboard: "default" },
            { key: "email",       label: "Email",         placeholder: "email@example.com",   keyboard: "email-address" },
            { key: "phoneNumber", label: "No. Telepon",   placeholder: "08123456789",         keyboard: "phone-pad" },
            { key: "password",    label: "Password",      placeholder: "••••••••",            keyboard: "default", secure: true }
          ].map(({ key, label, placeholder, keyboard, secure }) => (
            <View key={key}>
              <Text className="text-sm font-medium text-gray-700 mb-1">{label}</Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900 bg-gray-50"
                placeholder={placeholder}
                placeholderTextColor="#9ca3af"
                keyboardType={keyboard as any}
                autoCapitalize="none"
                secureTextEntry={secure}
                value={form[key as keyof typeof form]}
                onChangeText={update(key as keyof typeof form)}
              />
            </View>
          ))}

          {error ? (
            <Text className="text-red-500 text-sm">{error}</Text>
          ) : null}

          <TouchableOpacity
            className="bg-blue-600 rounded-xl py-4 items-center mt-2"
            onPress={handleRegister}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text className="text-white font-semibold text-base">Daftar</Text>
            }
          </TouchableOpacity>

          <View className="flex-row justify-center mt-4">
            <Text className="text-gray-500 text-sm">Sudah punya akun? </Text>
            <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
              <Text className="text-blue-600 text-sm font-medium">Masuk</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}