import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {api} from "@/lib/api";
import type {Page} from "@/lib/types";

export type AppNotification = {
    id: string;
    kind: string;
    title: string;
    body: string;
    appointment: string | null;
    is_read: boolean;
    read_at: string | null;
    created_at: string;
};

const COUNT_KEY = ["notifications", "unread"] as const;
const LIST_KEY = ["notifications", "list"] as const;

/** Polls every 5 seconds. TanStack Query pauses polling while the tab is hidden. */
export function useUnreadCount() {
    return useQuery({
        queryKey: COUNT_KEY,
        queryFn: () => api<{ unread: number }>("/notifications/unread-count/"),
        select: (data) => data.unread,
        refetchInterval: 5000,
        refetchIntervalInBackground: true,
    });
}

/** Only loads the list while the dropdown is open. */
export function useNotificationList(enabled: boolean) {
    return useQuery({
        queryKey: LIST_KEY,
        queryFn: () => api<Page<AppNotification>>("/notifications/"),
        enabled,
    });
}

function useInvalidateNotifications() {
    const queryClient = useQueryClient();
    return () => {
        queryClient.invalidateQueries({queryKey: COUNT_KEY});
        queryClient.invalidateQueries({queryKey: LIST_KEY});
    };
}

export function useMarkRead() {
    const invalidate = useInvalidateNotifications();
    return useMutation({
        mutationFn: (id: string) => api(`/notifications/${id}/mark-read/`, {method: "POST"}),
        onSuccess: invalidate,
    });
}

export function useMarkAllRead() {
    const invalidate = useInvalidateNotifications();
    return useMutation({
        mutationFn: () => api("/notifications/mark-all-read/", {method: "POST"}),
        onSuccess: invalidate,
    });
}