import {useEffect, useState, type ReactNode} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {addHours, addMinutes, format, startOfHour} from "date-fns";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle} from "@/components/ui/sheet";
import {useMe} from "@/features/auth/useAuth";
import PatientPicker, {type ChosenPatient} from "@/features/patients/PatientPicker";
import {applyServerErrors} from "@/lib/forms";
import {useAppointmentTypes, useCreateAppointment, usePractitioners} from "./hooks";

const schema = z.object({
    patient: z.string().min(1, "Choose a patient"),
    practitioner: z.string().min(1, "Choose a practitioner"),
    appointment_type: z.string().min(1, "Choose an appointment type"),
    start_at: z.string().min(1, "Pick a date and time"),
    reason: z.string().trim(),
});
type FormValues = z.infer<typeof schema>;
const EMPTY: FormValues = {patient: "", practitioner: "", appointment_type: "", start_at: "", reason: ""};
const FIELD_NAMES = Object.keys(EMPTY);

const selectClass =
    "h-9 w-full rounded-sm border border-input bg-white px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

function Field({label, htmlFor, error, children}: {
    label: string;
    htmlFor?: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <Label htmlFor={htmlFor}>{label}</Label>
            {children}
            {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
    );
}

function Section({title, children}: { title: string; children: ReactNode }) {
    return (
        <section className="space-y-3 rounded-sm border border-slate-200 bg-white p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
            {children}
        </section>
    );
}

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialStart: Date | null;
    defaultPractitionerId: string;
};

export default function AppointmentFormSheet({open, onOpenChange, initialStart, defaultPractitionerId}: Props) {
    const me = useMe();
    const practitioners = usePractitioners();
    const types = useAppointmentTypes();
    const create = useCreateAppointment();
    const [patient, setPatient] = useState<ChosenPatient | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    const {
        register, handleSubmit, reset, setValue, setError, watch,
        formState: {errors},
    } = useForm<FormValues>({resolver: zodResolver(schema), defaultValues: EMPTY});

    // Live "ends at" hint from the chosen type and start time
    const typeId = watch("appointment_type");
    const startAt = watch("start_at");
    const chosenType = types.data?.find((t) => t.id === typeId);
    const startDate = startAt ? new Date(startAt) : null;
    const endHint =
        chosenType && startDate && !Number.isNaN(startDate.getTime())
            ? `Ends at ${format(addMinutes(startDate, chosenType.duration_minutes), "HH:mm")} · ${chosenType.duration_minutes} min`
            : null;

    // Fresh form every time the panel opens
    useEffect(() => {
        if (!open) return;
        const start = initialStart ?? addHours(startOfHour(new Date()), 1);
        reset({
            patient: "",
            practitioner: me.data?.practitioner_id || defaultPractitionerId || practitioners.data?.[0]?.id || "",
            appointment_type: types.data?.[0]?.id ?? "",
            start_at: format(start, "yyyy-MM-dd'T'HH:mm"),
            reason: "",
        });
        setPatient(null);
        setFormError(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, initialStart]);

    function onSubmit(values: FormValues) {
        setFormError(null);
        create.mutate(
            {...values, start_at: new Date(values.start_at).toISOString()},
            {
                onSuccess: () => onOpenChange(false),
                onError: (error) => setFormError(applyServerErrors(error, setError, FIELD_NAMES)),
            },
        );
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg!">
                <SheetHeader className="border-b border-border bg-white">
                    <SheetTitle>New appointment</SheetTitle>
                    <SheetDescription>Book a patient into the diary.</SheetDescription>
                </SheetHeader>

                <form
                    id="appointment-form"
                    onSubmit={handleSubmit(onSubmit)}
                    noValidate
                    className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4"
                >
                    {formError && (
                        <p role="alert" className="rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {formError}
                        </p>
                    )}

                    <Section title="Patient">
                        <Field label="Patient" error={errors.patient?.message}>
                            <PatientPicker
                                value={patient}
                                onChange={(chosen) => {
                                    setPatient(chosen);
                                    setValue("patient", chosen?.id ?? "", {shouldValidate: true});
                                }}
                            />
                        </Field>
                    </Section>

                    <Section title="Appointment">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Field label="Practitioner" htmlFor="practitioner" error={errors.practitioner?.message}>
                                <select id="practitioner" className={selectClass} {...register("practitioner")}>
                                    <option value="">Select…</option>
                                    {practitioners.data?.map((p) => (
                                        <option key={p.id} value={p.id}>{p.display_name}</option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Type" htmlFor="appointment_type" error={errors.appointment_type?.message}>
                                <select id="appointment_type" className={selectClass} {...register("appointment_type")}>
                                    <option value="">Select…</option>
                                    {types.data?.map((t) => (
                                        <option key={t.id} value={t.id}>{t.name} ({t.duration_minutes} min)</option>
                                    ))}
                                </select>
                            </Field>
                        </div>

                        <Field label="Date and time" htmlFor="start_at" error={errors.start_at?.message}>
                            <Input id="start_at" type="datetime-local" step={300} className="rounded-sm bg-white"
                                   {...register("start_at")} />
                            {endHint && <p className="text-xs text-slate-500">{endHint}</p>}
                        </Field>

                        <Field label="Reason for visit" htmlFor="reason" error={errors.reason?.message}>
                            <Input id="reason" autoComplete="off" className="rounded-sm bg-white"
                                   {...register("reason")} />
                        </Field>
                    </Section>
                </form>

                <SheetFooter className="flex-row gap-2 border-t border-border bg-white px-4 py-3">
                    <Button type="button" variant="outline" className="flex-1 rounded-sm"
                            onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" form="appointment-form" className="flex-1 rounded-sm"
                            disabled={create.isPending}>
                        {create.isPending ? "Booking…" : "Book appointment"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}