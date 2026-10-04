import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ME_KEY } from "@/features/auth/useAuth";

export type PracticeSettings = {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  country: string;
  timezone: string;
  currency: string;
  billing_name: string;
  practice_number: string;
  vat_number: string;
  invoice_footer: string;
  online_booking_enabled: boolean;
  booking_max_days_ahead: number;
  booking_min_notice_hours: number;
  first_reminder_hours: number;
  second_reminder_hours: number;
  sms_enabled: boolean;
  email_enabled: boolean;
  whatsapp_enabled: boolean;
  booking_url: string;
};

export type PracticeInput = Omit<PracticeSettings, "id" | "slug" | "country" | "timezone" | "currency" | "booking_url">;

export function usePractice() {
  return useQuery({ queryKey: ["practice"], queryFn: () => api<PracticeSettings>("/practice/") });
}

export function useUpdatePractice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PracticeInput) => api<PracticeSettings>("/practice/", { method: "PATCH", body: input }),
    onSuccess: (data) => {
      queryClient.setQueryData(["practice"], data);
      queryClient.invalidateQueries({ queryKey: ME_KEY }); // the navbar shows the practice name
    },
  });
}