import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Page } from "@/lib/types";

export type Note = {
  id: string;
  patient: string;
  appointment: string | null;
  author: string | null;
  author_name: string;
  latest_content: string;
  latest_version: number;
  created_at: string;
  updated_at: string;
};

export type NoteVersion = {
  id: string;
  version: number;
  content: string;
  edited_by: string | null;
  edited_by_name: string;
  created_at: string;
};

export function useNotes(patientId: string) {
  return useQuery({
    queryKey: ["notes", patientId],
    queryFn: () => api<Page<Note>>(`/notes/?patient=${patientId}`),
    select: (data) => data.results,
  });
}

export function useNoteVersions(noteId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["notes", "versions", noteId],
    queryFn: () => api<NoteVersion[]>(`/notes/${noteId}/versions/`),
    enabled,
  });
}

export function useCreateNote(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      api<Note>("/notes/", { method: "POST", body: { patient: patientId, content } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notes", patientId] }),
  });
}

export function useUpdateNote(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; content: string }) =>
      api<Note>(`/notes/${input.id}/`, { method: "PATCH", body: { content: input.content } }),
    onSuccess: (_note, input) => {
      queryClient.invalidateQueries({ queryKey: ["notes", patientId] });
      queryClient.invalidateQueries({ queryKey: ["notes", "versions", input.id] });
    },
  });
}