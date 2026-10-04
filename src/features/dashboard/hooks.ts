import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type DashboardData = {
  days: number;
  totals: { total: number; completed: number; no_show: number; cancelled: number };
  no_show_rate: number;
  estimated_revenue: string;
  currency: string;
  upcoming: { booked: number; confirmed: number };
  per_practitioner: { practitioner_id: string; name: string; total: number; completed: number; no_show: number }[];
  per_day: { date: string; total: number; no_show: number }[];
};

export function useDashboard(days: number) {
  return useQuery({
    queryKey: ["dashboard", days],
    queryFn: () => api<DashboardData>(`/dashboard/?days=${days}`),
    placeholderData: keepPreviousData,
  });
}