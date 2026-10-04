import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type FileCategory = "consent" | "medical_aid" | "referral" | "lab" | "imaging" | "other";

export const CATEGORY_LABEL: Record<FileCategory, string> = {
  consent: "Consent form",
  medical_aid: "Medical aid",
  referral: "Referral letter",
  lab: "Lab result",
  imaging: "Imaging",
  other: "Other",
};

// The server only shows/accepts these for doctors and nurses; we mirror that to keep the UI honest
export const CLINICAL_CATEGORIES: FileCategory[] = ["referral", "lab", "imaging"];

export type PatientFile = {
  id: string;
  original_name: string;
  content_type: string;
  size: number;
  category: FileCategory;
  description: string;
  uploaded_by: string | null;
  uploaded_by_name: string;
  created_at: string;
};

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Files are never public URLs: these go through Django, which checks your session and role. */
export const fileUrl = (patientId: string, fileId: string, inline: boolean) =>
  `/api/patients/${patientId}/files/${fileId}/download/${inline ? "?inline=1" : ""}`;

const filesKey = (patientId: string) => ["patients", "files", patientId] as const;

export function usePatientFiles(patientId: string) {
  return useQuery({
    queryKey: filesKey(patientId),
    queryFn: () => api<PatientFile[]>(`/patients/${patientId}/files/`),
  });
}

export function useUploadFile(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { file: File; category: FileCategory; description: string }) => {
      const form = new FormData();
      form.append("file", input.file);
      form.append("category", input.category);
      form.append("description", input.description);
      return api<PatientFile>(`/patients/${patientId}/files/`, { method: "POST", body: form });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: filesKey(patientId) }),
  });
}

export function useDeleteFile(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fileId: string) => api(`/patients/${patientId}/files/${fileId}/`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: filesKey(patientId) }),
  });
}