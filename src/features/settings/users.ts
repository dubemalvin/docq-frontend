import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Page } from "@/lib/types";
import type { Role } from "@/features/auth/types";

export const ROLE_LABEL: Record<Role, string> = {
  receptionist: "Receptionist",
  nurse: "Nurse",
  doctor: "Doctor",
  practice_manager: "Practice manager",
};

export type StaffUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: Role;
  is_active: boolean;
  date_joined: string;
  last_login: string | null;
};

export function useStaff() {
  return useQuery({
    queryKey: ["staff"],
    queryFn: () => api<Page<StaffUser>>("/users/"),
    select: (data) => data.results,
  });
}

export type StaffInput = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: Role;
  is_active: boolean;
};

export function useSaveStaff(id?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: StaffInput) =>
      id
        ? api<StaffUser>(`/users/${id}/`, { method: "PATCH", body: input })
        : api<StaffUser>("/users/", { method: "POST", body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["staff"] }),
  });
}

export function useResendInvite() {
  return useMutation({
    mutationFn: (id: string) => api<{ sent: boolean }>(`/users/${id}/resend-invite/`, { method: "POST" }),
  });
}