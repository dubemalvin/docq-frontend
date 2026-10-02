import {useState} from "react";
import {useNavigate} from "react-router";
import {formatDistanceToNow} from "date-fns";
import {Bell} from "lucide-react";
import {Button} from "@/components/ui/button";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {cn} from "@/lib/utils";
import {useMarkAllRead, useMarkRead, useNotificationList, useUnreadCount} from "./hooks";

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const unread = useUnreadCount().data ?? 0;
    const list = useNotificationList(open);
    const markRead = useMarkRead();
    const markAll = useMarkAllRead();

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger
                render={
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
                        className="relative text-slate-300 hover:bg-white/10 hover:text-white"
                    />
                }
            >
                <Bell className="h-5 w-5"/>
                {unread > 0 && (
                    <span
                        className="absolute -right-0.5 -top-0.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
                      {unread > 99 ? "99+" : unread}
                    </span>
                )}
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between pr-2">
                    <DropdownMenuGroup>
                        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                    </DropdownMenuGroup>
                    {unread > 0 && (
                        <button
                            className="text-xs text-blue-600 hover:underline"
                            onClick={() => markAll.mutate()}
                        >
                            Mark all read
                        </button>
                    )}
                </div>
                <DropdownMenuSeparator/>

                <div className="max-h-96 overflow-y-auto">
                    {list.isLoading && <p className="p-4 text-sm text-slate-500">Loading…</p>}
                    {list.data?.results.length === 0 &&
                        <p className="p-4 text-sm text-slate-500">You're all caught up.</p>}
                    {list.data?.results.map((n) => (
                        <DropdownMenuItem
                            key={n.id}
                            className="flex cursor-pointer flex-col items-start gap-0.5 py-2"
                            onClick={() => {
                                if (!n.is_read) markRead.mutate(n.id);
                                if (n.appointment) navigate("/diary");
                            }}
                        >
                            <div className="flex w-full items-start gap-2">
                                <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.is_read ? "bg-transparent" : "bg-blue-500")}/>
                                <div className="min-w-0">
                                    <p className={cn("text-sm", !n.is_read && "font-semibold")}>{n.title}</p>
                                    {n.body && <p className="text-xs text-slate-600">{n.body}</p>}
                                    <p className="mt-0.5 text-[11px] text-slate-400">
                                        {formatDistanceToNow(new Date(n.created_at), {addSuffix: true})}
                                    </p>
                                </div>
                            </div>
                        </DropdownMenuItem>
                    ))}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}