const BASE_URL = process.env.EXPO_PUBLIC_API_URL

export interface Comment {
  id: string
  content: string
  created_at: string
  status: string
  parent_id: string | null
  users: { id: string; username: string }
  replies?: Comment[]
}

const authHeader = (token: string) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json"
})

export const commentsApi = {
  getByReport: async (reportId: string): Promise<Comment[]> => {
    const res = await fetch(`${BASE_URL}/reports/${reportId}/comments`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    return data.data
  },

  create: async (
    token: string,
    reportId: string,
    content: string,
    parentId?: string
  ): Promise<Comment> => {
    const res = await fetch(`${BASE_URL}/reports/${reportId}/comments`, {
      method: "POST",
      headers: authHeader(token),
      body: JSON.stringify({ content, parentId })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    return data.data
  }
}