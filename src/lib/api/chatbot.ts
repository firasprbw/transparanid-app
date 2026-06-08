import AsyncStorage from '@react-native-async-storage/async-storage'

const API_URL = process.env.EXPO_PUBLIC_API_URL

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ReportData {
  title: string
  entityName: string
  entityType: string
  categoryId: string
  description: string
  incidentDate: string
  location: string
  estimatedAmount: number
}

export interface ChatResponse {
  success: boolean
  reply: string
  reportReady: boolean
  reportData: ReportData | null
}

export async function sendChatMessage(messages: ChatMessage[]): Promise<ChatResponse> {
  const token = await AsyncStorage.getItem('token')

  const response = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ messages })
  })

  const result = await response.json()
  if (!response.ok) throw new Error(result.message || 'Failed to send message')
  return result
}

export async function submitReportFromChat(
  reportData: ReportData,
  evidenceFiles: { uri: string; name: string; type: string }[]
): Promise<void> {
  const token = await AsyncStorage.getItem('token')

  const formData = new FormData()
  formData.append('title', reportData.title)
  formData.append('entityName', reportData.entityName)
  formData.append('entityType', reportData.entityType)
  formData.append('categoryId', reportData.categoryId)
  formData.append('description', reportData.description)
  formData.append('incidentDate', reportData.incidentDate)
  formData.append('location', reportData.location)
  formData.append('estimatedAmount', String(reportData.estimatedAmount))

  evidenceFiles.forEach(file => {
    formData.append('evidences', {
      uri: file.uri,
      name: file.name,
      type: file.type
    } as any)
  })

  const response = await fetch(`${API_URL}/reports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'multipart/form-data',
      ...(token ? { Cookie: `token=${token}` } : {})
    },
    body: formData
  })

  const result = await response.json()
  if (!response.ok) throw new Error(result.message || 'Failed to submit report')
}