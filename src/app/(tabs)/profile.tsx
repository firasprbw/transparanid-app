import { useEffect, useState, useCallback } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from "react-native"
import { useRouter } from "expo-router"
import { useAuth } from "@/contexts/auth-context"
import { reportsApi, Report } from "@/lib/api/reports"
import { formatDistanceToNow } from "date-fns"
import { id } from "date-fns/locale"

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  PENDING_REVIEW: { label: "Menunggu Review", color: "text-yellow-700", bg: "bg-yellow-50" },
  PUBLISHED:      { label: "Dipublikasikan",  color: "text-green-700",  bg: "bg-green-50"  },
  REJECTED:       { label: "Ditolak",         color: "text-red-700",    bg: "bg-red-50"    }
}

function MyReportCard({ report, onPress }: { report: Report; onPress: () => void }) {
  const status = STATUS_MAP[report.status] ?? { label: report.status, color: "text-gray-600", bg: "bg-gray-50" }

  return (
    <TouchableOpacity
      className="bg-white rounded-2xl p-4 mb-3 border border-gray-100"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="flex-row items-start justify-between gap-2 mb-1">
        <Text className="text-gray-900 font-semibold text-sm flex-1" numberOfLines={2}>
          {report.title}
        </Text>
        <View className={`rounded-full px-2 py-0.5 ${status.bg}`}>
          <Text className={`text-xs font-medium ${status.color}`}>{status.label}</Text>
        </View>
      </View>
      <Text className="text-gray-400 text-xs">
        {formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: id })}
      </Text>
    </TouchableOpacity>
  )
}

export default function ProfileScreen() {
  const router          = useRouter()
  const { user, token, logout } = useAuth()

  const [reports, setReports]     = useState<Report[]>([])
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchMyReports = useCallback(async (isRefresh = false) => {
    if (!token) return
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const data = await reportsApi.getMyReports(token)
      setReports(data ?? [])
    } catch {
      // silent
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token])

  useEffect(() => { fetchMyReports() }, [fetchMyReports])

  const handleLogout = () => {
  Alert.alert("Keluar", "Yakin ingin keluar?", [
    { text: "Batal", style: "cancel" },
    {
      text: "Keluar",
      style: "destructive",
      onPress: async () => {
        router.replace("/(auth)/login")
        await logout()
      }
    }
  ])
}

  const stats = {
    total:   reports.length,
    pending: reports.filter((r) => r.status === "PENDING_REVIEW").length,
    published: reports.filter((r) => r.status === "PUBLISHED").length,
    rejected: reports.filter((r) => r.status === "REJECTED").length
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchMyReports(true)}
          tintColor="#2563eb"
        />
      }
    >
      {/* PROFILE HEADER */}
      <View className="bg-white px-4 pt-14 pb-6 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            {/* AVATAR */}
            <View className="w-14 h-14 rounded-full bg-blue-600 items-center justify-center">
              <Text className="text-white text-xl font-bold">
                {user?.username?.[0]?.toUpperCase()}
              </Text>
            </View>
            <View>
              <Text className="text-lg font-bold text-gray-900">@{user?.username}</Text>
              <Text className="text-sm text-gray-500">{user?.email}</Text>
            </View>
          </View>

          <TouchableOpacity
            className="bg-red-50 border border-red-100 rounded-xl px-3 py-2"
            onPress={handleLogout}
          >
            <Text className="text-red-600 text-sm font-medium">Keluar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* STATS */}
      <View className="px-4 py-4">
        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Statistik Laporan
        </Text>
        <View className="flex-row gap-3">
          {[
            { label: "Total",    value: stats.total,     bg: "bg-blue-50",   text: "text-blue-700"  },
            { label: "Pending",  value: stats.pending,   bg: "bg-yellow-50", text: "text-yellow-700"},
            { label: "Published",value: stats.published, bg: "bg-green-50",  text: "text-green-700" },
            { label: "Ditolak",  value: stats.rejected,  bg: "bg-red-50",    text: "text-red-700"   }
          ].map(({ label, value, bg, text }) => (
            <View key={label} className={`flex-1 ${bg} rounded-2xl p-3 items-center`}>
              <Text className={`text-2xl font-bold ${text}`}>{value}</Text>
              <Text className={`text-xs font-medium ${text} mt-0.5`}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* MY REPORTS */}
      <View className="px-4 pb-8">
        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Laporan Saya
        </Text>

        {loading ? (
          <ActivityIndicator color="#2563eb" />
        ) : reports.length === 0 ? (
          <View className="bg-white rounded-2xl p-6 items-center border border-gray-100">
            <Text className="text-gray-400 text-sm">Belum ada laporan</Text>
            <TouchableOpacity
              className="mt-3 bg-blue-600 px-6 py-2 rounded-xl"
              onPress={() => router.push("/(tabs)/create")}
            >
              <Text className="text-white text-sm font-medium">Buat Laporan</Text>
            </TouchableOpacity>
          </View>
        ) : (
          reports.map((report) => (
            <MyReportCard
              key={report.id}
              report={report}
              onPress={() => router.push(`/report/${report.slug}`)}
            />
          ))
        )}
      </View>

    </ScrollView>
  )
}