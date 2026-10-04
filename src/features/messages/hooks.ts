import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Page } from "@/lib/types";

export type MessageLogItem = {
  id: string;
  patient: string;
  patient_name: string;
  appointment: string | null;
  direction: "outbound" | "inbound";
  channel: "whatsapp" | "sms" | "email";
  kind: string;
  to_address: string;
  body: string;
  status: "queued" | "sent" | "delivered" | "read" | "failed";
  error: string;
  sent_at: string | null;
  delivered_at: string | null;
  created_at: string;
};

export function useMessages(filters: { channel: string; status: string }, page: number) {
  return useQuery({
    queryKey: ["messages", filters, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page) });
      if (filters.channel) params.set("channel", filters.channel);
      if (filters.status) params.set("status", filters.status);
      return api<Page<MessageLogItem>>(`/messages/?${params}`);
    },
    placeholderData: keepPreviousData,
    refetchInterval: 10_000,
    refetchIntervalInBackground: true,
  });
}