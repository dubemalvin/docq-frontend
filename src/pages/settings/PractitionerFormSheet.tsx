import {useEffect, useState} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle} from "@/components/ui/sheet";
import Field from "@/components/Field";
import ToggleRow from "@/components/ToggleRow";
import {applyServerErrors} from "@/lib/forms";
import {useSavePractitioner, type PractitionerFull} from "@/features/settings/practitioners";
import {useStaff} from "@/features/settings/users";

const schema = z.object({
    title: z.string().trim(),
    first_name: z.string().trim().min(1, "Enter a first name"),
    last_name: z.string().trim().min(1, "Enter a last name"),
    specialty: z.string().trim(),
    registration_number: z.string().trim(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Pick a colour"),
    slot_minutes: z.string(),
    user: z.string(),
    bookable_online: z.boolean(),
    is_active: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

const EMPTY: FormValues = {
    title: "Dr", first_name: "", last_name: "", specialty: "", registration_number: "",
    color: "#3B82F6", slot_minutes: "15", user: "", bookable_online: true, is_active: true,
};
const FIELD_NAMES = Object.keys(EMPTY);
const SLOT_OPTIONS = [5, 10, 15, 20, 30, 45, 60];

const selectClass =
    "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

function toValues(p: PractitionerFull): FormValues {
    return {
        title: p.title, first_name: p.first_name, last_name: p.last_name, specialty: p.specialty,
        registration_number: p.registration_number, color: p.color, slot_minutes: String(p.slot_minutes),
        user: p.user ?? "", bookable_online: p.bookable_online, is_active: p.is_active,
    };
}

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    practitioner: PractitionerFull | null; // null = add a new one
};

export default function PractitionerFormSheet({open, onOpenChange, practitioner}: Props) {
    const [formError, setFormError] = useState<string | null>(null);
    const save = useSavePractitioner(practitioner?.id);
    const staff = useStaff();
    const loginOptions = staff.data?.filter((u) => u.is_active && (u.role === "doctor" || u.role === "nurse"));

    const {
        register, handleSubmit, reset, setError,
        formState: {errors},
    } = useForm<FormValues>({resolver: zodResolver(schema), defaultValues: EMPTY});

    useEffect(() => {
        if (!open) return;
        reset(practitioner ? toValues(practitioner) : EMPTY);
        setFormError(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, practitioner?.id]);

    function onSubmit(values: FormValues) {
        setFormError(null);
        save.mutate(
            {...values, slot_minutes: Number(values.slot_minutes), user: values.user || null},
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
                    <SheetTitle>{practitioner ? "Edit practitioner" : "Add practitioner"}</SheetTitle>
                    <SheetDescription>Doctors and other bookable clinicians.</SheetDescription>
                </SheetHeader>

                <form id="practitioner-form" onSubmit={handleSubmit(onSubmit)} noValidate
                      className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
                    {formError && (
                        <p role="alert" className="rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {formError}
                        </p>
                    )}

                    <div className="grid grid-cols-3 gap-3">
                        <Field label="Title" htmlFor="title" error={errors.title?.message}>
                            <Input id="title" {...register("title")} />
                        </Field>
                        <div className="col-span-2">
                            <Field label="First name" htmlFor="first_name" error={errors.first_name?.message}>
                                <Input id="first_name" autoComplete="off" {...register("first_name")} />
                            </Field>
                        </div>
                    </div>

                    <Field label="Last name" htmlFor="last_name" error={errors.last_name?.message}>
                        <Input id="last_name" autoComplete="off" {...register("last_name")} />
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Specialty" htmlFor="specialty" error={errors.specialty?.message}>
                            <Input id="specialty" {...register("specialty")} />
                        </Field>
                        <Field label="HPCSA number" htmlFor="registration_number"
                               error={errors.registration_number?.message}>
                            <Input id="registration_number" {...register("registration_number")} />
                        </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Diary colour" htmlFor="color" error={errors.color?.message}>
                            <input id="color" type="color"
                                   className="h-9 w-full cursor-pointer rounded-md border border-input bg-transparent p-1"
                                   {...register("color")} />
                        </Field>
                        <Field label="Slot length" htmlFor="slot_minutes" error={errors.slot_minutes?.message}>
                            <select id="slot_minutes" className={selectClass} {...register("slot_minutes")}>
                                {SLOT_OPTIONS.map((m) => <option key={m} value={m}>{m} minutes</option>)}
                            </select>
                        </Field>
                    </div>

                    <Field
                        label="Linked login"
                        htmlFor="user"
                        error={errors.user?.message}
                        hint="A linked doctor sees only their own diary and can book themselves."
                    >
                        <select id="user" className={selectClass} {...register("user")}>
                            <option value="">Not linked</option>
                            {loginOptions?.map((u) => (
                                <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.email})</option>
                            ))}
                        </select>
                    </Field>

                    <div className="space-y-2">
                        <ToggleRow
                            title="Bookable online"
                            description="Patients can book this practitioner online"
                            {...register("bookable_online")}
                        />
                        <ToggleRow
                            title="Active"
                            description="Inactive practitioners disappear from the diary and booking page"
                            {...register("is_active")}
                        />
                    </div>
                </form>

                <SheetFooter className="flex-row gap-2 border-t border-border px-4">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" form="practitioner-form" className="flex-1" disabled={save.isPending}>
                        {save.isPending ? "Saving…" : "Save"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}