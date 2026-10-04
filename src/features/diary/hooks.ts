import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Page } from "@/lib/types";

export type AppointmentStatus =
  | "booked" | "confirmed" | "arrived" | "in_consultation" | "completed" | "no_show" | "cancelled";

export type Appointment = {
  id: string;
  patient: string;
  patient_name: string;
  patient_phone: string;
  practitioner: string;
  practitioner_name: string;
  practitioner_color: string;
  appointment_type: string;
  type_name: string;
  type_color: string;
  start_at: string;
  end_at: string;
  status: AppointmentStatus;
  source: "staff" | "online";
  reason: string;
  internal_note: string;
  confirmed_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string;
};

export type Practitioner = {
  id: string;
  display_name: string;
  specialty: string;
  color: string;
  slot_minutes: number;
  bookable_online: boolean;
  is_active: boolean;
};

export type Range = { start: string; end: string };

export function usePractitioners() {
  return useQuery({
    queryKey: ["practitioners"],
    queryFn: () => api<Page<Practitioner>>("/practitioners/?active=1"),
    select: (data) => data.results,
    staleTime: 5 * 60_000,
  });
}

export function useAppointments(range: Range | null, practitionerId: string) {
  return useQuery({
    queryKey: ["appointments", range, practitionerId],
    queryFn: () => {
      const params = new URLSearchParams({ start: range!.start, end: range!.end });
      if (practitionerId) params.set("practitioner", practitionerId);
      return api<Appointment[]>(`/appointments/?${params}`);
    },
    enabled: range !== null,
    placeholderData: keepPreviousData,
    refetchInterval: 10_000, // online bookings show up on their own
    refetchIntervalInBackground: true,
  });
}

export type AppointmentType = {
  id: string;
  name: string;
  duration_minutes: number;
  price: string;
  color: string;
  bookable_online: boolean;
  is_active: boolean;
};

export function useAppointmentTypes() {
  return useQuery({
    queryKey: ["appointment-types"],
    queryFn: () => api<Page<AppointmentType>>("/appointment-types/"),
    select: (data) => data.results.filter((t) => t.is_active),
    staleTime: 5 * 60_000,
  });
}

export type AppointmentInput = {
  patient: string;
  practitioner: string;
  appointment_type: string;
  start_at: string; // ISO; the backend works out end_at from the appointment type
  reason: string;
};

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AppointmentInput) => api<Appointment>("/appointments/", { method: "POST", body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointments"] }),
  });
}

export function useSetStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; status: AppointmentStatus; cancel_reason?: string }) =>
      api<Appointment>(`/appointments/${input.id}/set-status/`, {
        method: "POST",
        body: { status: input.status, cancel_reason: input.cancel_reason ?? "" },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointments"] }),
  });
}

export type SentMessage = { channel: "whatsapp" | "sms" | "email"; status: string; error: string };

export function useSendReminder() {
  return useMutation({
    mutationFn: (id: string) => api<SentMessage>(`/appointments/${id}/send-reminder/`, { method: "POST" }),
  });
}

export function useRescheduleAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; start_at: string; end_at?: string }) => {
      const { id, ...body } = input;
      return api<Appointment>(`/appointments/${id}/`, { method: "PATCH", body });
    },
    // Refetch on success and on failure, so the calendar always shows the server's truth
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["appointments"] }),
  });
}