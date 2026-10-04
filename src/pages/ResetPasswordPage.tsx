import { useState } from "react";
import { Link, useParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { api, ApiError } from "@/lib/api";
import { applyServerErrors } from "@/lib/forms";
import Field from "@/components/Field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const schema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters"),
    password_confirm: z.string().min(1, "Repeat the password"),
  })
  .refine((v) => v.password === v.password_confirm, { message: "The passwords don't match", path: ["password_confirm"] });
type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const { uid = "", token = "" } = useParams();
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const {
    register, handleSubmit, setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const reset = useMutation({
    mutationFn: (values: FormValues) =>
      api("/auth/password-reset/confirm/", { method: "POST", body: { uid, token, ...values } }),
  });

  function onSubmit(values: FormValues) {
    setFormError(null);
    reset.mutate(values, {
      onSuccess: () => setDone(true),
      onError: (error) => {
        if (error instanceof ApiError && error.status === 429) return setFormError("Too many attempts. Please wait and try again.");
        setFormError(applyServerErrors(error, setError, ["password", "password_confirm"]));
      },
    });
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Docq</CardTitle>
          <CardDescription>{done ? "Password saved" : "Choose your password"}</CardDescription>
        </CardHeader>
        <CardContent>
          {done ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">Your password has been set. You can now sign in.</p>
              <Button asChild className="w-full">
                <Link to="/login">Go to sign in</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {formError && (
                <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                  {formError} If your link has expired, ask for a new one.
                </p>
              )}
              <Field label="New password" htmlFor="password" error={errors.password?.message}>
                <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
              </Field>
              <Field label="Repeat password" htmlFor="password_confirm" error={errors.password_confirm?.message}>
                <Input id="password_confirm" type="password" autoComplete="new-password" {...register("password_confirm")} />
              </Field>
              <Button type="submit" className="w-full" disabled={reset.isPending}>
                {reset.isPending ? "Saving…" : "Save password"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}