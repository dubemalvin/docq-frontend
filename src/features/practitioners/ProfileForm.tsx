import {useEffect, useMemo, useState, type FormEvent, type ReactNode} from "react";
import {Camera, Check, Eye, GraduationCap, Languages, Plus, Sparkles, Trash2, User, type LucideIcon} from "lucide-react";
import Field from "@/components/Field";
import ToggleRow from "@/components/ToggleRow";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {cn} from "@/lib/utils";
import {ChipPicker, ProfilePhoto, selectClass, TagInput} from "./ProfileBlocks";
import {useProfileOptions, type Gender, type PractitionerProfile, type ProfileInput} from "./profile";

type Row = { degree: string; institution: string; year: string };
type Values = Omit<ProfileInput, "practising_since" | "qualifications"> & {
    practising_since: string;
    qualifications: Row[];
};

const CURRENT_YEAR = new Date().getFullYear();

function toValues(p: PractitionerProfile): Values {
    return {
        title: p.title, specialty: p.specialty, gender: p.gender, discipline: p.discipline,
        languages_fluent: p.languages_fluent, languages_conversational: p.languages_conversational,
        special_interests: p.special_interests, tagline: p.tagline, biography: p.biography,
        qualifications: p.qualifications.map((q) => ({
            degree: q.degree, institution: q.institution, year: q.year ? String(q.year) : "",
        })),
        practising_since: p.practising_since ? String(p.practising_since) : "",
        accepts_new_patients: p.accepts_new_patients, show_profile_publicly: p.show_profile_publicly,
    };
}

function toInput(v: Values): ProfileInput {
    return {
        ...v,
        practising_since: v.practising_since.trim() ? Number(v.practising_since) : null,
        qualifications: v.qualifications
            .filter((r) => r.degree.trim() || r.institution.trim() || r.year.trim())
            .map((r) => ({
                degree: r.degree.trim(),
                institution: r.institution.trim(),
                year: r.year.trim() ? Number(r.year) : null,
            })),
    };
}

function validate(v: Values): Record<string, string> {
    const errors: Record<string, string> = {};
    const since = v.practising_since.trim();
    if (since && (!/^\d{4}$/.test(since) || Number(since) < 1950 || Number(since) > CURRENT_YEAR)) {
        errors.practising_since = `Enter a year between 1950 and ${CURRENT_YEAR}`;
    }
    for (const row of v.qualifications) {
        const used = row.degree.trim() || row.institution.trim() || row.year.trim();
        if (used && !row.degree.trim()) errors.qualifications = "Each qualification needs a degree or title.";
        const year = row.year.trim();
        if (year && (!/^\d{4}$/.test(year) || Number(year) < 1930 || Number(year) > CURRENT_YEAR)) {
            errors.qualifications = `Qualification years must be between 1930 and ${CURRENT_YEAR}.`;
        }
    }
    return errors;
}

/** Card with a fixed header. Give it a bounded height (className) and the body scrolls. */
function Section({icon: Icon, title, hint, children, className}: {
    icon: LucideIcon;
    title: string;
    hint?: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section className={cn("flex min-w-0 flex-col rounded-sm border border-slate-200 bg-white shadow-sm", className)}>
            <header className="flex shrink-0 items-center gap-2.5 border-b border-slate-100 px-4 py-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-slate-100 text-blue-600">
                    <Icon className="h-3.5 w-3.5"/>
                </span>
                <div className="min-w-0">
                    <h2 className="text-sm font-semibold leading-tight text-slate-900">{title}</h2>
                    {hint && <p className="truncate text-xs leading-tight text-slate-500">{hint}</p>}
                </div>
            </header>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">{children}</div>
        </section>
    );
}

type Props = {
    profile: PractitionerProfile;
    photoPath: string;
    saving: boolean;
    saved: boolean;
    error: string | null;
    isSelf?: boolean;
    fieldErrors: Record<string, string>;
    onSave: (input: ProfileInput) => void;
    className?: string;
};

export default function ProfileForm({
                                        profile, photoPath, saving, saved, error, isSelf, fieldErrors, onSave, className,
                                    }: Props) {
    const options = useProfileOptions();
    const initial = useMemo(() => toValues(profile), [profile]);
    const [values, setValues] = useState<Values>(initial);
    const [showErrors, setShowErrors] = useState(false);
    useEffect(() => setValues(initial), [initial]);

    const set = <K extends keyof Values>(key: K, value: Values[K]) =>
        setValues((current) => ({...current, [key]: value}));
    const dirty = JSON.stringify(values) !== JSON.stringify(initial);
    const clientErrors = useMemo(() => validate(values), [values]);
    const errors = {...(showErrors ? clientErrors : {}), ...fieldErrors};

    function setRow(index: number, patch: Partial<Row>) {
        set("qualifications", values.qualifications.map((row, i) => (i === index ? {...row, ...patch} : row)));
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        setShowErrors(true);
        if (Object.keys(clientErrors).length) return;
        onSave(toInput(values));
    }

    return (
        <form
            onSubmit={submit}
            noValidate
            className={cn("flex min-h-0 min-w-0 flex-col gap-3 lg:h-full", className)}
        >
            {error && (
                <p role="alert" className="shrink-0 rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </p>
            )}

            {/* Frame: two columns on lg+, each scrolls on its own. Stacks and scrolls with the page below lg. */}
            <div className="grid min-h-0 min-w-0 gap-3 lg:flex-1 lg:grid-cols-2">
                {/* Left column: who you are to patients */}
                <div className="flex min-h-0 min-w-0 flex-col gap-3 lg:overflow-y-auto">
                    <Section icon={Camera} title="Photo" hint="Shown on your booking page profile" className="shrink-0">
                        <ProfilePhoto
                            name={profile.display_name}
                            photoPath={photoPath}
                            hasPhoto={profile.has_photo}
                            version={profile.photo_updated_at}
                        />
                    </Section>

                    <Section icon={Eye} title="Visibility" hint="Control what patients can see" className="shrink-0">
                        <ToggleRow
                            title={isSelf ? "Show my profile on the online booking page" : "Show this profile on the online booking page"}
                            description={
                                isSelf
                                    ? "Your photo, biography, languages and qualifications become visible to anyone with the booking link. You can switch this off at any time. Until it is on, patients see only your name."
                                    : "Only switch this on once the practitioner has agreed. Their photo, biography, languages and qualifications become visible to anyone with the booking link."
                            }
                            checked={values.show_profile_publicly}
                            onChange={(e) => set("show_profile_publicly", e.target.checked)}
                        />
                        <ToggleRow
                            title={isSelf ? "I am accepting new patients" : "Accepting new patients"}
                            checked={values.accepts_new_patients}
                            onChange={(e) => set("accepts_new_patients", e.target.checked)}
                        />
                    </Section>

                    <Section icon={Languages} title="Languages" hint="Patients can search by language"
                             className="shrink-0">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Field label="Fluent in" error={errors.languages_fluent}>
                                <ChipPicker
                                    options={options.data?.languages ?? []}
                                    value={values.languages_fluent}
                                    onChange={(value) => set("languages_fluent", value)}
                                    placeholder="Add a language…"
                                />
                            </Field>
                            <Field label="Comfortable consulting in" error={errors.languages_conversational}>
                                <ChipPicker
                                    options={options.data?.languages ?? []}
                                    value={values.languages_conversational}
                                    exclude={values.languages_fluent}
                                    onChange={(value) => set("languages_conversational", value)}
                                    placeholder="Add a language…"
                                />
                            </Field>
                        </div>
                    </Section>

                    <Section icon={Sparkles} title="Special interests" className="shrink-0">
                        <Field label="Areas you enjoy most" error={errors.special_interests}>
                            <TagInput
                                value={values.special_interests}
                                onChange={(value) => set("special_interests", value)}
                                placeholder="E.g. Chronic disease management"
                            />
                        </Field>
                    </Section>
                </div>

                {/* Right column: about + qualifications (qualifications takes the leftover height) */}
                <div className="flex min-h-0 min-w-0 flex-col gap-3 lg:overflow-y-auto">
                    <Section icon={User} title="About you" hint="How you introduce yourself" className="shrink-0">
                        <div className="grid gap-3 sm:grid-cols-[5rem_1fr]">
                            <Field label="Title" htmlFor="title" error={errors.title}>
                                <Input id="title" className="bg-white" value={values.title}
                                       onChange={(e) => set("title", e.target.value)}/>
                            </Field>
                            <Field label="Headline" htmlFor="specialty" error={errors.specialty}>
                                <Input id="specialty" className="bg-white" placeholder="E.g. Family doctor"
                                       value={values.specialty} onChange={(e) => set("specialty", e.target.value)}/>
                            </Field>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            <Field label="Field of practice" htmlFor="discipline" error={errors.discipline}>
                                <select id="discipline" className={selectClass} value={values.discipline}
                                        onChange={(e) => set("discipline", e.target.value)}>
                                    <option value="">Select…</option>
                                    {options.data?.disciplines.map((o) => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Gender" htmlFor="gender" error={errors.gender}>
                                <select id="gender" className={selectClass} value={values.gender}
                                        onChange={(e) => set("gender", e.target.value as Gender)}>
                                    {options.data?.genders.map((o) => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Practising since" htmlFor="practising_since"
                                   error={errors.practising_since}>
                                <Input id="practising_since" className="bg-white" inputMode="numeric" maxLength={4}
                                       placeholder="2010" value={values.practising_since}
                                       onChange={(e) => set("practising_since", e.target.value)}/>
                            </Field>
                        </div>

                        <Field label="Tagline" htmlFor="tagline" error={errors.tagline}>
                            <Input id="tagline" className="bg-white" maxLength={160}
                                   placeholder="One line patients see first"
                                   value={values.tagline} onChange={(e) => set("tagline", e.target.value)}/>
                        </Field>

                        <Field label="Biography" htmlFor="biography" error={errors.biography}>
                            <Textarea
                                id="biography"
                                rows={5}
                                maxLength={2000}
                                className="min-h-0 resize-none bg-white"
                                value={values.biography}
                                onChange={(e) => set("biography", e.target.value)}
                                placeholder="Tell patients who you are, how you like to work, and what matters to you."
                            />
                            <p className="text-right text-xs text-slate-500">{values.biography.length}/2000</p>
                        </Field>
                    </Section>

                    <Section
                        icon={GraduationCap}
                        title="Qualifications"
                        hint="Degrees and where you studied"
                        className="min-h-56 lg:min-h-0 lg:flex-1"
                    >
                        {values.qualifications.length === 0 && (
                            <p className="rounded-sm border border-dashed border-slate-300 px-3 py-4 text-center text-sm text-slate-500">
                                No qualifications added yet.
                            </p>
                        )}
                        <div className="space-y-2">
                            {values.qualifications.map((row, index) => (
                                <div
                                    key={index}
                                    className="grid grid-cols-[1fr_4.5rem_2.25rem] gap-2 rounded-sm border border-slate-200 bg-slate-50/60 p-2 sm:grid-cols-[1.2fr_1.2fr_4.5rem_2.25rem]"
                                >
                                    <Input aria-label="Degree" className="col-span-3 bg-white sm:col-span-1"
                                           placeholder="Degree, e.g. MBChB" value={row.degree}
                                           onChange={(e) => setRow(index, {degree: e.target.value})}/>
                                    <Input aria-label="Institution" className="bg-white" placeholder="University"
                                           value={row.institution}
                                           onChange={(e) => setRow(index, {institution: e.target.value})}/>
                                    <Input aria-label="Year" className="bg-white" placeholder="Year"
                                           inputMode="numeric" maxLength={4} value={row.year}
                                           onChange={(e) => setRow(index, {year: e.target.value})}/>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-9 rounded-sm text-slate-500 hover:text-red-600"
                                        aria-label="Remove qualification"
                                        onClick={() => set("qualifications", values.qualifications.filter((_, i) => i !== index))}
                                    >
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                </div>
                            ))}
                        </div>
                        {errors.qualifications && <p className="text-sm text-red-600">{errors.qualifications}</p>}
                        {values.qualifications.length < 10 && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="rounded-sm"
                                onClick={() => set("qualifications", [...values.qualifications, {degree: "", institution: "", year: ""}])}
                            >
                                <Plus className="mr-1.5 h-3.5 w-3.5"/> Add qualification
                            </Button>
                        )}
                    </Section>
                </div>
            </div>

            {/* Pinned save bar: part of the layout, never scrolls away */}
            <div className="flex shrink-0 items-center justify-between gap-3 rounded-sm border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
                <span
                    className={cn(
                        "min-w-0 truncate text-sm",
                        saved && !dirty ? "flex items-center gap-1.5 font-medium text-emerald-700" : "text-slate-500",
                    )}
                    aria-live="polite"
                >
                    {saved && !dirty
                        ? <><Check className="h-4 w-4"/>Changes saved</>
                        : dirty ? "You have unsaved changes" : "All changes saved"}
                </span>
                <div className="flex shrink-0 gap-2">
                    <Button type="button" variant="outline" className="rounded-sm" disabled={!dirty || saving}
                            onClick={() => {
                                setValues(initial);
                                setShowErrors(false);
                            }}>
                        Discard
                    </Button>
                    <Button type="submit" className="rounded-sm" disabled={!dirty || saving}>
                        {saving ? "Saving…" : "Save profile"}
                    </Button>
                </div>
            </div>
        </form>
    );
}