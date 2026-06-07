import { useEffect, useState, useRef } from "react"
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform
} from "react-native"
import { useLocalSearchParams } from "expo-router"
import { reportsApi, ReportDetail } from "@/lib/api/reports"
import { commentsApi, Comment } from "@/lib/api/comments"
import { useAuth } from "@/contexts/auth-context"
import { formatDistanceToNow, format } from "date-fns"
import { id } from "date-fns/locale"

function CommentItem({ comment }: { comment: Comment }) {
  return (
    <View className="bg-white rounded-xl p-3 mb-2 border border-gray-100">
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-sm font-semibold text-gray-900">
          @{comment.users?.username}
        </Text>
        <Text className="text-xs text-gray-400">
          {formatDistanceToNow(new Date(comment.created_at), {
            addSuffix: true,
            locale: id
          })}
        </Text>
      </View>
      <Text className="text-sm text-gray-700">{comment.content}</Text>
    </View>
  )
}

export default function ReportDetailScreen() {
  const { slug }          = useLocalSearchParams<{ slug: string }>()
  const { user, token }   = useAuth()

  const [report, setReport]       = useState<ReportDetail | null>(null)
  const [comments, setComments]   = useState<Comment[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState("")
  const [comment, setComment]     = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        const r = await reportsApi.getDetail(slug)
        setReport(r)
        const c = await commentsApi.getByReport(r.id)
        setComments(c ?? [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat laporan")
      } finally {
        setLoading(false)
      }
    }
    if (slug) fetchAll()
  }, [slug])

  const handleSubmitComment = async () => {
    if (!comment.trim() || !token || !report) return
    setSubmitting(true)
    try {
      const newComment = await commentsApi.create(token, report.id, comment.trim())
      setComments((prev) => [newComment, ...prev])
      setComment("")
    } catch (err) {
      // silent fail for now
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    )
  }

  if (error || !report) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Text className="text-red-500 text-sm">{error || "Laporan tidak ditemukan"}</Text>
      </View>
    )
  }

  const evidences = report.report_evidences ?? report.evidences ?? []

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      <ScrollView contentContainerClassName="pb-4">

        {/* HERO INFO */}
        <View className="bg-white px-4 pt-4 pb-5 mb-3">
          {/* CATEGORY */}
          <View className="flex-row mb-3">
            <View className="bg-blue-50 rounded-full px-3 py-1">
              <Text className="text-blue-600 text-xs font-medium">
                {report.report_categories?.name ?? report.category?.name}
              </Text>
            </View>
          </View>

          <Text className="text-xl font-bold text-gray-900 mb-2">{report.title}</Text>

          {/* META */}
          <View className="gap-1">
            <Text className="text-sm text-gray-500">
              🏛 {report.entities?.display_name ?? report.entity?.display_name}
            </Text>
            <Text className="text-sm text-gray-500">📍 {report.location}</Text>
            <Text className="text-sm text-gray-500">
              📅 {format(new Date(report.incident_date), "d MMMM yyyy", { locale: id })}
            </Text>
            <Text className="text-base font-semibold text-gray-800 mt-1">
              Rp {report.estimated_amount?.toLocaleString("id-ID")}
            </Text>
          </View>
        </View>

        {/* DESCRIPTION */}
        <View className="bg-white px-4 py-4 mb-3">
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Deskripsi
          </Text>
          <Text className="text-sm text-gray-700 leading-relaxed">{report.description}</Text>
        </View>

        {/* EVIDENCES */}
        {evidences.length > 0 && (
          <View className="bg-white px-4 py-4 mb-3">
            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Bukti ({evidences.length})
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {evidences.map((ev) => (
                  <Image
                    key={ev.id}
                    source={{ uri: ev.file_url }}
                    className="w-28 h-28 rounded-xl bg-gray-100"
                    resizeMode="cover"
                  />
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* COMMENTS */}
        <View className="px-4">
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Komentar ({comments.length})
          </Text>
          {comments.length === 0 ? (
            <Text className="text-sm text-gray-400 text-center py-4">
              Belum ada komentar
            </Text>
          ) : (
            comments.map((c) => <CommentItem key={c.id} comment={c} />)
          )}
        </View>

      </ScrollView>

      {/* COMMENT INPUT */}
      {user && (
        <View className="bg-white border-t border-gray-100 px-4 py-3 flex-row items-center gap-3">
          <TextInput
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900"
            placeholder="Tulis komentar..."
            placeholderTextColor="#9ca3af"
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            className="bg-blue-600 rounded-xl px-4 py-2.5"
            onPress={handleSubmitComment}
            disabled={submitting || !comment.trim()}
          >
            {submitting
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text className="text-white font-medium text-sm">Kirim</Text>
            }
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  )
}