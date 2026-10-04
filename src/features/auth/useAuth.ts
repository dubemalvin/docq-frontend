import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {useNavigate} from "react-router";
import {api, ApiError} from "@/lib/api";
import type {User} from "./types";

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
            return api<User>("/auth/login/", {method: "POST", body: credentials});
        },
        onSuccess: (user) => queryClient.setQueryData(ME_KEY, user),
    });
}

/**
 * Fields sent to the sign-up endpoint. Adjust to match your serializer.
 * practice_name is only needed if signing up creates a new practice.
 */
export type RegisterInput = {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    practice_name?: string;
};

export function useRegister() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: RegisterInput) => {
            await api("/auth/csrf/"); // makes sure the csrftoken cookie exists
            return api<User>("/auth/register/", {method: "POST", body: input});
        },
        // The server signs the new user in, so they land in the app without a separate login
        onSuccess: (user) => queryClient.setQueryData(ME_KEY, user),
    });
}

export function useLogout() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    return useMutation({
        mutationFn: () => api("/auth/logout/", {method: "POST"}),
        // onSettled, not onSuccess: if the session had already expired the request can fail,
        // and the person should still end up signed out on the login page.
        onSettled: () => {
            queryClient.clear(); // wipe cached patient data from this browser
            queryClient.setQueryData(ME_KEY, null);
            navigate("/login", {replace: true});
        },
    });
}