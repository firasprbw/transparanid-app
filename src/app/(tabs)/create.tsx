import { useEffect, useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Platform
} from "react-native"
import * as ImagePicker from "expo-image-picker"
import { useRouter } from "expo-router"
import { reportsApi, Category } from "@/lib/api/reports"
import { useAuth } from "@/contexts/auth-context"

export default function CreateReportScreen() {
  const router      = useRouter()
  const { token }   = useAuth()

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState("")

  const [form, setForm] = useState({
    title: "",
    description: "",
    entityName: "",
    entityType: "LAINNYA",
    categoryId: "",
    location: "",
    incidentDate: "",
    estimatedAmount: ""
  })

  const [evidences, setEvidences] = useState<ImagePicker.ImagePickerAsset[]>([])

  useEffect(() => {
    reportsApi.getCategories()
      .then((data) => {
        setCategories(data ?? [])
        if (data?.length) setForm((f) => ({ ...f, categoryId: data[0].id }))
      })
      .catch(() => {})
  }, [])

  const update = (key: keyof typeof form) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }))

  const pickEvidences = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: true,
    quality: 0.8,
    selectionLimit: 5
  })
  
  console.log("canceled:", result.canceled)
  console.log("assets:", result.assets)
  
  if (!result.canceled) {
    setEvidences(result.assets.slice(0, 5))
    console.log("evidences set:", result.assets.length)
  }
}

  const handleSubmit = async () => {
    const { title, description, entityName, entityType, categoryId, location, incidentDate, estimatedAmount } = form

    if (!title || !description || !entityName || !categoryId || !location || !incidentDate || !estimatedAmount) {
      setError("Semua field wajib diisi")
      return
    }
    if (evidences.length === 0) {
      setError("Minimal 1 bukti wajib diupload")
      return
    }

    if (evidences.length === 0 && Platform.OS !== "web") {
    setError("Minimal 1 bukti wajib diupload")
    return
  }

    setLoading(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("title", title)
      formData.append("description", description)
      formData.append("entityName", entityName)
      formData.append("entityType", entityType)
      formData.append("categoryId", categoryId)
      formData.append("location", location)
      formData.append("incidentDate", incidentDate)
      formData.append("estimatedAmount", estimatedAmount)

      evidences.forEach((asset, i) => {
  const ext = asset.uri.split(".").pop()?.toLowerCase() ?? "jpg"
  const mimeType = asset.mimeType ?? `image/${ext === "jpg" ? "jpeg" : ext}`

  formData.append("evidences", {
    uri: asset.uri,
    name: asset.fileName ?? `evidence_${i}.${ext}`,
    type: mimeType
  } as any)
})

      await reportsApi.create(token!, formData)
      Alert.alert("Berhasil", "Laporan berhasil dikirim dan menunggu review.", [
        { text: "OK", onPress: () => router.replace("/(tabs)") }
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim laporan")
    } finally {
      setLoading(false)
    }
  }

  const ENTITY_TYPES = ["PEMERINTAH", "PERUSAHAAN", "INDIVIDU", "ORGANISASI", "PENDIDIKAN", "LAINNYA"]

  return (
    <ScrollView className="flex-1 bg-gray-50" keyboardShouldPersistTaps="handled">
      {/* HEADER */}
      <View className="bg-white px-4 pt-14 pb-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">Buat Laporan</Text>
        <Text className="text-sm text-gray-500 mt-0.5">Laporkan dugaan korupsi</Text>
      </View>

      <View className="px-4 py-4 gap-4">

        {/* TITLE */}
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-1">Judul Laporan *</Text>
          <TextInput
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
            placeholder="Judul singkat dan jelas"
            placeholderTextColor="#9ca3af"
            value={form.title}
            onChangeText={update("title")}
          />
        </View>

        {/* ENTITY NAME */}
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-1">Nama Entitas *</Text>
          <TextInput
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
            placeholder="Nama instansi / perusahaan"
            placeholderTextColor="#9ca3af"
            value={form.entityName}
            onChangeText={update("entityName")}
          />
        </View>

        {/* ENTITY TYPE */}
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-2">Jenis Entitas *</Text>
          <View className="flex-row flex-wrap gap-2">
            {ENTITY_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                className={`px-4 py-2 rounded-xl border ${
                  form.entityType === type
                    ? "bg-blue-600 border-blue-600"
                    : "bg-white border-gray-200"
                }`}
                onPress={() => update("entityType")(type)}
              >
                <Text className={`text-sm font-medium ${
                  form.entityType === type ? "text-white" : "text-gray-600"
                }`}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* CATEGORY */}
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-2">Kategori *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  className={`px-4 py-2 rounded-xl border ${
                    form.categoryId === cat.id
                      ? "bg-blue-600 border-blue-600"
                    : "bg-white border-gray-200"
                  }`}
                  onPress={() => update("categoryId")(cat.id)}
                >
                  <Text className={`text-sm font-medium ${
                    form.categoryId === cat.id ? "text-white" : "text-gray-600"
                  }`}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* LOCATION */}
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-1">Lokasi *</Text>
          <TextInput
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
            placeholder="Kota / Kabupaten"
            placeholderTextColor="#9ca3af"
            value={form.location}
            onChangeText={update("location")}
          />
        </View>

        {/* INCIDENT DATE */}
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-1">Tanggal Kejadian *</Text>
          <TextInput
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9ca3af"
            value={form.incidentDate}
            onChangeText={update("incidentDate")}
          />
        </View>

        {/* ESTIMATED AMOUNT */}
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-1">Estimasi Kerugian (Rp) *</Text>
          <TextInput
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
            placeholder="Contoh: 50000000"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
            value={form.estimatedAmount}
            onChangeText={update("estimatedAmount")}
          />
        </View>

        {/* DESCRIPTION */}
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-1">Deskripsi *</Text>
          <TextInput
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
            placeholder="Jelaskan kronologi kejadian secara detail"
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            value={form.description}
            onChangeText={update("description")}
            style={{ minHeight: 120 }}
          />
        </View>

        {/* EVIDENCES */}
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Bukti
          </Text>
          <TouchableOpacity
            className="bg-white border-2 border-dashed border-gray-200 rounded-xl py-4 items-center mb-3"
            onPress={pickEvidences}
          >
            <Text className="text-blue-600 font-medium text-sm">
              {evidences.length > 0 ? `${evidences.length} foto dipilih` : "+ Pilih Foto"}
            </Text>
          </TouchableOpacity>

          {evidences.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {evidences.map((asset, i) => (
                  <Image
                    key={i}
                    source={{ uri: asset.uri }}
                    className="w-20 h-20 rounded-xl"
                    resizeMode="cover"
                  />
                ))}
              </View>
            </ScrollView>
          )}
        </View>

        {error ? (
          <Text className="text-red-500 text-sm">{error}</Text>
        ) : null}

        {/* SUBMIT */}
        <TouchableOpacity
          className="bg-blue-600 rounded-xl py-4 items-center mt-2 mb-8"
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text className="text-white font-semibold text-base">Kirim Laporan</Text>
          }
        </TouchableOpacity>

      </View>
    </ScrollView>
  )
}