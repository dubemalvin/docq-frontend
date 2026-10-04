import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import {useParams} from "react-router";
import {format, parseISO} from "date-fns";
import {
    AlertTriangle, CalendarClock, Check, CreditCard, Download, FileText, FlaskConical, FolderOpen,
    HeartPulse, Image as ImageIcon, Mail, MessageCircle, Pencil, Phone, ShieldCheck, Trash2,
    Upload, User, Users, X, type LucideIcon, ChevronDown, Camera,
} from "lucide-react";
import {Button} from "@/components/ui/button";
import {ApiError} from "@/lib/api";
import {cn} from "@/lib/utils";
import type {Appointment, AppointmentStatus} from "@/features/diary/hooks";
import {usePatient, usePatientAppointments, usePatientSummary} from "@/features/patients/hooks";
import UploadFileSheet from "@/features/patients/UploadFileSheet";
import {
    CATEGORY_LABEL, fileUrl, formatBytes, useDeleteFile, usePatientFiles, type PatientFile,
} from "@/features/patients/files";
import PatientFormSheet from "@/features/patients/PatientFormSheet";
import PdfViewerSheet from "@/components/PdfViewerSheet";
import {PageHeader} from "@/components/PageHeader";
import {useMe} from "@/features/auth/useAuth";
import PatientNotes from "@/features/notes/PatientNotes";
import { photoUrl, useRemovePhoto, useUploadPhoto } from "@/features/patients/photo";

const SEX: Record<string, string> = {F: "Female", M: "Male", O: "Other", U: "Not specified"};

// South African numbers: 082... -> 2782...
function waLink(phone: string) {
    const digits = phone.replace(/\D/g, "");
    return `https://wa.me/${digits.startsWith("0") ? `27${digits.slice(1)}` : digits}`;
}

/** Base card. The body scrolls when the card is given a bounded height. */
function Card({icon: Icon, title, action, children, className}: {
    icon: LucideIcon;
    title: string;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section className={cn("flex min-h-0 flex-col rounded-sm border border-slate-200 bg-white shadow-sm", className)}>
            <header className="flex shrink-0 items-center gap-2.5 border-b border-slate-100 px-4 py-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-slate-100 text-blue-600">
                    <Icon className="h-3.5 w-3.5"/>
                </span>
                <h2 className="flex-1 text-sm font-semibold text-slate-900">{title}</h2>
                {action}
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        </section>
    );
}

/** Label/value rows inside a Card. */
function Panel({icon, title, children}: { icon: LucideIcon; title: string; children: ReactNode }) {
    return (
        <Card icon={icon} title={title}>
            <dl className="divide-y divide-slate-100 px-4">{children}</dl>
        </Card>
    );
}

function Row({label, children}: { label: string; children?: ReactNode }) {
    return (
        <div className="grid grid-cols-[6rem_1fr] items-baseline gap-3 py-2 sm:grid-cols-[7rem_1fr]">
            <dt className="text-xs text-slate-500">{label}</dt>
            <dd className="min-w-0 break-words text-sm text-slate-900">
                {children || <span className="text-slate-300">—</span>}
            </dd>
        </div>
    );
}

function PhoneActions({phone}: { phone: string }) {
    const base = "inline-flex h-6 items-center gap-1 rounded-sm border px-2 text-xs font-medium transition-colors";
    return (
        <span className="inline-flex gap-1.5">
            <a href={`tel:${phone}`} className={cn(base, "border-slate-200 text-slate-600 hover:bg-slate-50")}>
                <Phone className="h-3 w-3"/> Call
            </a>
            <a href={waLink(phone)} target="_blank" rel="noreferrer"
               className={cn(base, "border-green-200 bg-green-50 text-green-700 hover:bg-green-100")}>
                <MessageCircle className="h-3 w-3"/> WhatsApp
            </a>
        </span>
    );
}

function PhoneValue({phone}: { phone?: string | null }) {
    if (!phone) return null;
    return (
        <span className="flex flex-wrap items-center gap-2">
            <a href={`tel:${phone}`} className="text-blue-600 hover:underline">{phone}</a>
            <PhoneActions phone={phone}/>
        </span>
    );
}

function Chip({label, on}: { label: string; on: boolean }) {
    return (
        <span className={cn(
            "inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-xs font-medium",
            on ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-slate-50 text-slate-400",
        )}>
            {on ? <Check className="h-3 w-3"/> : <X className="h-3 w-3"/>}
            {label}
        </span>
    );
}

const VISIT_STYLE: Record<AppointmentStatus, { label: string; pill: string }> = {
    booked: {label: "Booked", pill: "bg-blue-50 text-blue-700"},
    confirmed: {label: "Confirmed", pill: "bg-teal-50 text-teal-700"},
    arrived: {label: "Arrived", pill: "bg-amber-50 text-amber-700"},
    in_consultation: {label: "In consultation", pill: "bg-blue-50 text-blue-700"},
    completed: {label: "Completed", pill: "bg-emerald-50 text-emerald-700"},
    no_show: {label: "No-show", pill: "bg-amber-50 text-amber-700"},
    cancelled: {label: "Cancelled", pill: "bg-slate-100 text-slate-600"},
};

function fileIcon(file: PatientFile): LucideIcon {
    if (file.category === "lab") return FlaskConical;
    if (file.content_type.startsWith("image/")) return ImageIcon;
    return FileText;
}

const isPdf = (file: PatientFile) =>
    file.content_type === "application/pdf" || file.original_name.toLowerCase().endsWith(".pdf");

function FilesCard({patientId, className}: { patientId: string; className?: string }) {
    const me = useMe();
    const files = usePatientFiles(patientId);
    const remove = useDeleteFile(patientId);
    const [uploadOpen, setUploadOpen] = useState(false);
    const [confirmId, setConfirmId] = useState<string | null>(null);
    const [viewing, setViewing] = useState<PatientFile | null>(null);

    // Mirrors the server rule: the practice manager, or whoever uploaded it
    const canDelete = (file: PatientFile) =>
        me.data?.role === "practice_manager" || file.uploaded_by === me.data?.id;
    const iconButton =
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700";
    const rowCls = "flex min-w-0 flex-1 items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-slate-50";

    return (
        <Card
            icon={FolderOpen}
            title="Files"
            className={className}
            action={
                <Button variant="outline" size="sm" className="h-7 rounded-sm px-2 text-xs"
                        onClick={() => setUploadOpen(true)}>
                    <Upload className="mr-1.5 h-3 w-3"/> Upload
                </Button>
            }
        >
            {files.isError && <p className="px-4 py-3 text-sm text-red-600">Couldn't load files.</p>}
            {files.isLoading && <p className="px-4 py-3 text-sm text-slate-400">Loading…</p>}
            {files.data?.length === 0 && <p className="px-4 py-3 text-sm text-slate-400">No files yet.</p>}
            {remove.isError && <p className="px-4 py-2 text-sm text-red-600">{remove.error.message}</p>}

            <ul className="divide-y divide-slate-100">
                {files.data?.map((file) => {
                    const Icon = fileIcon(file);
                    const body = (
                        <>
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-slate-100 text-slate-500">
                                <Icon className="h-4 w-4"/>
                            </span>
                            <span className="min-w-0">
                                <span className="block truncate text-sm font-medium text-slate-900">
                                    {file.original_name}
                                </span>
                                <span className="block truncate text-xs text-slate-500">
                                    {CATEGORY_LABEL[file.category]} · {formatBytes(file.size)} ·{" "}
                                    {format(parseISO(file.created_at), "d MMM yyyy")}
                                </span>
                            </span>
                        </>
                    );

                    return (
                        <li key={file.id} className="flex items-center pr-2" title={file.description || undefined}>
                            {isPdf(file) ? (
                                <button type="button" className={rowCls} onClick={() => setViewing(file)}>
                                    {body}
                                </button>
                            ) : (
                                <a href={fileUrl(patientId, file.id, true)} target="_blank" rel="noreferrer"
                                   className={rowCls}>
                                    {body}
                                </a>
                            )}

                            <a href={fileUrl(patientId, file.id, false)}
                               aria-label={`Download ${file.original_name}`} className={iconButton}>
                                <Download className="h-4 w-4"/>
                            </a>

                            {canDelete(file) &&
                                (confirmId === file.id ? (
                                    <span className="flex items-center gap-1 text-xs">
                                        <button
                                            className="rounded-sm bg-red-600 px-2 py-1 font-medium text-white disabled:opacity-50"
                                            disabled={remove.isPending}
                                            onClick={() => remove.mutate(file.id, {onSettled: () => setConfirmId(null)})}
                                        >
                                            Remove
                                        </button>
                                        <button className="px-1 py-1 text-slate-500 hover:text-slate-800"
                                                onClick={() => setConfirmId(null)}>
                                            No
                                        </button>
                                    </span>
                                ) : (
                                    <button className={iconButton} aria-label={`Remove ${file.original_name}`}
                                            onClick={() => setConfirmId(file.id)}>
                                        <Trash2 className="h-4 w-4"/>
                                    </button>
                                ))}
                        </li>
                    );
                })}
            </ul>

            <UploadFileSheet open={uploadOpen} onOpenChange={setUploadOpen} patientId={patientId}/>
            <PdfViewerSheet
                open={viewing !== null}
                onOpenChange={(open) => !open && setViewing(null)}
                title={viewing?.original_name ?? "Document"}
                viewUrl={viewing ? fileUrl(patientId, viewing.id, true) : ""}
                downloadUrl={viewing ? fileUrl(patientId, viewing.id, false) : ""}
            />
        </Card>
    );
}
function AllergyBanner({text}: { text: string }) {
    const [open, setOpen] = useState(false);
    const count = text.split(/[\n,;]+/).filter((s) => s.trim()).length;

    return (
        <div role="alert" className="shrink-0 rounded-sm border border-red-200 bg-red-50 text-red-900">
            <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left"
            >
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-600"/>
                <span className="shrink-0 text-sm font-semibold">
                    Allergies{count > 1 ? ` (${count})` : ""}
                </span>
                {!open && <span className="min-w-0 flex-1 truncate text-sm text-red-800/80">{text.replace(/\s*\n\s*/g, ", ")}</span>}
                {open && <span className="flex-1"/>}
                <ChevronDown className={cn("h-4 w-4 shrink-0 text-red-600 transition-transform", open && "rotate-180")}/>
            </button>
            {open && (
                <p className="whitespace-pre-line border-t border-red-200 px-3 py-2 text-sm">{text}</p>
            )}
        </div>
    );
}

function SummaryCard({ patientId, name, hasPhoto, photoVersion }: {
  patientId: string; name: string; hasPhoto: boolean; photoVersion: string | null;
}) {
  const { data } = usePatientSummary(patientId);
  const upload = useUploadPhoto(patientId);
  const remove = useRemovePhoto(patientId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [broken, setBroken] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  useEffect(() => setBroken(false), [photoVersion]);

  function onPick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // so the same file can be chosen again
    if (!file) return;
    setPhotoError(null);
    upload.mutate(file, { onError: (error) => setPhotoError(error.message) });
  }

  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
  const next = data?.next_appointment;
  const stats: [string, string][] = [
    ["Patient since", data ? format(parseISO(data.patient_since), "MMM yyyy") : "—"],
    ["Total visits", data ? String(data.total_visits) : "—"],
    ["Last visit", data?.last_visit ? format(parseISO(data.last_visit), "d MMM yyyy") : "—"],
    ["No-shows", data ? String(data.no_shows) : "—"],
    ["Balance", data?.balance ?? "—"],
  ];

  return (
    <section className="rounded-sm border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col items-center gap-3 px-4 pt-5 text-center">
        <div className="relative">
          {hasPhoto && !broken ? (
            <img
              src={photoUrl(patientId, photoVersion)}
              alt={name}
              onError={() => setBroken(true)}
              className="h-24 w-24 rounded-sm object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-sm bg-slate-900 text-3xl font-semibold text-white">
              {initials}
            </div>
          )}
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
          <button
            type="button"
            aria-label={hasPhoto ? "Change photo" : "Add photo"}
            disabled={upload.isPending}
            onClick={() => inputRef.current?.click()}
            className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-sm border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            <Camera className="h-4 w-4" />
          </button>
        </div>

        {photoError && <p role="alert" className="text-xs text-red-600">{photoError}</p>}
        {upload.isPending ? (
          <p className="text-xs text-slate-500">Uploading…</p>
        ) : hasPhoto ? (
          <button
            type="button"
            className="text-xs text-slate-500 hover:text-red-600 hover:underline"
            disabled={remove.isPending}
            onClick={() => remove.mutate()}
          >
            Remove photo
          </button>
        ) : (
          <p className="text-xs text-slate-500">No photo added yet</p>
        )}
      </div>

      {next ? (
        <div className="m-4 rounded-sm border border-blue-200 bg-blue-50 p-3">
          <p className="text-xs font-medium text-blue-700">Next appointment</p>
          <p className="text-sm font-semibold text-slate-900">{format(parseISO(next.start_at), "EEE d MMM, HH:mm")}</p>
          <p className="text-xs text-slate-600">{next.type_name}, {next.practitioner_name}</p>
        </div>
      ) : (
        <div className="m-4 rounded-sm border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-medium text-slate-500">Next appointment</p>
          <p className="text-sm text-slate-500">{data ? "Nothing booked" : "Loading…"}</p>
        </div>
      )}

      <dl className="divide-y divide-slate-100 border-t border-slate-100 px-4">
        {stats.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between py-2.5">
            <dt className="text-xs text-slate-500">{label}</dt>
            <dd className="text-sm font-medium text-slate-900">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function VisitRow({a}: { a: Appointment }) {
    const start = parseISO(a.start_at);
    const style = VISIT_STYLE[a.status];
    return (
        <li className="flex items-center gap-3 px-4 py-2.5" title={format(start, "d MMMM yyyy, HH:mm")}>
            <span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-sm border border-slate-200 bg-slate-50 leading-none">
                <span className="text-sm font-semibold text-slate-900">{format(start, "dd")}</span>
                <span className="mt-0.5 text-[10px] text-slate-500">{format(start, "MMM")}</span>
            </span>
            <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-slate-900">{a.type_name}</span>
                <span className="block truncate text-xs text-slate-500">
                    {format(start, "HH:mm")} · {a.practitioner_name}
                </span>
            </span>
            <span className={cn("shrink-0 rounded-sm px-2 py-0.5 text-xs font-medium", style.pill)}>
                {style.label}
            </span>
        </li>
    );
}

function VisitsCard({patientId, className}: { patientId: string; className?: string }) {
    const {data, isLoading, isError} = usePatientAppointments(patientId);
    const empty = (text: string) => <p className="px-4 py-3 text-sm text-slate-400">{text}</p>;
    const label = "sticky top-0 z-10 border-y border-slate-100 bg-slate-50 px-4 py-1.5 text-xs font-medium text-slate-500";
    return (
        <Card icon={CalendarClock} title="Appointments" className={className}>
            {isError && <p className="px-4 py-3 text-sm text-red-600">Couldn't load appointments.</p>}
            <p className={label}>Upcoming</p>
            {isLoading ? empty("Loading…") : data?.upcoming.length ? (
                <ul className="divide-y divide-slate-100">{data.upcoming.map((a) => <VisitRow key={a.id} a={a}/>)}</ul>
            ) : empty("No upcoming appointments")}
            <p className={label}>History</p>
            {isLoading ? empty("Loading…") : data?.history.length ? (
                <ul className="divide-y divide-slate-100">{data.history.map((a) => <VisitRow key={a.id} a={a}/>)}</ul>
            ) : empty("No past appointments")}
        </Card>
    );
}

export default function PatientProfilePage() {
    const me = useMe();
    const {id} = useParams();
    const [editOpen, setEditOpen] = useState(false);
    const {data: patient, isLoading, error} = usePatient(id);

    if (isLoading) {
        return (
            <div className="flex flex-col gap-3 xl:h-full">
                <div className="h-12 w-64 animate-pulse rounded-sm bg-slate-200"/>
                <div className="grid gap-3 xl:flex-1 xl:grid-cols-[18rem_1fr_24rem]">
                    {Array.from({length: 3}).map((_, i) => (
                        <div key={i} className="h-48 animate-pulse rounded-sm bg-slate-200 xl:h-auto"/>
                    ))}
                </div>
            </div>
        );
    }

    if (error || !patient) {
        const notFound = error instanceof ApiError && error.status === 404;
        return (
            <div className="space-y-3">
                <PageHeader icon={User} title="Patient" backHref="/patients"/>
                <p className="rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {notFound ? "Patient not found." : "Couldn't load this patient."}
                </p>
            </div>
        );
    }

    const hasClinical = patient.allergies !== undefined; // false for receptionists
    const hasMedicalAid = patient.medical_aid_name || patient.medical_aid_number;
    const showNotes = me.data?.role === "doctor" || me.data?.role === "nurse";

    const subtitle = [
        patient.age != null && `${patient.age} years`,
        SEX[patient.sex],
        patient.id_number && `ID ${patient.id_number}`,
    ].filter(Boolean).join(" · ");

    const actions = [
        {label: "Edit", icon: Pencil, onClick: () => setEditOpen(true), variant: "secondary" as const},
        ...(patient.phone
            ? [
                {label: "Call", icon: Phone, href: `tel:${patient.phone}`},
                {label: "WhatsApp", icon: MessageCircle, href: waLink(patient.phone), variant: "secondary" as const},
            ]
            : []),
        ...(patient.email
            ? [{label: "Email", icon: Mail, href: `mailto:${patient.email}`, variant: "secondary" as const}]
            : []),
    ];

    return (
        <div className="flex flex-col gap-2 xl:h-full">
            <div className="shrink-0">
                <PageHeader
                    icon={User}
                    title={patient.full_name}
                    subtitle={subtitle}
                    backHref="/patients"
                    actions={actions}
                    badge={
                        !patient.is_active && (
                            <span className="rounded-sm bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                                Archived
                            </span>
                        )
                    }
                />
            </div>

            {patient.allergies && <AllergyBanner text={patient.allergies}/>}

            {/* Frame: three columns on xl, fills the screen. Each card scrolls inside itself. */}
            <div className="flex flex-col gap-3 xl:min-h-0 xl:flex-1 xl:flex-row">
                {/* Left: summary + files */}
                <aside className="flex flex-col gap-3 xl:min-h-0 xl:w-72 xl:shrink-0">
                    <SummaryCard
                      patientId={patient.id}
                      name={patient.full_name}
                      hasPhoto={patient.has_photo}
                      photoVersion={patient.photo_updated_at}
                    />
                    <FilesCard patientId={patient.id} className="max-h-80 xl:max-h-none xl:flex-1"/>
                </aside>

                {/* Middle: details above, appointments below */}
                <div className="flex min-w-0 flex-col gap-3 xl:min-h-0 xl:flex-1">
                    <div className="xl:min-h-0 xl:flex-[3] xl:overflow-y-auto">
                        <div className="grid gap-3 lg:grid-cols-2 lg:items-start">
                            {/* Left stack */}
                            <div className="space-y-3">
                                <Panel icon={User} title="Personal details">
                                    <Row label="Date of birth">
                                        {patient.date_of_birth && format(parseISO(patient.date_of_birth), "d MMM yyyy")}
                                    </Row>
                                    <Row label="ID number">{patient.id_number}</Row>
                                    <Row label="Mobile"><PhoneValue phone={patient.phone}/></Row>
                                    <Row label="Email">
                                        {patient.email && (
                                            <a href={`mailto:${patient.email}`} className="text-blue-600 hover:underline">
                                                {patient.email}
                                            </a>
                                        )}
                                    </Row>
                                    <Row label="Address">
                                        {patient.address && <span className="whitespace-pre-line">{patient.address}</span>}
                                    </Row>
                                </Panel>

                                <Panel icon={Users} title="Next of kin">
                                    <Row label="Name">{patient.next_of_kin_name}</Row>
                                    <Row label="Phone"><PhoneValue phone={patient.next_of_kin_phone}/></Row>
                                </Panel>
                            </div>

                            {/* Right stack */}
                            <div className="space-y-3">
                                <section className="rounded-sm bg-slate-900 text-white shadow-sm">
                                    <header className="flex items-center gap-2.5 border-b border-white/10 px-4 py-2.5">
                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-white/10">
                                            <CreditCard className="h-3.5 w-3.5"/>
                                        </span>
                                        <h2 className="text-sm font-semibold">Medical aid</h2>
                                    </header>
                                    {hasMedicalAid ? (
                                        <dl className="space-y-2 p-3">
                                            <div>
                                                <dt className="text-xs text-slate-400">Scheme</dt>
                                                <dd className="text-base font-semibold">{patient.medical_aid_name || "—"}</dd>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <dt className="text-xs text-slate-400">Member number</dt>
                                                    <dd className="break-all font-mono text-sm">
                                                        {patient.medical_aid_number || "—"}
                                                    </dd>
                                                </div>
                                                <div>
                                                    <dt className="text-xs text-slate-400">Dependant code</dt>
                                                    <dd className="font-mono text-sm">
                                                        {patient.medical_aid_dependant_code || "—"}
                                                    </dd>
                                                </div>
                                            </div>
                                        </dl>
                                    ) : (
                                        <p className="px-4 py-3 text-sm text-slate-400">
                                            No medical aid on file. Private patient.
                                        </p>
                                    )}
                                </section>

                                {hasClinical && (
                                    <Panel icon={HeartPulse} title="Clinical">
                                        <Row label="Conditions">
                                            {patient.chronic_conditions && (
                                                <span className="whitespace-pre-line">{patient.chronic_conditions}</span>
                                            )}
                                        </Row>
                                        <Row label="Medication">
                                            {patient.current_medication && (
                                                <span className="whitespace-pre-line">{patient.current_medication}</span>
                                            )}
                                        </Row>
                                    </Panel>
                                )}

                                <Panel icon={ShieldCheck} title="Consent & preferences">
                                    <Row label="POPIA consent">
                                        <span className={cn(
                                            "inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-xs font-medium",
                                            patient.consent_given_at
                                                ? "bg-emerald-50 text-emerald-700"
                                                : "bg-amber-50 text-amber-700",
                                        )}>
                                            <span className={cn(
                                                "h-1.5 w-1.5 rounded-sm",
                                                patient.consent_given_at ? "bg-emerald-500" : "bg-amber-500",
                                            )}/>
                                            {patient.consent_given_at
                                                ? `Given ${format(parseISO(patient.consent_given_at), "d MMM yyyy")}`
                                                : "Not recorded"}
                                        </span>
                                    </Row>
                                    <Row label="Contact by">
                                        <span className="flex flex-wrap gap-1.5">
                                            <Chip label="WhatsApp" on={!!patient.whatsapp_opt_in}/>
                                            <Chip label="SMS" on={!!patient.sms_opt_in}/>
                                            <Chip label="Email" on={!!patient.email_opt_in}/>
                                            <Chip label="Marketing" on={!!patient.marketing_opt_in}/>
                                        </span>
                                    </Row>
                                </Panel>
                            </div>
                        </div>
                    </div>

                    <VisitsCard patientId={patient.id} className="max-h-96 xl:max-h-none xl:flex-[2]"/>
                </div>

                {/* Right: notes */}
                {showNotes && (
                    <PatientNotes patientId={patient.id} className="h-[32rem] shrink-0 xl:h-auto xl:w-96"/>
                )}
            </div>

            <PatientFormSheet open={editOpen} onOpenChange={setEditOpen} patient={patient}/>
        </div>
    );
}
