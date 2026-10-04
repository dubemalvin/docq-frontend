import {useState, type ReactNode} from "react";
import {Link} from "react-router";
import {differenceInMinutes, format, parseISO} from "date-fns";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle} from "@/components/ui/sheet";
import {useMe} from "@/features/auth/useAuth";
import {ApiError} from "@/lib/api";
import {cn} from "@/lib/utils";
import {useSendReminder, useSetStatus, type Appointment, type AppointmentStatus, type SentMessage} from "./hooks";

const STATUS_STYLE: Record<AppointmentStatus, string> = {
    booked: "bg-slate-100 text-slate-700",
    confirmed: "bg-blue-100 text-blue-800",
    arrived: "bg-amber-100 text-amber-800",
    in_consultation: "bg-violet-100 text-violet-800",
    completed: "bg-green-100 text-green-800",
    no_show: "bg-red-100 text-red-800",
    cancelled: "bg-slate-200 text-slate-600",
};
const STATUS_LABEL: Record<AppointmentStatus, string> = {
    booked: "Booked", confirmed: "Confirmed", arrived: "Arrived", in_consultation: "In consultation",
    completed: "Completed", no_show: "No-show", cancelled: "Cancelled",
};

// Mirrors the backend's allowed transitions (the server still enforces them)
const NEXT: Partial<Record<AppointmentStatus, { to: AppointmentStatus; label: string }[]>> = {
    booked: [{to: "confirmed", label: "Mark confirmed"}, {to: "arrived", label: "Arrived"}],
    confirmed: [{to: "arrived", label: "Arrived"}],
    arrived: [{to: "in_consultation", label: "Start consultation"}, {to: "completed", label: "Complete"}],
    in_consultation: [{to: "completed", label: "Complete"}],
};
const CAN_CANCEL: AppointmentStatus[] = ["booked", "confirmed"];

function Row({label, children}: { label: string; children?: ReactNode }) {
    return (
        <div className="flex justify-between gap-4 px-4 py-2.5 text-sm">
            <dt className="shrink-0 text-slate-500">{label}</dt>
            <dd className="min-w-0 break-words text-right font-medium text-slate-900">
                {children || <span className="font-normal text-slate-300">—</span>}
            </dd>
        </div>
    );
}

function Details({appointment}: { appointment: Appointment }) {
    const me = useMe();
    const setStatus = useSetStatus();
    const sendReminder = useSendReminder();
    const [cancelling, setCancelling] = useState(false);
    const [reason, setReason] = useState("");
    const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

    const status = appointment.status;
    const canRemind = (me.data?.role === "receptionist" || me.data?.role === "practice_manager") && CAN_CANCEL.includes(status);
    const start = parseISO(appointment.start_at);
    const end = parseISO(appointment.end_at);
    const minutes = differenceInMinutes(end, start);

    function change(to: AppointmentStatus, cancel_reason?: string) {
        setFeedback(null);
        setStatus.mutate(
            {id: appointment.id, status: to, cancel_reason},
            {onError: (error) => setFeedback({ok: false, text: error.message})},
        );
    }

    function remind() {
        setFeedback(null);
        sendReminder.mutate(appointment.id, {
            onSuccess: (message: SentMessage) => setFeedback({ok: true, text: `Reminder sent by ${message.channel}.`}),
            onError: (error) => {
                // A failed provider call comes back as 502 with the message record
                const data = error instanceof ApiError ? (error.data as { error?: string } | null) : null;
                setFeedback({ok: false, text: data?.error || error.message});
            },
        });
    }

    const hasActions = !!NEXT[status] || canRemind || CAN_CANCEL.includes(status);

    return (
        <>
            <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
                {/* When */}
                <div className="rounded-sm border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-lg font-semibold text-slate-900">{format(start, "EEEE d MMMM")}</p>
                            <p className="text-sm text-slate-500">
                                {format(start, "HH:mm")} – {format(end, "HH:mm")} · {minutes} min
                            </p>
                        </div>
                        <span className={cn("shrink-0 rounded-sm px-2.5 py-1 text-xs font-semibold", STATUS_STYLE[status])}>
                            {STATUS_LABEL[status]}
                        </span>
                    </div>
                </div>

                {/* Details */}
                <dl className="divide-y divide-slate-100 rounded-sm border border-slate-200 bg-white">
                    <Row label="Patient">
                        <Link to={`/patients/${appointment.patient}`} className="text-blue-600 hover:underline">
                            {appointment.patient_name}
                        </Link>
                    </Row>
                    <Row label="Phone">
                        {appointment.patient_phone && (
                            <a href={`tel:${appointment.patient_phone}`} className="text-blue-600 hover:underline">
                                {appointment.patient_phone}
                            </a>
                        )}
                    </Row>
                    <Row label="Practitioner">
                        <span className="inline-flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-sm"
                                  style={{backgroundColor: appointment.practitioner_color}}/>
                            {appointment.practitioner_name}
                        </span>
                    </Row>
                    <Row label="Type">{appointment.type_name}</Row>
                    <Row label="Reason">{appointment.reason}</Row>
                    <Row label="Booked">{appointment.source === "online" ? "Online by patient" : "By staff"}</Row>
                    {appointment.cancel_reason && <Row label="Cancel reason">{appointment.cancel_reason}</Row>}
                </dl>

                {feedback && (
                    <p
                        role="alert"
                        className={cn(
                            "rounded-sm border p-3 text-sm",
                            feedback.ok
                                ? "border-green-200 bg-green-50 text-green-800"
                                : "border-red-200 bg-red-50 text-red-700",
                        )}
                    >
                        {feedback.text}
                    </p>
                )}
            </div>

            {hasActions && (
                <SheetFooter className="gap-2 border-t border-border bg-white px-4 py-3">
                    {NEXT[status]?.map((action, index) => (
                        <Button
                            key={action.to}
                            variant={index === 0 ? "default" : "outline"}
                            className="w-full rounded-sm"
                            disabled={setStatus.isPending}
                            onClick={() => change(action.to)}
                        >
                            {action.label}
                        </Button>
                    ))}

                    {canRemind && (
                        <Button variant="outline" className="w-full rounded-sm" disabled={sendReminder.isPending}
                                onClick={remind}>
                            {sendReminder.isPending ? "Sending…" : "Send reminder now"}
                        </Button>
                    )}

                    {CAN_CANCEL.includes(status) && !cancelling && (
                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1 rounded-sm" disabled={setStatus.isPending}
                                    onClick={() => change("no_show")}>
                                No-show
                            </Button>
                            <Button variant="outline"
                                    className="flex-1 rounded-sm border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                    onClick={() => setCancelling(true)}>
                                Cancel appointment
                            </Button>
                        </div>
                    )}

                    {cancelling && (
                        <div className="space-y-2 rounded-sm border border-red-200 bg-red-50 p-3">
                            <Input
                                className="rounded-sm bg-white"
                                placeholder="Reason (optional)"
                                value={reason}
                                onChange={(event) => setReason(event.target.value)}
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1 rounded-sm bg-white"
                                        onClick={() => setCancelling(false)}>
                                    Keep it
                                </Button>
                                <Button variant="destructive" className="flex-1 rounded-sm"
                                        disabled={setStatus.isPending}
                                        onClick={() => change("cancelled", reason)}>
                                    Confirm cancel
                                </Button>
                            </div>
                        </div>
                    )}
                </SheetFooter>
            )}
        </>
    );
}

type Props = { appointment: Appointment | null; onOpenChange: (open: boolean) => void };

export default function AppointmentDetailSheet({appointment, onOpenChange}: Props) {
    return (
        <Sheet open={appointment !== null} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
                <SheetHeader className="border-b border-border bg-white">
                    <SheetTitle>{appointment?.patient_name ?? "Appointment"}</SheetTitle>
                    <SheetDescription>Appointment details</SheetDescription>
                </SheetHeader>
                {appointment && <Details key={appointment.id} appointment={appointment}/>}
            </SheetContent>
        </Sheet>
    );
}