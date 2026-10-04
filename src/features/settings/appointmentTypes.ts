import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Page } from "@/lib/types";
import type { AppointmentType } from "@/features/diary/hooks";

export type AppointmentTypeInput = Omit<AppointmentType, "id">; // price is a string like "550.00"

/** Everything, including inactive (the diary hook only loads active ones). */
export function useAppointmentTypeList() {
  return useQuery({
    queryKey: ["appointment-types", "all"],
    queryFn: () => api<Page<AppointmentType>>("/appointment-types/"),
    select: (data) => data.results,
  });
}

export function useSaveAppointmentType(id?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AppointmentTypeInput) =>
      id
        ? api<AppointmentType>(`/appointment-types/${id}/`, { method: "PATCH", body: input })
        : api<AppointmentType>("/appointment-types/", { method: "POST", body: input }),
    onSuccess: () => {
      // refreshes the diary's booking dropdown and the public booking page too
      queryClient.invalidateQueries({ queryKey: ["appointment-types"] });
      queryClient.invalidateQueries({ queryKey: ["public"] });
    },
  });
}