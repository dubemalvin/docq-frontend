import {useEffect, useState} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {Info} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle} from "@/components/ui/sheet";
import Field from "@/components/Field";
import ToggleRow from "@/components/ToggleRow";
import {useMe} from "@/features/auth/useAuth";
import type {AppointmentType} from "@/features/diary/hooks";
import {useSaveAppointmentType} from "@/features/settings/appointmentTypes";
import {applyServerErrors} from "@/lib/forms";

const schema = z.object({
    name: z.string().trim().min(1, "Enter a name"),
    duration_minutes: z
        .string()
        .regex(/^\d+$/, "Enter a whole number of minutes")
        .refine((v) => Number(v) >= 5 && Number(v) <= 480, "Enter between 5 and 480 minutes"),
    price: z.string().trim().regex(/^\d+(\.\d{1,2})?$/, "Enter an amount like 550 or 550.00"),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Pick a colour"),
    bookable_online: z.boolean(),
    is_active: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

const EMPTY: FormValues = {
    name: "", duration_minutes: "15", price: "0", color: "#10B981", bookable_online: true, is_active: true,
};
const FIELD_NAMES = Object.keys(EMPTY);

function toValues(t: AppointmentType): FormValues {
    return {
        name: t.name, duration_minutes: String(t.duration_minutes), price: t.price,
        color: t.color, bookable_online: t.bookable_online, is_active: t.is_active,
    };
}

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    appointmentType: AppointmentType | null; // null = add a new one
};

export default function AppointmentTypeFormSheet({open, onOpenChange, appointmentType}: Props) {
    const me = useMe();
    const currency = me.data?.practice?.currency ?? "ZAR";
    const [formError, setFormError] = useState<string | null>(null);
    const save = useSaveAppointmentType(appointmentType?.id);

    const {
        register, handleSubmit, reset, setError,
        formState: {errors},
    } = useForm<FormValues>({resolver: zodResolver(schema), defaultValues: EMPTY});

    useEffect(() => {
        if (!open) return;
        reset(appointmentType ? toValues(appointmentType) : EMPTY);
        setFormError(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, appointmentType?.id]);

    function onSubmit(values: FormValues) {
        setFormError(null);
        save.mutate(
            {...values, duration_minutes: Number(values.duration_minutes)},
            {
                onSuccess: () => onOpenChange(false),
                onError: (error) => setFormError(applyServerErrors(error, setError, FIELD_NAMES)),
            },
        );
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
                <SheetHeader className="border-b border-border">
                    <SheetTitle>{appointmentType ? "Edit appointment type" : "Add appointment type"}</SheetTitle>
                    <SheetDescription>What patients can book, and how long it takes.</SheetDescription>
                </SheetHeader>

                <form id="type-form" onSubmit={handleSubmit(onSubmit)} noValidate
                      className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
                    {formError && (
                        <p role="alert" className="rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {formError}
                        </p>
                    )}

                    <Field label="Name" htmlFor="name" error={errors.name?.message}>
                        <Input id="name" autoComplete="off" placeholder="Standard consultation" {...register("name")} />
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Duration (minutes)" htmlFor="duration_minutes"
                               error={errors.duration_minutes?.message}>
                            <Input id="duration_minutes" inputMode="numeric" {...register("duration_minutes")} />
                        </Field>
                        <Field label={`Price (${currency})`} htmlFor="price" error={errors.price?.message}>
                            <Input id="price" inputMode="decimal" {...register("price")} />
                        </Field>
                    </div>

                    <Field label="Diary colour" htmlFor="color" error={errors.color?.message}>
                        <input id="color" type="color"
                               className="h-9 w-24 cursor-pointer rounded-md border border-input bg-transparent p-1"
                               {...register("color")} />
                    </Field>

                    <div className="space-y-2">
                        <ToggleRow
                            title="Bookable online"
                            description="Patients can book this online"
                            {...register("bookable_online")}
                        />
                        <ToggleRow
                            title="Active"
                            description="Inactive types can't be booked by anyone"
                            {...register("is_active")}
                        />
                    </div>

                    {appointmentType && (
                        <p className="flex items-start gap-2 rounded-sm border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400"/>
                            Changing the duration only affects new bookings. Appointments already in the diary keep their length.
                        </p>
                    )}
                </form>

                <SheetFooter className="flex-row gap-2 border-t border-border px-4">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" form="type-form" className="flex-1" disabled={save.isPending}>
                        {save.isPending ? "Saving…" : "Save"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}