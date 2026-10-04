import { useState } from "react";
import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api";
import Field from "@/components/Field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const schema = z.object({
  email: z.string().trim().min(1, "Enter your email").email("Enter a valid email address"),
});
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState<string | null>(null);
  const {
    register, handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const request = useMutation({
    mutationFn: (values: FormValues) =>
      api<{ detail: string }>("/auth/password-reset/", { method: "POST", body: values }),
    onSuccess: (data) => setMessage(data.detail),
  });

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Docq</CardTitle>
          <CardDescription>Reset your password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message ? (
            <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>
          ) : (
            <form onSubmit={handleSubmit((values) => request.mutate(values))} className="space-y-4" noValidate>
              <p className="text-sm text-slate-600">Enter your email and we'll send you a link to choose a new password.</p>
              {request.error && (
                <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{request.error.message}</p>
              )}
              <Field label="Email" htmlFor="email" error={errors.email?.message}>
                <Input id="email" type="email" autoComplete="username" {...register("email")} />
              </Field>
              <Button type="submit" className="w-full" disabled={request.isPending}>
                {request.isPending ? "Sending…" : "Send reset link"}
              </Button>
            </form>
          )}
          <Link to="/login" className="block text-center text-sm text-blue-600 hover:underline">
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}