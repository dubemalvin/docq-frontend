import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { User } from "./types";

export const ME_KEY = ["me"] as const;

/** The signed-in user, or null when signed out. */
export function useMe() {
  return useQuery({
    queryKey: ME_KEY,
    queryFn: async () => {
      try {
        return await api<User>("/auth/me/");
      } catch (error) {
        // DRF answers 403 (not 401) for anonymous requests when only session auth is enabled
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return null;
        throw error;
      }
    },
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      await api("/auth/csrf/"); // makes sure the csrftoken cookie exists
      return api<User>("/auth/login/", { method: "POST", body: credentials });
    },
    onSuccess: (user) => queryClient.setQueryData(ME_KEY, user),
  });
}

export function useRegister(){}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api("/auth/logout/", { method: "POST" }),
    onSuccess: () => {
      queryClient.clear(); // wipe cached patient data from this browser
      queryClient.setQueryData(ME_KEY, null);
    },
  });
}