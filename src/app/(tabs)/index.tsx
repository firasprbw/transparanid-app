import { useEffect, useState, useCallback } from "react"
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from "react-native"
import { useRouter } from "expo-router"
import { reportsApi, Report } from "@/lib/api/reports"
import { formatDistanceToNow } from "date-fns"
import { id } from "date-fns/locale"

function ReportCard({ report, onPress }: { report: Report; onPress: () => void }) {
  return (
    <TouchableOpacity
      className="bg-white mx-4 mb-3 rounded-2xl p-4 shadow-sm border border-gray-100"
      onPress={onPress}
      activeOpacity={0.7}
    >
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
        {report.entity?.display_name ?? report.entity?.display_name}
      </Text>

      {/* FOOTER */}
      <View className="flex-row items-center justify-between mt-1">
        <Text className="text-gray-400 text-xs">
          {report.location}
        </Text>
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
            Rp {report.estimated_amount.toLocaleString("id-ID")}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  )
}

export default function FeedScreen() {
  const router = useRouter()

  const [reports, setReports]     = useState<Report[]>([])
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError]         = useState("")

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
      {/* HEADER */}
      <View className="bg-white px-4 pt-14 pb-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">TransparanID</Text>
        <Text className="text-sm text-gray-500 mt-0.5">Laporan korupsi terbaru</Text>
      </View>

      {error ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-red-500 text-sm">{error}</Text>
          <TouchableOpacity
            className="mt-3 bg-blue-600 px-6 py-2 rounded-xl"
            onPress={() => fetchReports()}
          >
            <Text className="text-white text-sm">Coba lagi</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={reports}
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
              tintColor="#2563eb"
            />
          }
          contentContainerClassName="pt-4 pb-8"
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-gray-400 text-sm">Belum ada laporan</Text>
            </View>
          }
        />
      )}
    </View>
  )
}