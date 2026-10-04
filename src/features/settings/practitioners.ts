import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Page } from "@/lib/types";

import type { PractitionerProfile } from "@/features/practitioners/profile";

export type PractitionerFull = PractitionerProfile & {
  user: string | null; // the linked login, if any
  first_name: string;
  last_name: string;
  registration_number: string;
  color: string;
  slot_minutes: number;
  bookable_online: boolean;
  is_active: boolean;
};

/** What the "Add / edit practitioner" panel sends (the profile has its own page). */
export type PractitionerInput = Pick<
  PractitionerFull,
  | "user" | "title" | "first_name" | "last_name" | "specialty" | "registration_number"
  | "color" | "slot_minutes" | "bookable_online" | "is_active"
>;

/** Everyone, including inactive (the diary hook only loads active ones). */
export function usePractitionerList() {
  return useQuery({
    queryKey: ["practitioners", "all"],
    queryFn: () => api<Page<PractitionerFull>>("/practitioners/"),
    select: (data) => data.results,
  });
}

export function useSavePractitioner(id?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PractitionerInput) =>
      id
        ? api<PractitionerFull>(`/practitioners/${id}/`, { method: "PATCH", body: input })
        : api<PractitionerFull>("/practitioners/", { method: "POST", body: input }),
    // the "practitioners" prefix also refreshes the diary and the filter dropdowns
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["practitioners"] }),
  });
}

export type WorkingBlock = { id: string; weekday: number; start_time: string; end_time: string }; // weekday 0 = Monday

export function useWorkingHours(practitionerId: string | null) {
  return useQuery({
    queryKey: ["practitioners", "hours", practitionerId],
    queryFn: () => api<WorkingBlock[]>(`/practitioners/${practitionerId}/working-hours/`),
    enabled: Boolean(practitionerId),
  });
}

export function useSaveWorkingHours(practitionerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    // The server replaces the whole weekly schedule in one go
    mutationFn: (blocks: { weekday: number; start_time: string; end_time: string }[]) =>
      api<WorkingBlock[]>(`/practitioners/${practitionerId}/working-hours/`, { method: "PUT", body: blocks }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["practitioners", "hours", practitionerId] });
      queryClient.invalidateQueries({ queryKey: ["public", "slots"] });
    },
  });
}