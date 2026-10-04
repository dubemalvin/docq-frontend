import {useMemo, useState, type ReactNode} from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, {type DateClickArg} from "@fullcalendar/interaction";
import type {DatesSetArg, EventClickArg, EventContentArg, EventDropArg, EventInput} from "@fullcalendar/core";
import {format, parseISO} from "date-fns";
import {CalendarDays, Clock, Plus} from "lucide-react";
import {useMe} from "@/features/auth/useAuth";
import { useAppointments, useAppointmentTypes, usePractitioners, useRescheduleAppointment,type Appointment, type Range,} from "@/features/diary/hooks";
import AppointmentFormSheet from "@/features/diary/AppointmentFormSheet";
import AppointmentDetailSheet from "@/features/diary/AppointmentDetailSheet";
import {PageHeader} from "@/components/PageHeader";
import {cn} from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
    booked: "Booked", confirmed: "Confirmed", arrived: "Arrived",
    in_consultation: "In consultation", completed: "Completed", no_show: "No-show", cancelled: "Cancelled",
};

// One colour map, used by the calendar, the hover card and the "In view" panel
const STATUS_COLOR: Record<string, string> = {
    booked: "#94a3b8",
    confirmed: "#3b82f6",
    arrived: "#f59e0b",
    in_consultation: "#8b5cf6",
    completed: "#22c55e",
    no_show: "#ef4444",
    cancelled: "#cbd5e1",
};

const TOOLTIP_W = 240;

type Hover = { appointment: Appointment; rect: DOMRect };

function minutesOf(a: Appointment) {
    return (parseISO(a.end_at).getTime() - parseISO(a.start_at).getTime()) / 60000;
}

function toEvent(a: Appointment): EventInput {
    const faded = a.status === "completed" || a.status === "no_show";
    return {
        id: a.id,
        title: a.patient_name,
        start: a.start_at,
        end: a.end_at,
        editable: a.status === "booked" || a.status === "confirmed",
        backgroundColor: a.practitioner_color,
        borderColor: a.practitioner_color,
        classNames: faded ? ["opacity-60"] : [],
        extendedProps: {appointment: a},
    };
}

function renderEvent(arg: EventContentArg) {
    const a = arg.event.extendedProps.appointment as Appointment;
    const dot = (
        <span className="h-2 w-2 shrink-0 rounded-sm ring-1 ring-white"
              style={{backgroundColor: STATUS_COLOR[a.status]}}/>
    );

    // 30 minutes or less: one line only. Everything else lives in the hover card.
    if (minutesOf(a) <= 30) {
        return (
            <div className="flex h-full items-center gap-1 overflow-hidden px-1.5 text-xs font-semibold leading-none">
                {dot}
                <span className="truncate">{arg.event.title}</span>
            </div>
        );
    }

    return (
        <div className="overflow-hidden px-1.5 py-0.5 text-xs leading-tight">
            <div className="flex items-center gap-1">
                {dot}
                <p className="truncate font-semibold">{arg.event.title}</p>
            </div>
            <p className="truncate opacity-90">{a.type_name}</p>
        </div>
    );
}

function HoverCard({hover}: { hover: Hover }) {
    const {appointment: a, rect} = hover;
    const fitsRight = rect.right + 8 + TOOLTIP_W < window.innerWidth;
    const left = fitsRight ? rect.right + 8 : Math.max(8, rect.left - TOOLTIP_W - 8);
    const top = Math.min(Math.max(8, rect.top), window.innerHeight - 150);

    return (
        <div
            role="tooltip"
            className="pointer-events-none fixed z-50 rounded-sm border border-slate-200 bg-white p-3 shadow-lg"
            style={{left, top, width: TOOLTIP_W}}
        >
            <div className="flex items-start gap-2">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-sm"
                      style={{backgroundColor: a.practitioner_color}}/>
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{a.patient_name}</p>
                    <p className="truncate text-xs text-slate-500">{a.type_name}</p>
                </div>
            </div>

            <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-600">
                <Clock className="h-3.5 w-3.5 text-slate-400"/>
                {format(parseISO(a.start_at), "EEE d MMM")} · {format(parseISO(a.start_at), "HH:mm")}–
                {format(parseISO(a.end_at), "HH:mm")}
                <span className="text-slate-400">({minutesOf(a)} min)</span>
            </div>

            <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-sm bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                <span className="h-1.5 w-1.5 rounded-sm" style={{backgroundColor: STATUS_COLOR[a.status]}}/>
                {STATUS_LABEL[a.status]}
            </span>
        </div>
    );
}

function SidePanel({title, children}: { title: string; children: ReactNode }) {
    return (
        <section className="rounded-sm border border-slate-200 bg-white shadow-sm">
            <h2 className="border-b border-slate-100 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {title}
            </h2>
            <div className="p-2">{children}</div>
        </section>
    );
}

export default function DiaryPage() {
    const me = useMe();
    const isDoctor = me.data?.role === "doctor"; // the backend already limits doctors to their own diary

    const [range, setRange] = useState<Range | null>(null);
    const [practitionerId, setPractitionerId] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [slotStart, setSlotStart] = useState<Date | null>(null);
    const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
    const [hover, setHover] = useState<Hover | null>(null);

    const practitioners = usePractitioners();
    const appointments = useAppointments(range, practitionerId);
    const reschedule = useRescheduleAppointment();
    useAppointmentTypes(); // warms the cache so the booking panel opens ready

    const events = useMemo(() => (appointments.data ?? []).map(toEvent), [appointments.data]);
    const selected = appointments.data?.find((a) => a.id === selectedId) ?? null; // live, so it updates after status changes

    const statusCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const a of appointments.data ?? []) counts[a.status] = (counts[a.status] ?? 0) + 1;
        return counts;
    }, [appointments.data]);

    const total = appointments.data?.length ?? 0;

    function showNotice(text: string, ok: boolean) {
        setNotice({ok, text});
        setTimeout(() => setNotice(null), 6000);
    }

    function openBooking(start: Date | null) {
        setSlotStart(start);
        setFormOpen(true);
    }

    function handleDrop(arg: EventDropArg) {
        const before = arg.event.extendedProps.appointment as Appointment;
        const start = arg.event.start;
        if (!start) return arg.revert();
        reschedule.mutate(
            {id: arg.event.id, start_at: start.toISOString(), end_at: arg.event.end?.toISOString()},
            {
                onSuccess: () =>
                    showNotice(
                        before.status === "confirmed"
                            ? "Moved. The patient will need to confirm the new time."
                            : "Appointment moved.",
                        true,
                    ),
                onError: (error) => {
                    arg.revert();
                    showNotice(error.message, false);
                },
            },
        );
    }

    function handleDatesSet(arg: DatesSetArg) {
        setRange((prev) =>
            prev && prev.start === arg.startStr && prev.end === arg.endStr
                ? prev
                : {start: arg.startStr, end: arg.endStr},
        );
    }

    return (
        <div className="flex flex-col gap-3 lg:h-full">
            <div className="shrink-0">
                <PageHeader
                    icon={CalendarDays}
                    title="Diary"
                    subtitle={appointments.data ? `${total} appointment${total === 1 ? "" : "s"} in view` : undefined}
                    actions={[{label: "New appointment", icon: Plus, onClick: () => openBooking(null)}]}
                >
                    {!isDoctor && (
                        <select
                            aria-label="Filter by practitioner"
                            className="h-9 w-full rounded-sm border border-input bg-white px-3 text-sm sm:w-auto"
                            value={practitionerId}
                            onChange={(event) => setPractitionerId(event.target.value)}
                        >
                            <option value="">All practitioners</option>
                            {practitioners.data?.map((p) => (
                                <option key={p.id} value={p.id}>{p.display_name}</option>
                            ))}
                        </select>
                    )}
                </PageHeader>
            </div>

            {appointments.isError && (
                <p className="shrink-0 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    Couldn't load appointments.
                </p>
            )}

            {notice && (
                <p
                    role="status"
                    className={cn(
                        "shrink-0 rounded-sm border px-4 py-3 text-sm",
                        notice.ok
                            ? "border-green-200 bg-green-50 text-green-800"
                            : "border-red-200 bg-red-50 text-red-700",
                    )}
                >
                    {notice.text}
                </p>
            )}

            <div className="flex flex-col gap-3 lg:min-h-0 lg:flex-1 lg:flex-row">
                {/* Calendar: takes all remaining space */}
                <div className="h-[75vh] min-w-0 rounded-sm border border-slate-200 bg-white p-2 shadow-sm md:p-3 lg:h-auto lg:min-h-0 lg:flex-1">
                    <FullCalendar
                        plugins={[timeGridPlugin, interactionPlugin]}
                        dateClick={(arg: DateClickArg) => openBooking(arg.date)}
                        eventClick={(arg: EventClickArg) => {
                            setHover(null);
                            setSelectedId(arg.event.id);
                        }}
                        eventMouseEnter={(arg) =>
                            setHover({
                                appointment: arg.event.extendedProps.appointment as Appointment,
                                rect: arg.el.getBoundingClientRect(),
                            })
                        }
                        eventMouseLeave={() => setHover(null)}
                        eventDragStart={() => setHover(null)}
                        initialView={window.innerWidth < 768 ? "timeGridDay" : "timeGridWeek"}
                        headerToolbar={{left: "prev,next today", center: "title", right: "timeGridDay,timeGridWeek"}}
                        buttonText={{today: "Today", day: "Day", week: "Week"}}
                        dayHeaderFormat={{weekday: "short", day: "numeric"}}
                        slotLabelFormat={{hour: "numeric", minute: "2-digit", hour12: false}}
                        allDaySlot={false}
                        nowIndicator
                        editable
                        eventDurationEditable={false}
                        eventDrop={handleDrop}
                        eventMinHeight={22}
                        slotMinTime="07:00:00"
                        slotMaxTime="19:00:00"
                        slotDuration="00:15:00"
                        slotLabelInterval="01:00"
                        scrollTime="08:00:00"
                        slotEventOverlap={false} // simultaneous appointments sit side by side
                        height="100%"
                        events={events}
                        eventContent={renderEvent}
                        datesSet={handleDatesSet}
                    />
                </div>

                {/* Side column: room for more panels. Desktop only, scrolls on its own. */}
                <aside className="hidden w-64 shrink-0 space-y-3 overflow-y-auto xl:block">
                    {!isDoctor && (
                        <SidePanel title="Practitioners">
                            <ul>
                                {practitioners.data?.map((p) => {
                                    const active = practitionerId === p.id;
                                    return (
                                        <li key={p.id}>
                                            <button
                                                type="button"
                                                onClick={() => setPractitionerId(active ? "" : p.id)}
                                                className={cn(
                                                    "flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-left text-sm transition-colors",
                                                    active ? "bg-slate-100 font-medium text-slate-900" : "text-slate-600 hover:bg-slate-50",
                                                )}
                                            >
                                                <span className="h-2.5 w-2.5 shrink-0 rounded-sm"
                                                      style={{backgroundColor: p.color}}/>
                                                <span className="truncate">{p.display_name}</span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </SidePanel>
                    )}

                    <SidePanel title="In view">
                        {total === 0 ? (
                            <p className="px-2 py-1.5 text-sm text-slate-400">No appointments.</p>
                        ) : (
                            <ul>
                                {Object.entries(STATUS_LABEL)
                                    .filter(([key]) => statusCounts[key])
                                    .map(([key, label]) => (
                                        <li key={key} className="flex items-center gap-2.5 px-2 py-1.5 text-sm">
                                            <span className="h-2 w-2 shrink-0 rounded-sm"
                                                  style={{backgroundColor: STATUS_COLOR[key]}}/>
                                            <span className="flex-1 text-slate-600">{label}</span>
                                            <span className="font-medium text-slate-900">{statusCounts[key]}</span>
                                        </li>
                                    ))}
                            </ul>
                        )}
                    </SidePanel>

                    {/* More panels go here: mini month calendar, waiting list, today's notes... */}
                </aside>
            </div>

            {hover && <HoverCard hover={hover}/>}

            <AppointmentFormSheet open={formOpen} onOpenChange={setFormOpen} initialStart={slotStart} defaultPractitionerId={practitionerId} />
            <AppointmentDetailSheet appointment={selected} onOpenChange={(open) => !open && setSelectedId(null)}/>
        </div>
    );
}