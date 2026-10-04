import {useState, type ReactNode} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import ToggleRow from "@/components/ToggleRow";
import {ApiError} from "@/lib/api";
import {applyServerErrors} from "@/lib/forms";
import type {paymentPayload} from "./PaymentStep";
import {useBook, type BookingResult} from "./hooks";

const schema = z.object({
    first_name: z.string().trim().min(1, "Enter your first name"),
    last_name: z.string().trim().min(1, "Enter your last name"),
    phone: z.string().trim().min(1, "Enter your mobile number"),
    email: z.union([z.literal(""), z.string().trim().email("Enter a valid email address")]),
    reason: z.string().trim(),
    whatsapp_opt_in: z.boolean(),
    consent: z.boolean().refine((value) => value, "Please agree to continue"),
});
type FormValues = z.infer<typeof schema>;
const EMPTY: FormValues = {
    first_name: "", last_name: "", phone: "", email: "", reason: "", whatsapp_opt_in: false, consent: false,
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

type Props = {
    slug: string;
    practiceName: string;
    practitionerId: string;
    typeId: string;
    slot: string; // ISO with the practice's offset, sent to the server unchanged
    /** Medical aid details from the payment step, or null for a private patient. */
    payment: ReturnType<typeof paymentPayload>;
    onBooked: (result: BookingResult) => void;
    onSlotTaken: () => void;
};

export default function BookingDetailsForm({
                                               slug, practiceName, practitionerId, typeId, slot, payment, onBooked, onSlotTaken,
                                           }: Props) {
    const [formError, setFormError] = useState<string | null>(null);
    const book = useBook(slug);
    const {
        register, handleSubmit, setError,
        formState: {errors},
    } = useForm<FormValues>({resolver: zodResolver(schema), defaultValues: EMPTY});

    function onSubmit(values: FormValues) {
        setFormError(null);
        book.mutate(
            {
                ...values,
                ...(payment ?? {}), // medical_aid_* fields, left out for private patients
                practitioner: practitionerId,
                appointment_type: typeId,
                start_at: slot,
            },
            {
                onSuccess: onBooked,
                onError: (error) => {
                    if (error instanceof ApiError && error.status === 409) return onSlotTaken(); // someone else got it first
                    setFormError(applyServerErrors(error, setError, FIELD_NAMES));
                },
            },
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {formError && (
                <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
                <Field label="First name" htmlFor="first_name" error={errors.first_name?.message}>
                    <Input id="first_name" autoComplete="given-name" {...register("first_name")} />
                </Field>
                <Field label="Last name" htmlFor="last_name" error={errors.last_name?.message}>
                    <Input id="last_name" autoComplete="family-name" {...register("last_name")} />
                </Field>
                <Field label="Mobile number" htmlFor="phone" error={errors.phone?.message}>
                    <Input id="phone" type="tel" autoComplete="tel" placeholder="082 123 4567" {...register("phone")} />
                </Field>
                <Field label="Email (optional)" htmlFor="email" error={errors.email?.message}>
                    <Input id="email" type="email" autoComplete="email" {...register("email")} />
                </Field>
            </div>

            <Field label="Reason for visit (optional)" htmlFor="reason" error={errors.reason?.message}>
                <Input id="reason" autoComplete="off" placeholder="E.g. cough, check-up, repeat prescription"
                       {...register("reason")} />
            </Field>

            <ToggleRow
                title="Send my reminders on WhatsApp too"
                description="We'll still send SMS or email reminders where we can"
                {...register("whatsapp_opt_in")}
            />

            <div className="space-y-1.5">
                <ToggleRow
                    title="I agree to the use of my information"
                    description={`${practiceName} will store and use my personal information to manage my appointments (POPIA).`}
                    {...register("consent")}
                />
                {errors.consent && <p className="text-sm text-red-600">{errors.consent.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={book.isPending}>
                {book.isPending ? "Booking…" : "Confirm booking"}
            </Button>
        </form>
    );
}