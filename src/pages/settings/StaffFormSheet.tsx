import {useEffect, useState} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {Send} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle} from "@/components/ui/sheet";
import Field from "@/components/Field";
import ToggleRow from "@/components/ToggleRow";
import {useMe} from "@/features/auth/useAuth";
import {ROLE_LABEL, useResendInvite, useSaveStaff, type StaffUser} from "@/features/settings/users";
import {applyServerErrors} from "@/lib/forms";

const schema = z.object({
    first_name: z.string().trim().min(1, "Enter a first name"),
    last_name: z.string().trim().min(1, "Enter a last name"),
    email: z.string().trim().min(1, "Enter an email address").email("Enter a valid email address"),
    phone: z.string().trim(),
    role: z.enum(["receptionist", "nurse", "doctor", "practice_manager"]),
    is_active: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

const EMPTY: FormValues = {first_name: "", last_name: "", email: "", phone: "", role: "receptionist", is_active: true};
const FIELD_NAMES = Object.keys(EMPTY);

const selectClass =
    "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: StaffUser | null; // null = invite a new person
};

export default function StaffFormSheet({open, onOpenChange, user}: Props) {
    const me = useMe();
    const isSelf = user !== null && user.id === me.data?.id;
    const invitePending = user !== null && user.is_active && user.last_login === null;
    const [formError, setFormError] = useState<string | null>(null);
    const [inviteNote, setInviteNote] = useState<string | null>(null);
    const save = useSaveStaff(user?.id);
    const resend = useResendInvite();

    const {
        register, handleSubmit, reset, setError,
        formState: {errors},
    } = useForm<FormValues>({resolver: zodResolver(schema), defaultValues: EMPTY});

    useEffect(() => {
        if (!open) return;
        reset(
            user
                ? {
                    first_name: user.first_name, last_name: user.last_name, email: user.email,
                    phone: user.phone, role: user.role, is_active: user.is_active,
                }
                : EMPTY,
        );
        setFormError(null);
        setInviteNote(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, user?.id]);

    function onSubmit(values: FormValues) {
        setFormError(null);
        save.mutate(values, {
            onSuccess: () => onOpenChange(false),
            onError: (error) => setFormError(applyServerErrors(error, setError, FIELD_NAMES)),
        });
    }

    function resendInvite() {
        if (!user) return;
        setInviteNote(null);
        resend.mutate(user.id, {
            onSuccess: (result) =>
                setInviteNote(result.sent ? "Invite sent again." : "The email couldn't be sent. Check your email settings."),
            onError: (error) => setInviteNote(error.message),
        });
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
                <SheetHeader className="border-b border-border">
                    <SheetTitle>{user ? "Edit staff member" : "Invite staff member"}</SheetTitle>
                    <SheetDescription>
                        {user ? "Change their details, role or access." : "They'll get an email with a link to set their password."}
                    </SheetDescription>
                </SheetHeader>

                <form id="staff-form" onSubmit={handleSubmit(onSubmit)} noValidate
                      className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
                    {formError && (
                        <p role="alert" className="rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {formError}
                        </p>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <Field label="First name" htmlFor="first_name" error={errors.first_name?.message}>
                            <Input id="first_name" autoComplete="off" {...register("first_name")} />
                        </Field>
                        <Field label="Last name" htmlFor="last_name" error={errors.last_name?.message}>
                            <Input id="last_name" autoComplete="off" {...register("last_name")} />
                        </Field>
                    </div>

                    <Field label="Email" htmlFor="email" error={errors.email?.message}>
                        <Input id="email" type="email" autoComplete="off" {...register("email")} />
                    </Field>

                    <Field label="Phone" htmlFor="phone" error={errors.phone?.message}>
                        <Input id="phone" type="tel" autoComplete="off" {...register("phone")} />
                    </Field>

                    {isSelf ? (
                        <p className="rounded-sm border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                            This is you. You can't change your own role or deactivate yourself.
                        </p>
                    ) : (
                        <>
                            <Field
                                label="Role"
                                htmlFor="role"
                                error={errors.role?.message}
                                hint="Doctors and nurses can read clinical notes. Receptionists can't. Only practice managers see Settings and the Dashboard."
                            >
                                <select id="role" className={selectClass} {...register("role")}>
                                    {Object.entries(ROLE_LABEL).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                            </Field>

                            {user && (
                                <ToggleRow
                                    title="Active"
                                    description="Inactive people can't sign in"
                                    {...register("is_active")}
                                />
                            )}
                        </>
                    )}

                    {invitePending && (
                        <div className="space-y-2 rounded-sm border border-amber-200 bg-amber-50 p-3">
                            <p className="text-sm text-amber-900">This person hasn't signed in yet.</p>
                            <Button type="button" variant="outline" size="sm" className="bg-white"
                                    disabled={resend.isPending} onClick={resendInvite}>
                                <Send className="mr-1.5 h-3.5 w-3.5"/>
                                {resend.isPending ? "Sending…" : "Resend invite"}
                            </Button>
                            {inviteNote && <p className="text-sm text-slate-600">{inviteNote}</p>}
                        </div>
                    )}
                </form>

                <SheetFooter className="flex-row gap-2 border-t border-border px-4">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" form="staff-form" className="flex-1" disabled={save.isPending}>
                        {save.isPending ? "Saving…" : user ? "Save changes" : "Send invite"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}