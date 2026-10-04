import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

export default function Field({ label, htmlFor, error, hint, children }: {
  label: string; htmlFor?: string; error?: string; hint?: string; children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}