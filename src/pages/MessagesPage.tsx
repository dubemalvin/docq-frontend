import {useState} from "react";
import {format, formatDistanceToNow} from "date-fns";
import {Link} from "react-router";
import {ArrowDownLeft, Mail, MessageCircle, MessageSquare, Smartphone, X, type LucideIcon} from "lucide-react";
import {useMessages, type MessageLogItem} from "@/features/messages/hooks";
import {Button} from "@/components/ui/button";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {PageHeader} from "@/components/PageHeader";
import {cn} from "@/lib/utils";

const PAGE_SIZE = 50;

const CHANNEL: Record<MessageLogItem["channel"], { label: string; icon: LucideIcon; tone: string }> = {
    whatsapp: {label: "WhatsApp", icon: MessageCircle, tone: "bg-green-50 text-green-600"},
    sms: {label: "SMS", icon: Smartphone, tone: "bg-violet-50 text-violet-600"},
    email: {label: "Email", icon: Mail, tone: "bg-blue-50 text-blue-600"},
};

const KIND: Record<string, string> = {
    reminder_first: "First reminder",
    reminder_second: "Second reminder",
    booking_confirmation: "Booking confirmation",
    cancellation: "Cancellation",
    reply: "Patient reply",
    custom: "Reminder (manual)",
};

const STATUS: Record<MessageLogItem["status"], { badge: string; dot: string }> = {
    queued: {badge: "bg-slate-100 text-slate-700", dot: "bg-slate-400"},
    sent: {badge: "bg-blue-50 text-blue-700", dot: "bg-blue-500"},
    delivered: {badge: "bg-green-50 text-green-700", dot: "bg-green-500"},
    read: {badge: "bg-green-100 text-green-800", dot: "bg-green-600"},
    failed: {badge: "bg-red-50 text-red-700", dot: "bg-red-500"},
};

const selectClass =
    "h-9 rounded-sm border border-input bg-white px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

const th = "text-xs font-semibold uppercase tracking-wide text-slate-500";

export default function MessagesPage() {
    const [channel, setChannel] = useState("");
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(1);
    const {data, isLoading, isError, isFetching} = useMessages({channel, status}, page);

    const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1;
    const filtered = !!(channel || status);
    const subtitle = data ? `${data.count} message${data.count === 1 ? "" : "s"}` : undefined;

    function clearFilters() {
        setChannel("");
        setStatus("");
        setPage(1);
    }

    return (
        <div className="flex flex-col gap-3 lg:h-full">
            <div className="shrink-0">
                <PageHeader icon={MessageSquare} title="Messages" subtitle={subtitle}>
                    <select
                        aria-label="Channel"
                        className={cn(selectClass, "flex-1 sm:flex-none")}
                        value={channel}
                        onChange={(e) => {
                            setChannel(e.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="">All channels</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="sms">SMS</option>
                        <option value="email">Email</option>
                    </select>
                    <select
                        aria-label="Status"
                        className={cn(selectClass, "flex-1 sm:flex-none")}
                        value={status}
                        onChange={(e) => {
                            setStatus(e.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="">All statuses</option>
                        <option value="sent">Sent</option>
                        <option value="delivered">Delivered</option>
                        <option value="read">Read</option>
                        <option value="failed">Failed</option>
                    </select>
                    {filtered && (
                        <Button variant="outline" size="sm" className="rounded-sm" onClick={clearFilters}>
                            <X className="mr-1 h-3.5 w-3.5"/> Clear
                        </Button>
                    )}
                </PageHeader>
            </div>

            {isError && (
                <p className="shrink-0 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    Couldn't load messages.
                </p>
            )}

            <div className="flex min-h-0 flex-col overflow-hidden rounded-sm border border-slate-200 bg-white shadow-sm lg:flex-1">
                <div className="min-h-0 flex-1 overflow-auto">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow className="hover:bg-slate-50">
                                <TableHead className={th}>When</TableHead>
                                <TableHead className={th}>Patient</TableHead>
                                <TableHead className={th}>Channel</TableHead>
                                <TableHead className={cn(th, "hidden lg:table-cell")}>Type</TableHead>
                                <TableHead className={th}>Status</TableHead>
                                <TableHead className={th}>Message</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading &&
                                Array.from({length: 6}).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={6}>
                                            <div className="h-8 animate-pulse rounded-sm bg-slate-100"/>
                                        </TableCell>
                                    </TableRow>
                                ))}

                            {data?.results.length === 0 && (
                                <TableRow className="hover:bg-transparent">
                                    <TableCell colSpan={6}>
                                        <div className="flex flex-col items-center gap-2 py-12 text-center">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-slate-100 text-slate-400">
                                                <MessageSquare className="h-6 w-6"/>
                                            </div>
                                            <p className="font-medium text-slate-900">
                                                {filtered ? "No messages match these filters" : "No messages yet"}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                {filtered
                                                    ? "Try a different channel or status."
                                                    : "Reminders and replies will show up here."}
                                            </p>
                                            {filtered && (
                                                <Button size="sm" variant="outline" className="mt-2 rounded-sm"
                                                        onClick={clearFilters}>
                                                    Clear filters
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}

                            {data?.results.map((m) => {
                                const {label, icon: Icon, tone} = CHANNEL[m.channel];
                                const date = new Date(m.created_at);
                                const failed = m.status === "failed";
                                return (
                                    <TableRow key={m.id} className={cn("align-top", failed && "bg-red-50/40")}>
                                        <TableCell className="whitespace-nowrap">
                                            <p className="text-sm text-slate-900">
                                                {formatDistanceToNow(date, {addSuffix: true})}
                                            </p>
                                            <p className="text-xs text-slate-400">{format(date, "d MMM, HH:mm")}</p>
                                        </TableCell>

                                        <TableCell>
                                            <Link to={`/patients/${m.patient}`}
                                                  className="font-medium text-blue-600 hover:underline">
                                                {m.patient_name}
                                            </Link>
                                            <p className="text-xs text-slate-500">{m.to_address}</p>
                                        </TableCell>

                                        <TableCell>
                                            <span className="inline-flex items-center gap-2 text-sm text-slate-700">
                                                <span className={cn("flex h-7 w-7 items-center justify-center rounded-sm", tone)}>
                                                    <Icon className="h-3.5 w-3.5"/>
                                                </span>
                                                <span className="hidden sm:inline">{label}</span>
                                            </span>
                                        </TableCell>

                                        <TableCell className="hidden text-sm text-slate-700 lg:table-cell">
                                            <span className="inline-flex items-center gap-1.5">
                                                {m.direction === "inbound" && (
                                                    <ArrowDownLeft className="h-3.5 w-3.5 text-slate-400"/>
                                                )}
                                                {KIND[m.kind] ?? m.kind}
                                            </span>
                                        </TableCell>

                                        <TableCell>
                                            <span className={cn(
                                                "inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-xs font-medium capitalize",
                                                STATUS[m.status].badge,
                                            )}>
                                                <span className={cn("h-1.5 w-1.5 rounded-sm", STATUS[m.status].dot)}/>
                                                {m.status}
                                            </span>
                                        </TableCell>

                                        <TableCell className="min-w-56 max-w-sm">
                                            <p className="line-clamp-2 text-sm text-slate-700" title={m.body}>{m.body}</p>
                                            {m.error && (
                                                <p className="mt-1 line-clamp-2 rounded-sm bg-red-50 px-1.5 py-0.5 text-xs text-red-700"
                                                   title={m.error}>
                                                    {m.error}
                                                </p>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination footer, pinned */}
                <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/60 px-4 py-2.5 text-sm text-slate-600">
                    <span>
                        Page {page} of {totalPages}
                        {isFetching && !isLoading ? " · updating…" : ""}
                    </span>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="rounded-sm" disabled={page <= 1}
                                onClick={() => setPage((p) => p - 1)}>
                            Previous
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-sm" disabled={page >= totalPages}
                                onClick={() => setPage((p) => p + 1)}>
                            Next
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}