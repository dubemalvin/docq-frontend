import {useState} from "react";
import {addDays, format, isToday, isTomorrow, parseISO, startOfDay} from "date-fns";
import {CalendarClock, CheckCircle2, GraduationCap, Languages} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle} from "@/components/ui/sheet";
import {cn} from "@/lib/utils";
import {GENDER_LABEL} from "./doctorFilters";
import {useSlots, type PublicPractitioner} from "./hooks";

const stripTitle = (name: string) => name.replace(/^(dr|prof|sr|mr|ms|mrs)\.?\s+/i, "");
const ymd = (d: Date) => format(d, "yyyy-MM-dd");

export function DoctorAvatar({doctor, size = "md"}: { doctor: PublicPractitioner; size?: "md" | "lg" | "xl" }) {
    const [broken, setBroken] = useState(false);
    const cls = {md: "h-20 w-16 text-xl", lg: "h-24 w-24 text-3xl", xl: "h-32 w-32 text-4xl"}[size];
    if (doctor.photo_url && !broken) {
        return (
            <img
                src={doctor.photo_url}
                alt={doctor.display_name}
                onError={() => setBroken(true)}
                className={cn(cls, "shrink-0 rounded-lg object-cover")}
            />
        );
    }
    const initials = stripTitle(doctor.display_name).split(/\s+/).filter(Boolean).slice(0, 2)
        .map((w) => w[0]?.toUpperCase()).join("");
    return (
        <div
            style={{backgroundColor: doctor.color}}
            className={cn(cls, "flex shrink-0 items-center justify-center rounded-lg font-semibold text-white")}
        >
            {initials}
        </div>
    );
}

export function languageLine(d: PublicPractitioner) {
    const fluent = (d.languages_fluent ?? []).map((l) => l.label);
    const also = (d.languages_conversational ?? []).map((l) => l.label);
    if (!fluent.length && !also.length) return null;
    if (!fluent.length) return `Comfortable in ${also.join(", ")}`;
    return `Speaks ${fluent.join(", ")}${also.length ? `, also comfortable in ${also.join(", ")}` : ""}`;
}

export const headline = (d: PublicPractitioner) => d.specialty || d.discipline_label || "";

export function metaLine(d: PublicPractitioner) {
    return [
        d.specialty && d.discipline_label && d.specialty !== d.discipline_label ? d.discipline_label : null,
        d.gender ? GENDER_LABEL[d.gender] : null,
        d.years_experience ? `${d.years_experience} years' experience` : null,
    ].filter(Boolean).join(" · ");
}

export function Interests({items, limit}: { items: string[]; limit?: number }) {
    const shown = limit ? items.slice(0, limit) : items;
    return (
        <ul className="flex flex-wrap gap-1.5">
            {shown.map((item) => (
                <li key={item}
                    className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                    {item}
                </li>
            ))}
            {limit && items.length > limit && (
                <li className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">+{items.length - limit} more</li>
            )}
        </ul>
    );
}

export function Availability({doctor}: { doctor: PublicPractitioner }) {
    if (!doctor.has_profile) return null;
    return doctor.accepts_new_patients === false ? (
        <p className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
            <span className="h-2 w-2 rounded-full bg-amber-500"/> Existing patients only
        </p>
    ) : (
        <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500"/> Accepting new patients
        </p>
    );
}

export function slotLabel(iso: string) {
    const date = parseISO(iso.slice(0, 10));
    const day = isToday(date) ? "Today" : isTomorrow(date) ? "Tomorrow" : format(date, "EEE d MMM");
    return `${day}, ${iso.slice(11, 16)}`; // the practice's own clock time
}

function NextSlots({slug, practitionerId, typeId, maxDaysAhead, onPick}: {
    slug: string;
    practitionerId: string;
    typeId: string;
    maxDaysAhead: number;
    onPick: (iso: string) => void;
}) {
    const today = startOfDay(new Date());
    const to = addDays(today, Math.min(13, maxDaysAhead));
    const query = useSlots(slug, practitionerId, typeId, ymd(today), ymd(to));
    const next = (query.data ?? []).flatMap((day) => day.slots).slice(0, 3);

    return (
        <div className="space-y-1.5">
            <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <CalendarClock className="h-3.5 w-3.5"/> Next available
            </p>
            {query.isLoading ? (
                <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => <div key={i} className="h-7 w-24 animate-pulse rounded-full bg-slate-100"/>)}
                </div>
            ) : next.length === 0 ? (
                <p className="text-xs text-slate-500">
                    {query.isError ? "Couldn't load times." : "Nothing in the next two weeks. Check the full calendar."}
                </p>
            ) : (
                <ul className="flex flex-wrap gap-1.5">
                    {next.map((iso) => (
                        <li key={iso}>
                            <button
                                type="button"
                                onClick={() => onPick(iso)}
                                className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-800 transition-colors hover:border-slate-900 hover:bg-slate-900 hover:text-white"
                            >
                                {slotLabel(iso)}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

type CardProps = {
    slug: string;
    doctor: PublicPractitioner;
    typeId: string;
    maxDaysAhead: number;
    onBook: () => void;
    onPickSlot: (iso: string) => void;
    onReadMore: () => void;
};

export default function DoctorCard({slug, doctor, typeId, maxDaysAhead, onBook, onPickSlot, onReadMore}: CardProps) {
    const languages = languageLine(doctor);
    return (
        <article
            className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex gap-3">
                <DoctorAvatar doctor={doctor}/>
                <div className="min-w-0 space-y-0.5">
                    <h3 className="font-semibold leading-tight text-slate-900">{doctor.display_name}</h3>
                    {headline(doctor) && <p className="text-sm text-slate-600">{headline(doctor)}</p>}
                    {doctor.has_profile && metaLine(doctor) && <p className="text-xs text-slate-500">{metaLine(doctor)}</p>}
                    <div className="pt-1"><Availability doctor={doctor}/></div>
                </div>
            </div>

            {doctor.tagline && <p className="text-sm italic text-slate-700">“{doctor.tagline}”</p>}
            {!!doctor.special_interests?.length && <Interests items={doctor.special_interests} limit={3}/>}
            {languages && (
                <p className="flex items-start gap-1.5 text-xs text-slate-600">
                    <Languages className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400"/> {languages}
                </p>
            )}

            <div className="mt-auto space-y-3 border-t border-slate-100 pt-3">
                {typeId && (
                    <NextSlots slug={slug} practitionerId={doctor.id} typeId={typeId}
                               maxDaysAhead={maxDaysAhead} onPick={onPickSlot}/>
                )}
                <div className="flex gap-2">
                    {doctor.has_profile && (
                        <Button type="button" variant="outline" className="flex-1" onClick={onReadMore}>
                            View profile
                        </Button>
                    )}
                    <Button type="button" className="flex-1" onClick={onBook}>Book</Button>
                </div>
            </div>
        </article>
    );
}

type SheetProps = { doctor: PublicPractitioner | null; onClose: () => void; onBook: () => void };

export function DoctorProfileSheet({doctor, onClose, onBook}: SheetProps) {
    const languages = doctor ? languageLine(doctor) : null;
    return (
        <Sheet open={doctor !== null} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
                {doctor && (
                    <>
                        <SheetHeader className="border-b border-border">
                            <SheetTitle>{doctor.display_name}</SheetTitle>
                            <SheetDescription>{headline(doctor) || "About this doctor"}</SheetDescription>
                        </SheetHeader>

                        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
                            <div className="flex items-center gap-4">
                                <DoctorAvatar doctor={doctor} size="lg"/>
                                <div className="space-y-1.5">
                                    {metaLine(doctor) && <p className="text-sm text-slate-600">{metaLine(doctor)}</p>}
                                    <Availability doctor={doctor}/>
                                </div>
                            </div>

                            {doctor.tagline && <p className="text-base italic text-slate-700">“{doctor.tagline}”</p>}

                            {doctor.biography && (
                                <section className="space-y-1">
                                    <h4 className="text-sm font-semibold">About</h4>
                                    <p className="whitespace-pre-line text-sm text-slate-700">{doctor.biography}</p>
                                </section>
                            )}

                            {languages && (
                                <section className="space-y-1">
                                    <h4 className="text-sm font-semibold">Languages</h4>
                                    <p className="text-sm text-slate-700">{languages}</p>
                                </section>
                            )}

                            {!!doctor.special_interests?.length && (
                                <section className="space-y-2">
                                    <h4 className="text-sm font-semibold">Special interests</h4>
                                    <Interests items={doctor.special_interests}/>
                                </section>
                            )}

                            {!!doctor.qualifications?.length && (
                                <section className="space-y-2">
                                    <h4 className="text-sm font-semibold">Qualifications</h4>
                                    <ul className="space-y-1.5">
                                        {doctor.qualifications.map((q, index) => (
                                            <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                                                <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"/>
                                                <span>
                                                    {q.degree}
                                                    {q.institution && `, ${q.institution}`}
                                                    {q.year && ` (${q.year})`}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            )}
                        </div>

                        <SheetFooter className="flex-row gap-2 border-t border-border px-4">
                            <Button variant="outline" className="flex-1" onClick={onClose}>Back</Button>
                            <Button className="flex-1" onClick={() => {
                                onBook();
                                onClose();
                            }}>
                                Book {doctor.display_name}
                            </Button>
                        </SheetFooter>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}