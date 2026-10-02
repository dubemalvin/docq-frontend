import {useState} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {Link, Navigate, useLocation} from "react-router";
import {Eye, EyeOff} from "lucide-react";
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

// Django sends "wrong password" as { non_field_errors: [...] }; throttling as { detail: "..." }
function loginErrorMessage(error: Error) {
    if (error instanceof ApiError && error.data && typeof error.data === "object") {
        const nonField = (error.data as { non_field_errors?: string[] }).non_field_errors;
        if (nonField?.length) return nonField[0];
    }
    return error.message;
}

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
                    <Link to="/signup" className="font-medium text-blue-600 hover:underline">
                        Create an account
                    </Link>
                </>
            }
        >
            <form onSubmit={handleSubmit((values) => login.mutate(values))} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        autoComplete="username"
                        className="h-10 bg-white"
                        {...register("email")}
                    />
                    {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
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

                {login.error && (
                    <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {loginErrorMessage(login.error)}
                    </p>
                )}

                <Button type="submit" className="h-10 w-full" disabled={login.isPending}>
                    {login.isPending ? "Signing in…" : "Sign in"}
                </Button>
            </form>
        </AuthLayout>
    );
}