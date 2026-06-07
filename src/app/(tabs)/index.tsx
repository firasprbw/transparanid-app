import { useEffect, useState, useCallback } from "react"
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  ScrollView,
  TextInput,
  Animated,
  StatusBar
} from "react-native"
import { useRouter } from "expo-router"
import { reportsApi, Report } from "@/lib/api/reports"
import { formatDistanceToNow } from "date-fns"
import { id } from "date-fns/locale"
import { SafeAreaView } from "react-native-safe-area-context"
import { Search, X } from "lucide-react-native"

function ReportCard({ report, onPress }: { report: Report; onPress: () => void }) {
  const evidences = report.evidences ?? []

  return (
    <SafeAreaView>
      <TouchableOpacity
      className="bg-white mx-4 mb-3 rounded-2xl overflow-hidden border border-black"
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* EVIDENCE IMAGES */}
      {evidences.length > 0 && (
        evidences.length === 1 ? (
          <Image
            source={{ uri: evidences[0].file_url }}
            className="w-full h-44 bg-gray-100"
            resizeMode="cover"
          />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="h-44"
          >
            {evidences.map((ev, i) => (
              <Image
                key={i}
                source={{ uri: ev.file_url }}
                className="w-64 h-64 bg-gray-100"
                resizeMode="cover"
                style={{ marginRight: 2 }}
              />
            ))}
          </ScrollView>
        )
      )}

      <View className="p-4">
        {/* CATEGORY BADGE */}
        <View className="flex-row mb-2">
          <View className="bg-blue-50 rounded-full px-3 py-1">
            <Text className="text-blue-600 text-xs font-medium">
              {report.category?.name ?? report.report_category?.name}
            </Text>
          </View>
        </View>

        {/* TITLE */}
        <Text className="text-gray-900 font-semibold text-base mb-1" numberOfLines={2}>
          {report.title}
        </Text>

        {/* ENTITY */}
        <Text className="text-gray-500 text-sm mb-2" numberOfLines={1}>
          Terlapor: {report.entity?.display_name ?? report.entity?.display_name}
        </Text>

        {/* FOOTER */}
        <View className="flex-row items-center justify-between mt-1">
          <Text className="text-gray-400 text-xs">Lokasi Kejadian: {report.location}</Text>
          <Text className="text-gray-400 text-xs">
            {formatDistanceToNow(new Date(report.created_at), {
              addSuffix: true,
              locale: id
            })}
          </Text>
        </View>

        {/* AMOUNT */}
        {report.estimated_amount ? (
          <View className="mt-2 pt-2 border-t border-gray-50">
            <Text className="text-gray-700 text-sm font-medium">
              Total Kerugian: Rp {report.estimated_amount.toLocaleString("id-ID")}
            </Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
    </SafeAreaView>
    
  )
}

export default function FeedScreen() {
  const router = useRouter()

  const [reports, setReports]       = useState<Report[]>([])
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError]           = useState("")
  const [search, setSearch]         = useState("") 

  const fetchReports = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError("")
    try {
      const data = await reportsApi.getFeed()
      setReports(data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat laporan")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  const filteredReports = reports.filter(r =>   // ← dan ini
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.location?.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => { fetchReports() }, [fetchReports])

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-gray-50">
  <StatusBar barStyle="dark-content" />

  {/* HEADER */}
  <View
    className="bg-white px-4 pb-3"
    style={{ borderBottomWidth: 0.5, borderBottomColor: "rgba(0,0,0,0.1)" }}
  >
    <Text className="text-2xl font-black text-black tracking-tight mb-3">
      Laporan
    </Text>

    {/* SEARCH BAR */}
    <View
      className="flex-row items-center bg-white rounded-2xl px-3 border mb-2"
      style={{ height: 50 }}
    >
      <Search size={16} color="#8e8e93" strokeWidth={2} />
      <TextInput
        className="flex-1 px-4 text-base text-black"
        placeholder="Cari laporan..."
        placeholderTextColor="#8e8e93"
        value={search}
        onChangeText={setSearch}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
      {search.length > 0 && (
        <TouchableOpacity onPress={() => setSearch("")} hitSlop={8}>
          <View className="w-4 h-4 rounded-full bg-gray-400 items-center justify-center">
            <X size={10} color="#fff" strokeWidth={2.5} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  </View>

  {error ? (
    <View className="flex-1 items-center justify-center px-8">
      <Text className="text-4xl mb-3">⚠️</Text>
      <Text className="text-gray-700 font-semibold text-base text-center mb-1">
        Gagal memuat laporan
      </Text>
      <Text className="text-gray-400 text-sm text-center mb-5">{error}</Text>
      <TouchableOpacity
        className="bg-black px-8 py-3 rounded-xl"
        onPress={() => fetchReports()}
      >
        <Text className="text-white text-sm font-semibold">Coba Lagi</Text>
      </TouchableOpacity>
    </View>
  ) : (
    <FlatList
      data={filteredReports}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ReportCard
          report={item}
          onPress={() => router.push(`/report/${item.slug}`)}
        />
      )}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchReports(true)}
          tintColor="#000"
        />
      }
      contentContainerStyle={{ paddingTop: 12, paddingBottom: 112 }}
      ListEmptyComponent={
        <View className="items-center justify-center py-24">
          <Text className="text-4xl mb-3">
            {search ? "🔍" : "📭"}
          </Text>
          <Text className="text-gray-500 font-semibold">
            {search ? "Tidak ada hasil" : "Belum ada laporan"}
          </Text>
          <Text className="text-gray-400 text-sm mt-1">
            {search ? `Coba kata kunci lain` : "Jadilah yang pertama melapor"}
          </Text>
        </View>
      }
    />
  )}
</View>
  )
}