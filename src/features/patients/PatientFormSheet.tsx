import {useState, type ReactNode} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle} from "@/components/ui/sheet";
import {applyServerErrors} from "@/lib/forms";
import {useCreatePatient, type PatientListItem} from "./hooks";
import {Textarea} from "@/components/ui/textarea";
import {useMe} from "@/features/auth/useAuth";

const schema = z.object({
    first_name: z.string().trim().min(1, "Enter a first name"),
    last_name: z.string().trim().min(1, "Enter a last name"),
    id_number: z.string().trim(),
    date_of_birth: z.string(),
    sex: z.enum(["F", "M", "O", "U"]),
    phone: z.string().trim(),
    email: z.union([z.literal(""), z.string().trim().email("Enter a valid email address")]),
    address: z.string().trim(),
    medical_aid_name: z.string().trim(),
    medical_aid_number: z.string().trim(),
    medical_aid_dependant_code: z.string().trim().max(8, "Maximum 8 characters"),
    next_of_kin_name: z.string().trim(),
    next_of_kin_phone: z.string().trim(),
    allergies: z.string().trim(),
    chronic_conditions: z.string().trim(),
    current_medication: z.string().trim(),
    whatsapp_opt_in: z.boolean(),
    sms_opt_in: z.boolean(),
    email_opt_in: z.boolean(),
    marketing_opt_in: z.boolean(),
    consent_given: z.boolean().refine((value) => value, "Consent must be recorded before saving"),
});
type FormValues = z.infer<typeof schema>;

const EMPTY: FormValues = {
    first_name: "", last_name: "", id_number: "", date_of_birth: "", sex: "U",
    phone: "", email: "", address: "",
    medical_aid_name: "", medical_aid_number: "", medical_aid_dependant_code: "",
    next_of_kin_name: "", next_of_kin_phone: "",
    allergies: "", chronic_conditions: "", current_medication: "",
    whatsapp_opt_in: false, sms_opt_in: true, email_opt_in: true, marketing_opt_in: false,
    consent_given: false,
};

const FIELD_NAMES = Object.keys(EMPTY);

function Field({label, htmlFor, error, children}: {
    label: string;
    htmlFor: string;
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
        <section className="space-y-3 rounded-md border border-slate-200 bg-white p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
            {children}
        </section>
    );
}

function Check({label, ...props}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4" {...props} />
            {label}
        </label>
    );
}

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated?: (patient: PatientListItem) => void;
};

export default function PatientFormSheet({open, onOpenChange, onCreated}: Props) {
    const [formError, setFormError] = useState<string | null>(null);
    const create = useCreatePatient();
    const me = useMe();
    const showClinical = me.data?.role !== "receptionist";
    const {
        register, handleSubmit, reset, setError,
        formState: {errors},
    } = useForm<FormValues>({resolver: zodResolver(schema), defaultValues: EMPTY});

    function handleOpenChange(next: boolean) {
        if (!next) {
            reset(EMPTY);
            setFormError(null);
        }
        onOpenChange(next);
    }

    function onSubmit(values: FormValues) {
        setFormError(null);
        create.mutate(
            {...values, date_of_birth: values.date_of_birth || null},
            {
                onSuccess: (patient) => {
                    onCreated?.(patient);
                    handleOpenChange(false);
                },
                onError: (error) => setFormError(applyServerErrors(error, setError, FIELD_NAMES)),
            },
        );
    }

    const selectClass =
        "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

    return (
        <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetContent className="flex w-full flex-col gap-0 sm:max-w-2xl!">
                <SheetHeader className="border-b border-border">
                    <SheetTitle>New patient</SheetTitle>
                    <SheetDescription>Add a patient to your practice.</SheetDescription>
                </SheetHeader>

                <form
                    id="patient-form"
                    onSubmit={handleSubmit(onSubmit)}
                    noValidate
                    className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4"
                >
                    {formError && (
                        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{formError}</p>
                    )}

                    <Section title="Personal details">
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="First name" htmlFor="first_name" error={errors.first_name?.message}>
                                <Input id="first_name" autoComplete="off" {...register("first_name")} />
                            </Field>
                            <Field label="Last name" htmlFor="last_name" error={errors.last_name?.message}>
                                <Input id="last_name" autoComplete="off" {...register("last_name")} />
                            </Field>
                        </div>

                        <Field label="ID / passport number" htmlFor="id_number" error={errors.id_number?.message}>
                            <Input id="id_number" autoComplete="off" {...register("id_number")} />
                        </Field>

                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Date of birth" htmlFor="date_of_birth" error={errors.date_of_birth?.message}>
                                <Input id="date_of_birth" type="date" {...register("date_of_birth")} />
                            </Field>
                            <Field label="Sex" htmlFor="sex" error={errors.sex?.message}>
                                <select id="sex" className={selectClass} {...register("sex")}>
                                    <option value="U">Prefer not to say</option>
                                    <option value="F">Female</option>
                                    <option value="M">Male</option>
                                    <option value="O">Other</option>
                                </select>
                            </Field>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Mobile number" htmlFor="phone" error={errors.phone?.message}>
                                <Input id="phone" type="tel" placeholder="082 123 4567"
                                       autoComplete="off" {...register("phone")} />
                            </Field>
                            <Field label="Email" htmlFor="email" error={errors.email?.message}>
                                <Input id="email" type="email" autoComplete="off" {...register("email")} />
                            </Field>
                        </div>
                    </Section>

                    <Section title="Address & next of kin">
                        <Field label="Address" htmlFor="address" error={errors.address?.message}>
                            <Textarea id="address" rows={2} {...register("address")} />
                        </Field>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Next of kin" htmlFor="next_of_kin_name"
                                   error={errors.next_of_kin_name?.message}>
                                <Input id="next_of_kin_name" autoComplete="off" {...register("next_of_kin_name")} />
                            </Field>
                            <Field label="Next of kin phone" htmlFor="next_of_kin_phone"
                                   error={errors.next_of_kin_phone?.message}>
                                <Input id="next_of_kin_phone" type="tel"
                                       autoComplete="off" {...register("next_of_kin_phone")} />
                            </Field>
                        </div>
                    </Section>

                    <Section title="Medical aid">
                        <Field label="Scheme" htmlFor="medical_aid_name" error={errors.medical_aid_name?.message}>
                            <Input id="medical_aid_name" autoComplete="off" {...register("medical_aid_name")} />
                        </Field>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2">
                                <Field label="Member number" htmlFor="medical_aid_number"
                                       error={errors.medical_aid_number?.message}>
                                    <Input id="medical_aid_number"
                                           autoComplete="off" {...register("medical_aid_number")} />
                                </Field>
                            </div>
                            <Field label="Dependant code" htmlFor="medical_aid_dependant_code"
                                   error={errors.medical_aid_dependant_code?.message}>
                                <Input id="medical_aid_dependant_code"
                                       autoComplete="off" {...register("medical_aid_dependant_code")} />
                            </Field>
                        </div>
                    </Section>

                    {showClinical && (
                        <Section title="Clinical">
                            <Field label="Allergies" htmlFor="allergies" error={errors.allergies?.message}>
                                <Textarea id="allergies" rows={2} {...register("allergies")} />
                            </Field>
                            <Field label="Chronic conditions" htmlFor="chronic_conditions"
                                   error={errors.chronic_conditions?.message}>
                                <Textarea id="chronic_conditions" rows={2} {...register("chronic_conditions")} />
                            </Field>
                            <Field label="Current medication" htmlFor="current_medication"
                                   error={errors.current_medication?.message}>
                                <Textarea id="current_medication" rows={2} {...register("current_medication")} />
                            </Field>
                        </Section>
                    )}

                    <Section title="Contact preferences">
                        <div className="grid grid-cols-2 gap-2">
                            <Check label="WhatsApp reminders" {...register("whatsapp_opt_in")} />
                            <Check label="SMS reminders" {...register("sms_opt_in")} />
                            <Check label="Email reminders" {...register("email_opt_in")} />
                            <Check label="Marketing messages" {...register("marketing_opt_in")} />
                        </div>
                    </Section>

                    <div className="space-y-1.5 rounded-md border border-amber-200 bg-amber-50 p-3">
                        <label className="flex items-start gap-2 text-sm">
                            <input type="checkbox" className="mt-0.5 h-4 w-4" {...register("consent_given")} />
                            <span>The patient has consented to us storing and processing their personal information (POPIA).</span>
                        </label>
                        {errors.consent_given && <p className="text-sm text-red-600">{errors.consent_given.message}</p>}
                    </div>
                </form>

                <SheetFooter className="flex-row gap-2 border-t border-border px-4">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => handleOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" form="patient-form" className="flex-1" disabled={create.isPending}>
                        {create.isPending ? "Saving..." : "Save patient"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}