import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { ReportData } from "./chatbot";

export interface EvidenceFile {
  uri: string;
  name: string;
  type: string;
}

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export interface Report {
  report_category: any;
  id: string;
  title: string;
  slug: string;
  description: string;
  location: string;
  estimated_amount: number;
  incident_date: string;
  created_at: string;
  status: string;
  entity: { id: string; display_name: string; type: string };
  category: { id: string; name: string };
  evidences: { id: string; file_url: string; file_type?: string }[];
}

export interface ReportDetail extends Report {
  entities: { id: string; display_name: string; type: string };
  report_categories: { id: string; name: string };
  report_evidences: { id: string; file_url: string; file_type?: string }[];
}

export interface Category {
  id: string;
  name: string;
}

const authHeader = (token: string) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
});

export const reportsApi = {
  getFeed: async (): Promise<Report[]> => {
    const res = await fetch(`${BASE_URL}/reports`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data.data;
  },

  getDetail: async (slug: string): Promise<ReportDetail> => {
    const res = await fetch(`${BASE_URL}/reports/${slug}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data.data;
  },

  getCategories: async (): Promise<Category[]> => {
    const res = await fetch(`${BASE_URL}/report-categories`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data.data ?? [];
  },

  getMyReports: async (token: string): Promise<Report[]> => {
    const res = await fetch(`${BASE_URL}/reports/my`, {
      headers: authHeader(token),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data.data;
  },

  create: async (token: string, formData: FormData): Promise<Report> => {
    const res = await fetch(`${BASE_URL}/reports`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data.data;
  },
};

export async function submitReportFromChat(
  reportData: ReportData,
  evidenceFiles: EvidenceFile[],
): Promise<void> {
  const token = await AsyncStorage.getItem("token");
  if (!token) throw new Error("Unauthorized");

  const formData = new FormData();
  formData.append("title", reportData.title);
  formData.append("entityName", reportData.entityName);
  formData.append("entityType", reportData.entityType);
  formData.append("categoryId", reportData.categoryId);
  formData.append("description", reportData.description);
  formData.append("incidentDate", reportData.incidentDate);
  formData.append("location", reportData.location);
  formData.append("estimatedAmount", String(reportData.estimatedAmount));

  if (Platform.OS === "web") {
    for (let i = 0; i < evidenceFiles.length; i++) {
      const file = evidenceFiles[i];
      const response = await fetch(file.uri);
      const blob = await response.blob();
      formData.append(
        "evidences",
        new File([blob], file.name, { type: file.type }),
      );
    }
  } else {
    evidenceFiles.forEach((file, i) => {
      formData.append("evidences", {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);
    });
  }

  const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/reports`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const result = await response.json();
  if (!response.ok)
    throw new Error(result.message || "Failed to submit report");
}
