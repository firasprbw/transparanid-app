'use client'

import { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Pressable
} from 'react-native'
import { useRouter } from 'expo-router'
import * as DocumentPicker from 'expo-document-picker'
import { sendChatMessage, submitReportFromChat } from '@/lib/api/chatbot'
import type { ChatMessage, ReportData } from '@/lib/api/chatbot'

const WELCOME_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: 'Halo! Saya asisten virtual TransparanID 👋\n\nSaya bisa membantu Anda:\n• Membuat laporan fraud/korupsi\n• Menjawab pertanyaan tentang platform ini\n\nKetik "buat laporan" untuk mulai melaporkan, atau tanyakan apa saja!'
}

interface EvidenceFile {
  uri: string
  name: string
  type: string
}

// ── Report Summary Card ──────────────────────────────────────────────────────

function ReportSummaryCard({
  data,
  files,
  onAttach,
  onConfirm,
  onCancel,
  loading
}: {
  data: ReportData
  files: EvidenceFile[]
  onAttach: () => void
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  const fields = [
    { label: 'Judul', value: data.title },
    { label: 'Entitas', value: `${data.entityName} (${data.entityType})` },
    { label: 'Deskripsi', value: data.description },
    { label: 'Tanggal', value: new Date(data.incidentDate).toLocaleDateString('id-ID', { dateStyle: 'long' }) },
    { label: 'Lokasi', value: data.location },
    { label: 'Est. Kerugian', value: `Rp ${Number(data.estimatedAmount).toLocaleString('id-ID')}` },
  ]

  return (
    <View className="mx-4 mb-4 rounded-2xl border border-gray-200 bg-white p-4">
      <Text className="text-sm font-semibold text-gray-900 mb-3">📋 Ringkasan Laporan</Text>

      {fields.map(f => (
        <View key={f.label} className="flex-row mb-2">
          <Text className="text-xs text-gray-500 w-28 shrink-0">{f.label}</Text>
          <Text className="text-xs text-gray-900 font-medium flex-1">{f.value}</Text>
        </View>
      ))}

      {/* Evidence attachment */}
      <TouchableOpacity
        onPress={onAttach}
        className="flex-row items-center gap-2 mt-3 mb-1"
      >
        <Text className="text-xs text-black font-medium">📎 Lampirkan Bukti ({files.length}/5)</Text>
      </TouchableOpacity>

      {files.map((f, i) => (
        <Text key={i} className="text-xs text-gray-500 ml-5 mb-0.5" numberOfLines={1}>• {f.name}</Text>
      ))}

      {files.length === 0 && (
        <View className="bg-amber-50 rounded-lg px-3 py-2 mt-2">
          <Text className="text-xs text-amber-700">⚠️ Minimal 1 file bukti wajib dilampirkan</Text>
        </View>
      )}

      <View className="flex-row gap-2 mt-4">
        <TouchableOpacity
          onPress={onConfirm}
          disabled={loading || files.length === 0}
          className="flex-1 bg-black rounded-xl py-3 items-center"
          style={{ opacity: loading || files.length === 0 ? 0.4 : 1 }}
        >
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text className="text-white text-sm font-semibold">✓ Kirim Laporan</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onCancel}
          disabled={loading}
          className="px-4 rounded-xl border border-gray-300 items-center justify-center"
        >
          <Text className="text-sm text-gray-700">Batal</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

// ── Message Bubble ────────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  return (
    <View className={`flex-row mb-3 px-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <View className="w-7 h-7 rounded-full bg-gray-100 items-center justify-center mr-2 mt-0.5 shrink-0">
          <Text className="text-xs">🤖</Text>
        </View>
      )}

      <View
        className={`rounded-2xl px-4 py-2.5 max-w-[78%] ${
          isUser
            ? 'bg-black rounded-tr-sm'
            : 'bg-gray-100 rounded-tl-sm'
        }`}
      >
        <Text className={`text-sm leading-5 ${isUser ? 'text-white' : 'text-gray-900'}`}>
          {message.content}
        </Text>
      </View>

      {isUser && (
        <View className="w-7 h-7 rounded-full bg-black items-center justify-center ml-2 mt-0.5 shrink-0">
          <Text className="text-xs text-white">U</Text>
        </View>
      )}
    </View>
  )
}

// ── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <View className="flex-row px-4 mb-3 justify-start">
      <View className="w-7 h-7 rounded-full bg-gray-100 items-center justify-center mr-2 mt-0.5">
        <Text className="text-xs">🤖</Text>
      </View>
      <View className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
        <Text className="text-gray-400 text-sm">sedang mengetik...</Text>
      </View>
    </View>
  )
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function ChatbotScreen() {
  const router = useRouter()
  const scrollRef = useRef<ScrollView>(null)

  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([])

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
  }, [messages, reportData])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || loading) return

    const userMessage: ChatMessage = { role: 'user', content: trimmed }
    const newMessages = [...messages, userMessage]

    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setReportData(null)

    try {
      const apiMessages = newMessages.slice(1) // skip welcome message
      const response = await sendChatMessage(apiMessages)

      setMessages(prev => [...prev, { role: 'assistant', content: response.reply }])

      if (response.reportReady && response.reportData) {
        setReportData(response.reportData)
      }
    } catch(err) {
        console.log('Chat error:', err)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Maaf, terjadi kesalahan. Silakan coba lagi.'
      }])
    } finally {
      setLoading(false)
    }
  }

  const handlePickFiles = async () => {
    if (evidenceFiles.length >= 5) {
      Alert.alert('Maksimal 5 file bukti')
      return
    }

    const result = await DocumentPicker.getDocumentAsync({
      multiple: true,
      type: ['image/*', 'application/pdf']
    })

    if (result.canceled) return

    const newFiles = result.assets.map(a => ({
      uri: a.uri,
      name: a.name,
      type: a.mimeType ?? 'application/octet-stream'
    }))

    setEvidenceFiles(prev => [...prev, ...newFiles].slice(0, 5))
  }

  const handleConfirmSubmit = async () => {
    if (!reportData) return
    setSubmitting(true)
    try {
      await submitReportFromChat(reportData, evidenceFiles)

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '✅ Laporan berhasil dikirim! Tim moderator akan meninjau dalam 1-3 hari kerja. Terima kasih!'
      }])

      setReportData(null)
      setEvidenceFiles([])

      setTimeout(() => router.push('/(tabs)/create'), 2000)
    } catch (err: any) {
      Alert.alert('Gagal', err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelSubmit = () => {
    setReportData(null)
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: 'Pengiriman dibatalkan. Ketik "buat laporan" untuk memulai ulang.'
    }])
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View className="px-4 pt-14 pb-4 border-b border-gray-100 flex-row items-center gap-3">
        <TouchableOpacity onPress={() => router.back()} className="mr-1">
          <Text className="text-base text-gray-500">←</Text>
        </TouchableOpacity>
        <View className="w-9 h-9 rounded-full bg-black items-center justify-center">
          <Text className="text-white text-base">🤖</Text>
        </View>
        <View>
          <Text className="text-base font-semibold text-gray-900">Asisten TransparanID</Text>
          <Text className="text-xs text-green-500">Online</Text>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerClassName="py-4"
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {loading && <TypingIndicator />}

        {reportData && !loading && (
          <ReportSummaryCard
            data={reportData}
            files={evidenceFiles}
            onAttach={handlePickFiles}
            onConfirm={handleConfirmSubmit}
            onCancel={handleCancelSubmit}
            loading={submitting}
          />
        )}
      </ScrollView>

      {/* Input */}
      <View className="px-4 py-3 border-t border-gray-100 flex-row items-end gap-2" style={{ paddingBottom: 100 }}>
        <TextInput
          className="flex-1 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 bg-gray-50 max-h-28"
          placeholder="Ketik pesan..."
          placeholderTextColor="#9ca3af"
          value={input}
          onChangeText={setInput}
          multiline
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!input.trim() || loading}
          className="w-11 h-11 rounded-2xl bg-black items-center justify-center"
          style={{ opacity: !input.trim() || loading ? 0.4 : 1 }}
        >
          <Text className="text-white text-base">↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}