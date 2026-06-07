const BASE_URL = process.env.EXPO_PUBLIC_API_URL

export interface Report {
  report_category: any
  id: string
  title: string
  slug: string
  description: string
  location: string
  estimated_amount: number
  incident_date: string
  created_at: string
  status: string
  entity: { id: string; display_name: string; type: string }
  category: { id: string; name: string }
  evidences: { id: string; file_url: string; file_type?: string }[]
}

export interface ReportDetail extends Report {
  entities: { id: string; display_name: string; type: string }
  report_categories: { id: string; name: string }
  report_evidences: { id: string; file_url: string; file_type?: string }[]
}

export interface Category {
  id: string
  name: string
}

const authHeader = (token: string) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json"
})

export const reportsApi = {
  getFeed: async (): Promise<Report[]> => {
    const res = await fetch(`${BASE_URL}/reports`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    return data.data
  },

  getDetail: async (slug: string): Promise<ReportDetail> => {
    const res = await fetch(`${BASE_URL}/reports/${slug}`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    return data.data
  },

  getCategories: async (): Promise<Category[]> => {
    const res = await fetch(`${BASE_URL}/categories`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    return data.data
  },

  getMyReports: async (token: string): Promise<Report[]> => {
    const res = await fetch(`${BASE_URL}/reports/my`, {
      headers: authHeader(token)
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    return data.data
  },

  create: async (token: string, formData: FormData): Promise<Report> => {
    const res = await fetch(`${BASE_URL}/reports`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    return data.data
  }
}