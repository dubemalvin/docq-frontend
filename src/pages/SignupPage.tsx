import {useState} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {Link, Navigate} from "react-router";
import {Eye, EyeOff} from "lucide-react";
import {useMe, useRegister} from "@/features/auth/useAuth";
import {applyServerErrors} from "@/lib/forms";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import AuthLayout from "@/app/AuthLayout.tsx";

const schema = z
    .object({
        practice_name: z.string().trim().min(1, "Enter your practice name"),
        first_name: z.string().trim().min(1, "Enter your first name"),
        last_name: z.string().trim().min(1, "Enter your last name"),
        email: z.string().min(1, "Enter your email").email("Enter a valid email address"),
        password: z.string().min(8, "Use at least 8 characters"),
        confirm_password: z.string().min(1, "Confirm your password"),
    })
    .refine((v) => v.password === v.confirm_password, {
        message: "Passwords don't match",
        path: ["confirm_password"],
    });
type FormValues = z.infer<typeof schema>;

const FIELD_NAMES = ["practice_name", "first_name", "last_name", "email", "password"];

export default function SignupPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const signup = useRegister();
    const me = useMe();
    const {
        register,
        handleSubmit,
        setError,
        formState: {errors},
    } = useForm<FormValues>({resolver: zodResolver(schema)});

    if (me.data) return <Navigate to="/" replace/>;

    function onSubmit({confirm_password: _confirm, ...values}: FormValues) {
        setFormError(null);
        signup.mutate(values, {
            onError: (error) => setFormError(applyServerErrors(error, setError, FIELD_NAMES)),
        });
    }

    return (
        <AuthLayout
            title="Create your account"
            description="Set up your practice in a minute."
            footer={
                <>
                    Already have an account?{" "}
                    <Link to="/login" className="font-medium text-blue-600 hover:underline">
                        Sign in
                    </Link>
                </>
            }
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                    <Label htmlFor="practice_name">Practice name</Label>
                    <Input id="practice_name" autoComplete="organization" className="h-10 bg-white"
                           {...register("practice_name")} />
                    {errors.practice_name && <p className="text-sm text-red-600">{errors.practice_name.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <Label htmlFor="first_name">First name</Label>
                        <Input id="first_name" autoComplete="given-name" className="h-10 bg-white"
                               {...register("first_name")} />
                        {errors.first_name && <p className="text-sm text-red-600">{errors.first_name.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="last_name">Last name</Label>
                        <Input id="last_name" autoComplete="family-name" className="h-10 bg-white"
                               {...register("last_name")} />
                        {errors.last_name && <p className="text-sm text-red-600">{errors.last_name.message}</p>}
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" autoComplete="username" className="h-10 bg-white"
                           {...register("email")} />
                    {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            className="h-10 bg-white pr-10"
                            {...register("password")}
                        />
                        <button
                            type="button"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-0 top-0 flex h-10 w-10 items-center justify-center text-slate-400 hover:text-slate-700"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                        </button>
                    </div>
                    {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="confirm_password">Confirm password</Label>
                    <Input
                        id="confirm_password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        className="h-10 bg-white"
                        {...register("confirm_password")}
                    />
                    {errors.confirm_password &&
                        <p className="text-sm text-red-600">{errors.confirm_password.message}</p>}
                </div>

                {formError && (
                    <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {formError}
                    </p>
                )}

                <Button type="submit" className="h-10 w-full" disabled={signup.isPending}>
                    {signup.isPending ? "Creating account…" : "Create account"}
                </Button>
            </form>
        </AuthLayout>
    );
}