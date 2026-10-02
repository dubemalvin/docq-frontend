import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Don't retry 4xx errors (wrong password, 401, 403, 404): retrying can't fix them.
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status < 500) && failureCount < 2,
    },
  },
});