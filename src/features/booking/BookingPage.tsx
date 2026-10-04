import {useEffect, useState, type ReactNode} from "react";
import {Link, useParams} from "react-router";
import {useQueryClient} from "@tanstack/react-query";
import {addDays, format, isBefore, isToday, parseISO, startOfDay} from "date-fns";
import {
    Banknote, CalendarCheck, CalendarDays, CalendarPlus, Check, CheckCircle2, ChevronLeft, ChevronRight,
    Clock, FileText, Languages, ShieldPlus, Timer,
} from "lucide-react";
import {ApiError} from "@/lib/api";
import {usePublicPractice, useSlots, type BookingResult, type PublicPractitioner} from "@/features/booking/hooks";
import BookingDetailsForm from "@/features/booking/BookingDetailsForm";
import DoctorPicker from "@/features/booking/DoctorPicker";
import PaymentStep, {CASH, paymentLabel, paymentPayload, type PaymentChoice} from "@/features/booking/PaymentStep";
import {
    Availability, DoctorAvatar, headline, Interests, languageLine, metaLine,
} from "@/features/booking/DoctorCard";
import {PageHeader} from "@/components/PageHeader";
import {Button, buttonVariants} from "@/components/ui/button";
import {cn} from "@/lib/utils";

type Stage = "choose" | "time" | "payment" | "details" | "done";

const STEPS = ["Doctor", "Time", "Payment", "Your details"];
const STAGE_INDEX: Record<Stage, number> = {choose: 0, time: 1, payment: 2, details: 3, done: 4};
const ymd = (d: Date) => format(d, "yyyy-MM-dd");
const longDate = (iso: string) => format(parseISO(iso.slice(0, 10)), "EEEE d MMMM");

function Stepper({stage}: { stage: Stage }) {
    const current = STAGE_INDEX[stage];
    return (
        <ol className="flex items-center gap-2 text-sm" aria-label="Booking progress">
            {STEPS.map((label, i) => (
                <li key={label} className="flex items-center gap-2">
                    <span className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                        i < current && "bg-emerald-500 text-white",
                        i === current && "bg-slate-900 text-white",
                        i > current && "bg-slate-200 text-slate-500",
                    )}>
                        {i < current ? <Check className="h-3.5 w-3.5"/> : i + 1}
                    </span>
                    <span className={cn("hidden md:inline", i === current ? "font-medium text-slate-900" : "text-slate-500")}>
                        {label}
                    </span>
                    {i < STEPS.length - 1 && <span className="h-px w-4 bg-slate-300 md:w-6"/>}
                </li>
            ))}
        </ol>
    );
}

function Shell({name, stage, onBack, children}: {
    name: string;
    stage: Stage;
    onBack?: () => void;
    children: ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
            <div className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6 lg:px-8">
                <PageHeader icon={CalendarDays} title={name} subtitle="Book an appointment online" backHref={onBack}>
                    {stage !== "done" && <Stepper stage={stage}/>}
                </PageHeader>
            </div>
            <main className="flex-1 space-y-4 px-4 py-5 pb-12 sm:px-6 lg:px-8">{children}</main>
        </div>
    );
}

function Panel({title, children, className, bodyClass}: {
    title?: string;
    children: ReactNode;
    className?: string;
    bodyClass?: string;
}) {
    return (
        <section className={cn("rounded-lg border border-slate-200 bg-white shadow-sm", className)}>
            {title && <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">{title}</h2>}
            <div className={cn("p-4", bodyClass)}>{children}</div>
        </section>
    );
}

function Banner({tone, children}: { tone: "amber"; children: ReactNode }) {
    return (
        <p role="alert" className={cn("rounded-md border p-3 text-sm", tone === "amber" && "border-amber-200 bg-amber-50 text-amber-800")}>
            {children}
        </p>
    );
}

function TypeChips({types, value, onChange}: {
    types: { id: string; name: string; duration_minutes: number }[];
    value: string;
    onChange: (id: string) => void;
}) {
    if (types.length < 2) return null;
    return (
        <div role="radiogroup" aria-label="Type of visit" className="flex flex-wrap gap-2">
            {types.map((t) => {
                const selected = t.id === value;
                return (
                    <button key={t.id} type="button" role="radio" aria-checked={selected} onClick={() => onChange(t.id)}
                            className={cn(
                                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                                selected ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-slate-500",
                            )}>
                        {t.name} <span className={selected ? "text-slate-300" : "text-slate-400"}>{t.duration_minutes} min</span>
                    </button>
                );
            })}
        </div>
    );
}

function DoctorSummary({doctor}: { doctor: PublicPractitioner }) {
    const languages = languageLine(doctor);
    return (
        <Panel>
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <DoctorAvatar doctor={doctor} size="lg"/>
                    <div className="min-w-0 space-y-1">
                        <h2 className="text-lg font-semibold leading-tight text-slate-900">{doctor.display_name}</h2>
                        {headline(doctor) && <p className="text-sm text-slate-600">{headline(doctor)}</p>}
                        {doctor.has_profile && metaLine(doctor) && <p className="text-xs text-slate-500">{metaLine(doctor)}</p>}
                        <Availability doctor={doctor}/>
                    </div>
                </div>
                {doctor.tagline && <p className="text-sm italic text-slate-700">“{doctor.tagline}”</p>}
                {doctor.biography && <p className="line-clamp-4 whitespace-pre-line text-sm text-slate-600">{doctor.biography}</p>}
                {!!doctor.special_interests?.length && <Interests items={doctor.special_interests} limit={4}/>}
                {languages && (
                    <p className="flex items-start gap-1.5 text-xs text-slate-600">
                        <Languages className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400"/> {languages}
                    </p>
                )}
            </div>
        </Panel>
    );
}

function Row({icon: Icon, children}: { icon: typeof Clock; children: ReactNode }) {
    return (
        <div className="flex items-start gap-3">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-blue-600"/>
            <div className="min-w-0 text-sm">{children}</div>
        </div>
    );
}

function BookingSummary({typeName, doctorName, slot, payment, onChangeTime, onChangePayment}: {
    typeName: string;
    doctorName: string;
    slot: string | null;
    payment?: PaymentChoice;
    onChangeTime?: () => void;
    onChangePayment?: () => void;
}) {
    return (
        <Panel title="Your appointment">
            {!slot ? (
                <p className="text-sm text-slate-500">Choose a time and your summary will appear here.</p>
            ) : (
                <div className="space-y-3">
                    <Row icon={CalendarDays}>
                        <p className="font-medium text-slate-900">{longDate(slot)}</p>
                        <p className="text-slate-600">at {slot.slice(11, 16)}</p>
                        {onChangeTime && (
                            <button type="button" onClick={onChangeTime} className="mt-0.5 font-medium text-blue-600 hover:underline">
                                Change time
                            </button>
                        )}
                    </Row>
                    <Row icon={Clock}><p className="text-slate-700">{typeName} with {doctorName}</p></Row>
                    {payment && (
                        <Row icon={payment.method === "cash" ? Banknote : ShieldPlus}>
                            <p className="text-slate-700">{paymentLabel(payment)}</p>
                            {onChangePayment && (
                                <button type="button" onClick={onChangePayment} className="mt-0.5 font-medium text-blue-600 hover:underline">
                                    Change
                                </button>
                            )}
                        </Row>
                    )}
                </div>
            )}
        </Panel>
    );
}

function GoodToKnow() {
    return (
        <Panel title="Good to know">
            <ul className="space-y-3">
                <li><Row icon={Timer}>Please arrive about 10 minutes early.</Row></li>
                <li><Row icon={FileText}>Bring your ID and your medical aid card, if you have one.</Row></li>
                <li><Row icon={CalendarCheck}>You'll get a link to change or cancel your booking afterwards.</Row></li>
            </ul>
        </Panel>
    );
}

function TimePicker({slug, practitionerId, typeId, maxDaysAhead, weekStart, setWeekStart, slot, setSlot, onContinue}: {
    slug: string;
    practitionerId: string;
    typeId: string;
    maxDaysAhead: number;
    weekStart: Date;
    setWeekStart: (d: Date) => void;
    slot: string | null;
    setSlot: (iso: string | null) => void;
    onContinue: () => void;
}) {
    const [pickedDate, setPickedDate] = useState<string | null>(null);
    const slots = useSlots(slug, practitionerId, typeId, ymd(weekStart), ymd(addDays(weekStart, 6)));

    const today = startOfDay(new Date());
    const canGoBack = !isBefore(addDays(weekStart, -7), today);
    const canGoForward = addDays(weekStart, 7) <= addDays(today, maxDaysAhead);

    const days = Array.from({length: 7}, (_, i) => addDays(weekStart, i));
    const byDate = new Map((slots.data ?? []).map((d) => [d.date, d.slots]));
    const firstOpen = days.map(ymd).find((key) => byDate.get(key)?.length);
    const activeKey = pickedDate && byDate.get(pickedDate)?.length ? pickedDate : firstOpen;
    const activeSlots = activeKey ? byDate.get(activeKey) ?? [] : [];
    const hour = (s: string) => Number(s.slice(11, 13));
    const groups = [
        {label: "Morning", items: activeSlots.filter((s) => hour(s) < 12)},
        {label: "Afternoon", items: activeSlots.filter((s) => hour(s) >= 12 && hour(s) < 17)},
        {label: "Evening", items: activeSlots.filter((s) => hour(s) >= 17)},
    ].filter((g) => g.items.length > 0);

    function moveWeek(delta: number) {
        setWeekStart(addDays(weekStart, delta));
        setPickedDate(null);
        setSlot(null);
    }

    return (
        <section className="flex h-full flex-col rounded-lg border border-slate-200 bg-white shadow-sm">
            <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">Pick a time</h2>
            <div className="flex-1 space-y-4 p-4">
                <div className="flex items-center justify-between gap-2">
                    <Button variant="outline" size="sm" disabled={!canGoBack} onClick={() => moveWeek(-7)} aria-label="Previous week">
                        <ChevronLeft className="h-4 w-4"/>
                    </Button>
                    <p className="text-sm font-medium text-slate-900">
                        {format(weekStart, "d MMM")} – {format(addDays(weekStart, 6), "d MMM yyyy")}
                    </p>
                    <Button variant="outline" size="sm" disabled={!canGoForward} onClick={() => moveWeek(7)} aria-label="Next week">
                        <ChevronRight className="h-4 w-4"/>
                    </Button>
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                    {days.map((day) => {
                        const key = ymd(day);
                        const count = byDate.get(key)?.length ?? 0;
                        const active = key === activeKey;
                        return (
                            <button key={key} type="button" disabled={count === 0} aria-pressed={active}
                                    onClick={() => {
                                        setPickedDate(key);
                                        setSlot(null);
                                    }}
                                    className={cn(
                                        "flex flex-col items-center rounded-md border px-1 py-2 text-center transition-colors",
                                        active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white hover:border-slate-500",
                                        count === 0 && "cursor-not-allowed bg-slate-50 text-slate-300 hover:border-slate-200",
                                    )}>
                                <span className="text-[11px] font-medium uppercase">{isToday(day) ? "Today" : format(day, "EEE")}</span>
                                <span className="text-lg font-semibold leading-tight">{format(day, "d")}</span>
                                <span className={cn("text-[10px]", active ? "text-slate-300" : "text-slate-400")}>
                                    {count ? `${count} free` : "full"}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {slots.isLoading && <p className="text-sm text-slate-500">Finding times…</p>}
                {slots.isError && <p className="text-sm text-red-600">Couldn't load times. Please try again.</p>}
                {slots.isSuccess && !firstOpen && (
                    <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-600">
                        No times available this week.{canGoForward && " Try the next week."}
                    </p>
                )}

                {activeKey && (
                    <div className="space-y-4">
                        <p className="text-sm font-medium text-slate-900">{format(parseISO(activeKey), "EEEE d MMMM")}</p>
                        {groups.map((group) => (
                            <div key={group.label} className="space-y-2">
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{group.label}</p>
                                <div className="grid grid-cols-[repeat(auto-fill,minmax(5rem,1fr))] gap-2">
                                    {group.items.map((iso) => (
                                        <Button key={iso} variant={slot === iso ? "default" : "outline"} size="sm"
                                                onClick={() => setSlot(iso)}>
                                            {iso.slice(11, 16) /* the practice's own clock time */}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-4 py-3">
                <p className="text-sm text-slate-600">
                    {slot ? <><span className="font-medium text-slate-900">{longDate(slot)}</span> at {slot.slice(11, 16)}</> : "Pick a time to continue"}
                </p>
                <Button disabled={!slot} onClick={onContinue}>Continue</Button>
            </div>
        </section>
    );
}

function calendarHref(booked: BookingResult) {
    const start = parseISO(booked.start_at.slice(0, 19));
    const end = parseISO(booked.end_at.slice(0, 19));
    const stamp = (d: Date) => format(d, "yyyyMMdd'T'HHmmss");
    const ics = [
        "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Booking//EN", "BEGIN:VEVENT",
        `UID:${booked.token}@booking`, `DTSTAMP:${stamp(new Date())}`,
        `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`,
        `SUMMARY:${booked.appointment_type} with ${booked.practitioner}`,
        `LOCATION:${[booked.practice_name, booked.practice_address].filter(Boolean).join(", ")}`,
        "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}

export default function BookingPage() {
    const {slug = ""} = useParams();
    const practiceQuery = usePublicPractice(slug);
    const data = practiceQuery.data;
    const queryClient = useQueryClient();

    const [practitionerId, setPractitionerId] = useState("");
    const [typeId, setTypeId] = useState("");
    const [weekStart, setWeekStart] = useState(() => startOfDay(new Date()));
    const [slot, setSlot] = useState<string | null>(null);
    const [payment, setPayment] = useState<PaymentChoice>(CASH);
    const [stage, setStage] = useState<Stage>("choose");
    const [booked, setBooked] = useState<BookingResult | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    // Nothing to choose between? Pick it for the patient. The first visit type is the starting point so
    // each doctor card can show their next available times.
    useEffect(() => {
        if (!data) return;
        if (!typeId && data.appointment_types.length > 0) setTypeId(data.appointment_types[0].id);
        if (!practitionerId && data.practitioners.length === 1) {
            setPractitionerId(data.practitioners[0].id);
            setStage("time");
        }
    }, [data, practitionerId, typeId]);

    if (practiceQuery.isLoading) return <p className="p-8 text-center text-slate-500">Loading…</p>;
    if (practiceQuery.isError || !data) {
        const notFound = practiceQuery.error instanceof ApiError && practiceQuery.error.status === 404;
        return (
            <p className="p-8 text-center text-slate-600">
                {notFound ? "This booking page isn't available." : "Something went wrong. Please try again later."}
            </p>
        );
    }

    const practitioner = data.practitioners.find((p) => p.id === practitionerId);
    const appointmentType = data.appointment_types.find((t) => t.id === typeId);
    const maxDays = data.practice.booking_max_days_ahead;
    const singleDoctor = data.practitioners.length === 1;
    const name = data.practice.name;

    const go = (next: Stage) => {
        setStage(next);
        window.scrollTo({top: 0});
    };

    function startBooking(doctorId: string, chosenSlot?: string) {
        setNotice(null);
        setPractitionerId(doctorId);
        if (chosenSlot) {
            setSlot(chosenSlot);
            setWeekStart(startOfDay(parseISO(chosenSlot.slice(0, 10))));
            go("payment");
        } else {
            setSlot(null);
            setWeekStart(startOfDay(new Date()));
            go("time");
        }
    }

    function changeType(id: string) {
        setTypeId(id);
        setSlot(null);
    }

    const backToDoctors = () => {
        setSlot(null);
        go("choose");
    };

    /* ---------- Done ---------- */
    if (stage === "done" && booked) {
        return (
            <Shell name={name} stage="done">
                <div className="grid items-start gap-4 lg:grid-cols-[1fr_24rem]">
                    <Panel bodyClass="space-y-5 p-6">
                        <div className="flex items-center gap-4">
                            <CheckCircle2 className="h-12 w-12 shrink-0 text-emerald-500"/>
                            <div>
                                <h2 className="text-2xl font-semibold text-slate-900">You're booked</h2>
                                <p className="text-slate-600">We'll send you a confirmation and a reminder before your visit.</p>
                            </div>
                        </div>
                        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                            <Row icon={CalendarDays}>
                                <p className="font-medium text-slate-900">{longDate(booked.start_at)} at {booked.start_at.slice(11, 16)}</p>
                            </Row>
                            <Row icon={Clock}><p>{booked.appointment_type} with {booked.practitioner}</p></Row>
                            <Row icon={FileText}>
                                <p>{booked.practice_name}{booked.practice_address && `, ${booked.practice_address}`}</p>
                                {booked.practice_phone && <p className="text-slate-500">Need to change it? Call {booked.practice_phone}</p>}
                            </Row>
                            <Row icon={payment.method === "cash" ? Banknote : ShieldPlus}><p>{paymentLabel(payment)}</p></Row>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Link to={`/a/${booked.token}`} className={buttonVariants({variant: "default"})}>
                                Manage this appointment
                            </Link>
                            <a href={calendarHref(booked)}
                               download="appointment.ics" className={buttonVariants({variant: "outline"})}>
                                <CalendarPlus className="mr-1.5 h-4 w-4"/> Add to calendar
                            </a>
                        </div>
                    </Panel>
                    <div className="space-y-4">
                        <Panel title="What happens next">
                            <ol className="space-y-3 text-sm text-slate-700">
                                <li><Row icon={CalendarCheck}>You'll receive a confirmation shortly.</Row></li>
                                <li><Row icon={Clock}>We'll remind you before your visit.</Row></li>
                                <li><Row icon={FileText}>Bring your ID{payment.method === "medical_aid" && " and medical aid card"}.</Row></li>
                            </ol>
                        </Panel>
                    </div>
                </div>
            </Shell>
        );
    }

    /* ---------- Details ---------- */
    if (stage === "details" && slot && practitioner && appointmentType) {
        return (
            <Shell name={name} stage="details" onBack={() => go("payment")}>
                <div className="grid items-start gap-4 lg:grid-cols-[22rem_1fr]">
                    <div className="space-y-4">
                        <BookingSummary
                            typeName={appointmentType.name}
                            doctorName={practitioner.display_name}
                            slot={slot}
                            payment={payment}
                            onChangeTime={() => go("time")}
                            onChangePayment={() => go("payment")}
                        />
                        <GoodToKnow/>
                    </div>
                    <Panel title="Your details">
                        <BookingDetailsForm
                            slug={slug}
                            practiceName={name}
                            practitionerId={practitionerId}
                            typeId={typeId}
                            slot={slot}
                            payment={paymentPayload(payment)}
                            onBooked={(result) => {
                                setBooked(result);
                                go("done");
                                queryClient.invalidateQueries({queryKey: ["public", "slots"]});
                            }}
                            onSlotTaken={() => {
                                setSlot(null);
                                setNotice("Sorry, that time was just taken. Please pick another.");
                                go("time");
                                queryClient.invalidateQueries({queryKey: ["public", "slots"]});
                            }}
                        />
                    </Panel>
                </div>
            </Shell>
        );
    }

    /* ---------- Payment ---------- */
    if (stage === "payment" && slot && practitioner && appointmentType) {
        return (
            <Shell name={name} stage="payment" onBack={() => go("time")}>
                <div className="grid items-stretch gap-4 lg:grid-cols-[22rem_1fr]">
                    <div className="space-y-4">
                        <DoctorSummary doctor={practitioner}/>
                        <BookingSummary
                            typeName={appointmentType.name}
                            doctorName={practitioner.display_name}
                            slot={slot}
                            onChangeTime={() => go("time")}
                        />
                    </div>
                    <PaymentStep value={payment} onChange={setPayment} onBack={() => go("time")}
                                 onContinue={() => go("details")}/>
                </div>
            </Shell>
        );
    }

    /* ---------- Time ---------- */
    if (stage === "time" && practitioner) {
        const summary = (
            <BookingSummary typeName={appointmentType?.name ?? "Appointment"} doctorName={practitioner.display_name} slot={slot}/>
        );
        return (
            <Shell name={name} stage="time" onBack={singleDoctor ? undefined : backToDoctors}>
                {notice && <Banner tone="amber">{notice}</Banner>}
                <div className="grid items-stretch gap-4 lg:grid-cols-[22rem_1fr] xl:grid-cols-[22rem_1fr_20rem]">
                    <div className="space-y-4">
                        <DoctorSummary doctor={practitioner}/>
                        {data.appointment_types.length > 1 && (
                            <Panel title="What is the visit for?">
                                <TypeChips types={data.appointment_types} value={typeId} onChange={changeType}/>
                            </Panel>
                        )}
                        <div className="space-y-4 xl:hidden">{summary}<GoodToKnow/></div>
                    </div>
                    <TimePicker
                        slug={slug}
                        practitionerId={practitionerId}
                        typeId={typeId}
                        maxDaysAhead={maxDays}
                        weekStart={weekStart}
                        setWeekStart={setWeekStart}
                        slot={slot}
                        setSlot={setSlot}
                        onContinue={() => {
                            setNotice(null);
                            go("payment");
                        }}
                    />
                    <div className="hidden space-y-4 xl:block">{summary}<GoodToKnow/></div>
                </div>
            </Shell>
        );
    }

    /* ---------- Choose a doctor ---------- */
    return (
        <Shell name={name} stage="choose">
            {notice && <Banner tone="amber">{notice}</Banner>}
            {data.appointment_types.length > 1 && (
                <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-sm font-semibold text-slate-900">What is the visit for?</p>
                    <TypeChips types={data.appointment_types} value={typeId} onChange={changeType}/>
                </div>
            )}
            <DoctorPicker slug={slug} doctors={data.practitioners} typeId={typeId} maxDaysAhead={maxDays}
                          onBook={startBooking}/>
        </Shell>
    );
}