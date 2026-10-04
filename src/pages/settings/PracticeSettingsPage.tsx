import {useEffect, useState, type InputHTMLAttributes, type ReactNode} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {Bell, Building2, Check, CalendarCheck, Copy, Receipt, type LucideIcon} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import Field from "@/components/Field";
import {cn} from "@/lib/utils";
import {applyServerErrors} from "@/lib/forms";
import type {PracticeInput, PracticeSettings} from "@/features/settings/practice.ts";
import {usePractice, useUpdatePractice} from "@/features/settings/practice.ts";

const wholeNumber = (min: number, max: number) =>
    z.string().regex(/^\d+$/, "Enter a whole number")
        .refine((v) => Number(v) >= min && Number(v) <= max, `Enter a number between ${min} and ${max}`);

const schema = z
    .object({
        name: z.string().trim().min(1, "Enter the practice name"),
        email: z.union([z.literal(""), z.string().trim().email("Enter a valid email address")]),
        phone: z.string().trim(),
        address: z.string().trim(),
        website: z.string().trim(),
        billing_name: z.string().trim(),
        practice_number: z.string().trim(),
        vat_number: z.string().trim(),
        invoice_footer: z.string().trim(),
        online_booking_enabled: z.boolean(),
        booking_max_days_ahead: wholeNumber(1, 365),
        booking_min_notice_hours: wholeNumber(0, 168),
        first_reminder_hours: wholeNumber(1, 336),
        second_reminder_hours: wholeNumber(1, 336),
        whatsapp_enabled: z.boolean(),
        sms_enabled: z.boolean(),
        email_enabled: z.boolean(),
    })
    .refine((v) => Number(v.first_reminder_hours) > Number(v.second_reminder_hours), {
        message: "The first reminder must be earlier than the second",
        path: ["first_reminder_hours"],
    });
type FormValues = z.infer<typeof schema>;

function toValues(p: PracticeSettings): FormValues {
    return {
        name: p.name, email: p.email, phone: p.phone, address: p.address, website: p.website,
        billing_name: p.billing_name, practice_number: p.practice_number, vat_number: p.vat_number,
        invoice_footer: p.invoice_footer,
        online_booking_enabled: p.online_booking_enabled,
        booking_max_days_ahead: String(p.booking_max_days_ahead),
        booking_min_notice_hours: String(p.booking_min_notice_hours),
        first_reminder_hours: String(p.first_reminder_hours),
        second_reminder_hours: String(p.second_reminder_hours),
        whatsapp_enabled: p.whatsapp_enabled, sms_enabled: p.sms_enabled, email_enabled: p.email_enabled,
    };
}

function Section({icon: Icon, title, description, children}: {
    icon: LucideIcon;
    title: string;
    description?: string;
    children: ReactNode;
}) {
    return (
        <section className="min-w-0 rounded-sm border border-slate-200 bg-white shadow-sm">
            <header className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-slate-100 text-blue-600">
                    <Icon className="h-3.5 w-3.5"/>
                </div>
                <div className="min-w-0">
                    <h2 className="text-sm font-semibold leading-tight text-slate-900">{title}</h2>
                    {description && <p className="truncate text-xs leading-tight text-slate-500">{description}</p>}
                </div>
            </header>
            <div className="space-y-3 p-4">{children}</div>
        </section>
    );
}

/** Switch row. Wraps a real checkbox, so it works with register(). */
function Toggle({title, description, className, ...props}: InputHTMLAttributes<HTMLInputElement> & {
    title: string;
    description?: string;
}) {
    return (
        <label
            className={cn(
                "flex cursor-pointer items-center justify-between gap-3 rounded-sm border border-slate-200 px-3 py-2 transition-colors hover:bg-slate-50",
                className,
            )}
        >
            <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-slate-900">{title}</span>
                {description && <span className="block truncate text-xs text-slate-500">{description}</span>}
            </span>
            <span className="relative shrink-0">
                <input type="checkbox" className="peer sr-only" {...props} />
                <span className="block h-5 w-9 rounded-sm bg-slate-300 transition-colors peer-checked:bg-blue-600 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-600 peer-focus-visible:ring-offset-2"/>
                <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-sm bg-white shadow-sm transition-transform peer-checked:translate-x-4"/>
            </span>
        </label>
    );
}

export default function PracticeSettingsPage() {
    const practice = usePractice();
    const update = useUpdatePractice();
    const [formError, setFormError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);
    const [copied, setCopied] = useState(false);

    const {
        register, handleSubmit, reset, setError, watch,
        formState: {errors, isDirty},
    } = useForm<FormValues>({resolver: zodResolver(schema)});

    useEffect(() => {
        if (practice.data) reset(toValues(practice.data));
    }, [practice.data, reset]);

    const bookingOn = watch("online_booking_enabled");

    if (practice.isLoading) return <p className="text-sm text-slate-500">Loading…</p>;
    if (practice.isError || !practice.data) {
        return <p className="text-sm text-red-600">Couldn't load practice settings.</p>;
    }

    function onSubmit(values: FormValues) {
        setFormError(null);
        setSaved(false);
        const input: PracticeInput = {
            ...values,
            booking_max_days_ahead: Number(values.booking_max_days_ahead),
            booking_min_notice_hours: Number(values.booking_min_notice_hours),
            first_reminder_hours: Number(values.first_reminder_hours),
            second_reminder_hours: Number(values.second_reminder_hours),
        };
        update.mutate(input, {
            onSuccess: () => {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            },
            onError: (error) => setFormError(applyServerErrors(error, setError, Object.keys(values))),
        });
    }

    async function copyLink() {
        await navigator.clipboard.writeText(practice.data!.booking_url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex min-w-0 flex-col gap-3 lg:h-full">
            {formError && (
                <p role="alert" className="shrink-0 rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {formError}
                </p>
            )}

            {/* Two columns on xl so everything fits; scrolls only as a safety net on short screens */}
            <div className="grid min-h-0 min-w-0 gap-3 xl:flex-1 xl:grid-cols-2 xl:content-start xl:overflow-y-auto">
                <div className="min-w-0 space-y-3">
                    <Section
                        icon={Building2}
                        title="Practice details"
                        description={`How your practice appears to patients · ${practice.data.timezone} · ${practice.data.currency}`}
                    >
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Field label="Practice name" htmlFor="name" error={errors.name?.message}>
                                <Input id="name" {...register("name")} />
                            </Field>
                            <Field label="Website" htmlFor="website" error={errors.website?.message}>
                                <Input id="website" placeholder="https://" {...register("website")} />
                            </Field>
                            <Field label="Phone" htmlFor="phone" error={errors.phone?.message}>
                                <Input id="phone" type="tel" {...register("phone")} />
                            </Field>
                            <Field label="Email" htmlFor="email" error={errors.email?.message}>
                                <Input id="email" type="email" {...register("email")} />
                            </Field>
                        </div>
                        <Field label="Address" htmlFor="address" error={errors.address?.message}>
                            <Textarea id="address" rows={2} className="min-h-0 resize-none" {...register("address")} />
                        </Field>
                    </Section>

                    <Section icon={Receipt} title="Invoice details" description="Printed on invoices and receipts">
                        <div className="grid gap-3 sm:grid-cols-3">
                            <Field label="Billing name" htmlFor="billing_name" error={errors.billing_name?.message}>
                                <Input id="billing_name" {...register("billing_name")} />
                            </Field>
                            <Field label="Practice no." htmlFor="practice_number"
                                   error={errors.practice_number?.message}>
                                <Input id="practice_number" {...register("practice_number")} />
                            </Field>
                            <Field label="VAT no." htmlFor="vat_number" error={errors.vat_number?.message}>
                                <Input id="vat_number" {...register("vat_number")} />
                            </Field>
                        </div>
                        <Field label="Invoice footer" htmlFor="invoice_footer" error={errors.invoice_footer?.message}>
                            <Textarea id="invoice_footer" rows={2} className="min-h-0 resize-none"
                                      placeholder="Banking details, payment terms…" {...register("invoice_footer")} />
                        </Field>
                    </Section>
                </div>

                <div className="min-w-0 space-y-3">
                    <Section icon={CalendarCheck} title="Online booking" description="Let patients book without calling">
                        <Toggle
                            title="Allow patients to book online"
                            description="Turn this off to close your booking page"
                            {...register("online_booking_enabled")}
                        />
                        <div className={cn("space-y-3 transition-opacity", !bookingOn && "opacity-50")}>
                            <div className="flex min-w-0 items-center gap-2 rounded-sm border border-slate-200 bg-slate-50 p-1 pl-3">
                                <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                                    {practice.data.booking_url}
                                </span>
                                <Button type="button" variant="outline" size="sm" className="shrink-0 rounded-sm"
                                        onClick={copyLink}>
                                    {copied ? <Check className="mr-1.5 h-4 w-4"/> : <Copy className="mr-1.5 h-4 w-4"/>}
                                    {copied ? "Copied" : "Copy"}
                                </Button>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <Field label="Book up to (days ahead)" htmlFor="booking_max_days_ahead"
                                       error={errors.booking_max_days_ahead?.message}>
                                    <Input id="booking_max_days_ahead" inputMode="numeric"
                                           disabled={!bookingOn} {...register("booking_max_days_ahead")} />
                                </Field>
                                <Field label="Minimum notice (hours)" htmlFor="booking_min_notice_hours"
                                       error={errors.booking_min_notice_hours?.message}>
                                    <Input id="booking_min_notice_hours" inputMode="numeric"
                                           disabled={!bookingOn} {...register("booking_min_notice_hours")} />
                                </Field>
                            </div>
                        </div>
                    </Section>

                    <Section icon={Bell} title="Reminders" description="When and how patients are reminded">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Field label="First reminder (hours before)" htmlFor="first_reminder_hours"
                                   error={errors.first_reminder_hours?.message}>
                                <Input id="first_reminder_hours" inputMode="numeric"
                                       {...register("first_reminder_hours")} />
                            </Field>
                            <Field label="Second reminder (hours before)" htmlFor="second_reminder_hours"
                                   error={errors.second_reminder_hours?.message}>
                                <Input id="second_reminder_hours" inputMode="numeric"
                                       {...register("second_reminder_hours")} />
                            </Field>
                        </div>
                        <div className="space-y-1.5">
                            <p className="text-sm font-medium text-slate-900">Channels</p>
                            <div className="grid gap-2 sm:grid-cols-3">
                                <Toggle title="WhatsApp" {...register("whatsapp_enabled")} />
                                <Toggle title="SMS" {...register("sms_enabled")} />
                                <Toggle title="Email" {...register("email_enabled")} />
                            </div>
                            <p className="text-xs text-slate-500">WhatsApp needs WhatsApp Business set up first.</p>
                        </div>
                    </Section>
                </div>
            </div>

            {/* Pinned save bar: part of the layout, no negative margins */}
            <div className="flex shrink-0 items-center justify-between gap-3 rounded-sm border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
                <span
                    className={cn(
                        "min-w-0 truncate text-sm",
                        saved ? "flex items-center gap-1.5 font-medium text-emerald-700" : "text-slate-500",
                    )}
                    aria-live="polite"
                >
                    {saved
                        ? <><Check className="h-4 w-4"/>Changes saved</>
                        : isDirty ? "You have unsaved changes" : "All changes saved"}
                </span>
                <div className="flex shrink-0 gap-2">
                    <Button type="button" variant="outline" className="rounded-sm"
                            disabled={!isDirty || update.isPending}
                            onClick={() => practice.data && reset(toValues(practice.data))}>
                        Discard
                    </Button>
                    <Button type="submit" className="rounded-sm" disabled={!isDirty || update.isPending}>
                        {update.isPending ? "Saving…" : "Save changes"}
                    </Button>
                </div>
            </div>
        </form>
    );
}