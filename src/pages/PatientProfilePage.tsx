import type {ReactNode} from "react";
import {useParams} from "react-router";
import {format, parseISO} from "date-fns";
import {AlertTriangle, Check, Mail, MessageCircle, Phone, User, X} from "lucide-react";
import {ApiError} from "@/lib/api";
import {cn} from "@/lib/utils";
import {usePatient} from "@/features/patients/hooks";
import {PageHeader} from "@/components/PageHeader";

const SEX: Record<string, string> = {F: "Female", M: "Male", O: "Other", U: "Not specified"};

// South African numbers: 082... -> 2782...
function waLink(phone: string) {
    const digits = phone.replace(/\D/g, "");
    return `https://wa.me/${digits.startsWith("0") ? `27${digits.slice(1)}` : digits}`;
}

function Panel({title, children, className}: { title: string; children: ReactNode; className?: string }) {
    return (
        <section
            className={cn(
                "flex min-h-0 flex-col rounded-sm border border-slate-200 bg-white shadow-sm",
                className
            )}
        >
            <h2 className="shrink-0 border-b border-slate-100 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {title}
            </h2>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
        </section>
    );
}

function Detail({label, children, className}: { label: string; children?: ReactNode; className?: string }) {
    return (
        <div className={cn("min-w-0", className)}>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</dt>
            <dd className="mt-0.5 break-words text-sm text-slate-900">
                {children || <span className="text-slate-300">—</span>}
            </dd>
        </div>
    );
}

function Channel({label, on}: { label: string; on: boolean }) {
    return (
        <div
            className={cn(
                "flex items-center justify-between rounded-sm border px-3 py-2 text-sm",
                on ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-slate-50 text-slate-400"
            )}
        >
            {label}
            {on ? <Check className="h-4 w-4"/> : <X className="h-4 w-4"/>}
        </div>
    );
}

export default function PatientProfilePage() {
    const {id} = useParams();
    const {data: patient, isLoading, error} = usePatient(id);

    if (isLoading) {
        return (
            <div className="flex flex-col gap-3 lg:h-full">
                <div className="h-12 w-64 animate-pulse rounded-sm bg-slate-200"/>
                <div className="grid gap-3 lg:flex-1 lg:grid-cols-3 lg:grid-rows-2">
                    {Array.from({length: 6}).map((_, i) => (
                        <div key={i} className="h-40 animate-pulse rounded-sm bg-slate-200 lg:h-auto"/>
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

    const subtitle = [patient.age != null && `${patient.age} years`, SEX[patient.sex]]
        .filter(Boolean)
        .join(" · ");

    const actions = [
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
        <div className="flex flex-col gap-3 lg:h-full">
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

            {patient.allergies && (
                <div
                    role="alert"
                    className="flex shrink-0 items-start gap-3 rounded-sm border border-red-200 bg-red-50 p-3 text-red-900"
                >
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0"/>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold">Allergies</p>
                        <p className="whitespace-pre-line text-sm">{patient.allergies}</p>
                    </div>
                </div>
            )}

            {/* Fills the remaining screen on lg+; panels scroll internally */}
            <div className="grid gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-3 lg:grid-rows-2">
                <Panel title="Identity">
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
                        <Detail label="Age">{patient.age != null ? `${patient.age} years` : undefined}</Detail>
                        <Detail label="Sex">{SEX[patient.sex]}</Detail>
                        <Detail label="Date of birth">
                            {patient.date_of_birth && format(parseISO(patient.date_of_birth), "d MMM yyyy")}
                        </Detail>
                        <Detail label="ID number">{patient.id_number}</Detail>
                    </dl>
                </Panel>

                <Panel title="Contact">
                    <dl className="space-y-4">
                        <Detail label="Mobile">
                            {patient.phone && (
                                <a href={`tel:${patient.phone}`} className="text-blue-600 hover:underline">
                                    {patient.phone}
                                </a>
                            )}
                        </Detail>
                        <Detail label="Email">
                            {patient.email && (
                                <a href={`mailto:${patient.email}`} className="text-blue-600 hover:underline">
                                    {patient.email}
                                </a>
                            )}
                        </Detail>
                        <Detail label="Address">
                            <span className="whitespace-pre-line">{patient.address}</span>
                        </Detail>
                    </dl>
                </Panel>

                <section className="flex min-h-0 flex-col rounded-sm bg-slate-900 text-white shadow-sm">
                    <h2 className="shrink-0 border-b border-white/10 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Medical aid
                    </h2>
                    <div className="min-h-0 flex-1 overflow-y-auto p-4">
                        {hasMedicalAid ? (
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-[11px] uppercase tracking-wide text-slate-400">Scheme</dt>
                                    <dd className="mt-0.5 text-base font-semibold">{patient.medical_aid_name || "—"}</dd>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <dt className="text-[11px] uppercase tracking-wide text-slate-400">Member number</dt>
                                        <dd className="mt-0.5 break-all font-mono text-sm">
                                            {patient.medical_aid_number || "—"}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-[11px] uppercase tracking-wide text-slate-400">Dependant code</dt>
                                        <dd className="mt-0.5 font-mono text-sm">
                                            {patient.medical_aid_dependant_code || "—"}
                                        </dd>
                                    </div>
                                </div>
                            </dl>
                        ) : (
                            <p className="text-sm text-slate-400">No medical aid on file. Private patient.</p>
                        )}
                    </div>
                </section>

                {hasClinical && (
                    <Panel title="Clinical">
                        <dl className="space-y-4">
                            <Detail label="Chronic conditions">
                                <span className="whitespace-pre-line">{patient.chronic_conditions}</span>
                            </Detail>
                            <Detail label="Current medication">
                                <span className="whitespace-pre-line">{patient.current_medication}</span>
                            </Detail>
                        </dl>
                    </Panel>
                )}

                <Panel title="Next of kin">
                    <dl className="space-y-4">
                        <Detail label="Name">{patient.next_of_kin_name}</Detail>
                        <Detail label="Phone">
                            {patient.next_of_kin_phone && (
                                <a href={`tel:${patient.next_of_kin_phone}`} className="text-blue-600 hover:underline">
                                    {patient.next_of_kin_phone}
                                </a>
                            )}
                        </Detail>
                    </dl>
                </Panel>

                <Panel title="Consent & preferences" className={hasClinical ? undefined : "lg:col-span-2"}>
                    <div
                        className={cn(
                            "rounded-sm border px-3 py-2 text-sm",
                            patient.consent_given_at
                                ? "border-green-200 bg-green-50 text-green-800"
                                : "border-amber-200 bg-amber-50 text-amber-800"
                        )}
                    >
                        <p className="font-semibold">POPIA consent</p>
                        <p className="text-xs">
                            {patient.consent_given_at
                                ? `Given ${format(parseISO(patient.consent_given_at), "d MMM yyyy")}`
                                : "Not recorded"}
                        </p>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                        <Channel label="WhatsApp" on={!!patient.whatsapp_opt_in}/>
                        <Channel label="SMS" on={!!patient.sms_opt_in}/>
                        <Channel label="Email" on={!!patient.email_opt_in}/>
                        <Channel label="Marketing" on={!!patient.marketing_opt_in}/>
                    </div>
                </Panel>
            </div>
        </div>
    );
}