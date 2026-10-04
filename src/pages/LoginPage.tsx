import {useState} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {Link, Navigate, useLocation} from "react-router";
import {Eye, EyeOff, LockKeyhole, Mail} from "lucide-react";
import {ApiError} from "@/lib/api";
import {useLogin, useMe} from "@/features/auth/useAuth";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import AuthLayout from "@/app/AuthLayout.tsx";

const schema = z.object({
    email: z.string().min(1, "Enter your email").email("Enter a valid email address"),
    password: z.string().min(1, "Enter your password"),
});
type FormValues = z.infer<typeof schema>;

// Django sends "wrong password" as { non_field_errors: [...] }; throttling / lockout as { detail: "..." }
function loginErrorMessage(error: Error) {
    if (error instanceof ApiError && error.data && typeof error.data === "object") {
        const data = error.data as { non_field_errors?: string[]; detail?: string };
        if (data.non_field_errors?.length) return data.non_field_errors[0];
        if (typeof data.detail === "string" && data.detail) return data.detail;
    }
    return error.message;
}

const inputClass =
    "h-12 rounded-xl border-slate-200 bg-slate-50 pl-11 text-base transition-colors hover:border-slate-300 focus-visible:border-[#05a8e0] focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[#05a8e0]/30";

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const login = useLogin();
    const me = useMe();
    const location = useLocation();
    const {
        register,
        handleSubmit,
        formState: {errors},
    } = useForm<FormValues>({resolver: zodResolver(schema)});

    if (me.data) {
        const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;
        return <Navigate to={from ?? "/"} replace/>;
    }

    return (
        <AuthLayout
            title="Welcome back"
            description="Sign in to your practice."
            footer={
                <>
                    New to Docq?{" "}
                    <Link to="/signup" className="font-medium text-[#0553a5] hover:underline">
                        Create an account
                    </Link>
                </>
            }
        >
            <form onSubmit={handleSubmit((values) => login.mutate(values))} className="space-y-5" noValidate>
                <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true"/>
                        <Input
                            id="email"
                            type="email"
                            autoComplete="username"
                            autoFocus
                            placeholder="you@practice.com"
                            aria-invalid={!!errors.email}
                            aria-describedby={errors.email ? "email-error" : undefined}
                            className={inputClass}
                            {...register("email")}
                        />
                    </div>
                    {errors.email && (
                        <p id="email-error" className="text-sm text-red-600">{errors.email.message}</p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Link
                            to="/forgot-password"
                            className="text-sm font-medium text-[#0553a5] hover:underline"
                        >
                            Forgot password?
                        </Link>
                    </div>
                    <div className="relative">
                        <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true"/>
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            aria-invalid={!!errors.password}
                            aria-describedby={errors.password ? "password-error" : undefined}
                            className={`${inputClass} pr-12`}
                            {...register("password")}
                        />
                        <button
                            type="button"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-0 top-0 flex h-12 w-12 items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#05a8e0]"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                        </button>
                    </div>
                    {errors.password && (
                        <p id="password-error" className="text-sm text-red-600">{errors.password.message}</p>
                    )}
                </div>

                {login.error && (
                    <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {loginErrorMessage(login.error)}
                    </p>
                )}

                <Button
                    type="submit"
                    className="h-12 w-full rounded-xl border-0 bg-gradient-to-r from-[#0553a5] via-[#0aa6a6] to-[#1bb88a] text-base font-semibold text-white shadow-lg shadow-[#0553a5]/25 transition hover:opacity-95 hover:shadow-xl hover:shadow-[#0553a5]/30"
                    disabled={login.isPending}
                >
                    {login.isPending ? "Signing in…" : "Sign in"}
                </Button>
            </form>
        </AuthLayout>
    );
}