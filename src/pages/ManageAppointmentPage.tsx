import { useState } from "react";
import { useParams } from "react-router";
import { format, parseISO } from "date-fns";
import { CalendarCheck, CheckCircle2, XCircle } from "lucide-react";
import { ApiError } from "@/lib/api";
import { useManagedAppointment, usePatientAction } from "@/features/booking/hooks";
import { Button } from "@/components/ui/button";

export default function ManageAppointmentPage() {
  const { token = "" } = useParams();
  const query = useManagedAppointment(token);
  const action = usePatientAction(token);
  const [askingCancel, setAskingCancel] = useState(false);

  if (query.isLoading) return <p className="p-8 text-center text-slate-500">Loading…</p>;
  if (query.isError || !query.data) {
    const notFound = query.error instanceof ApiError && query.error.status === 404;
    return (
      <p className="p-8 text-center text-slate-600">
        {notFound ? "This link isn't valid. Please contact your practice." : "Something went wrong. Please try again."}
      </p>
    );
  }

  const a = query.data;
  const when = `${format(parseISO(a.start_at.slice(0, 10)), "EEEE d MMMM")} at ${a.start_at.slice(11, 16)}`;

  const banner =
    a.status === "confirmed" ? (
      <div className="space-y-2 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
        <h1 className="text-2xl font-semibold">You're confirmed</h1>
        <p className="text-slate-600">We look forward to seeing you.</p>
      </div>
    ) : a.status === "cancelled" ? (
      <div className="space-y-2 text-center">
        <XCircle className="mx-auto h-14 w-14 text-red-400" />
        <h1 className="text-2xl font-semibold">Appointment cancelled</h1>
        <p className="text-slate-600">Please contact the practice if you'd like to rebook.</p>
      </div>
    ) : (
      <div className="space-y-2 text-center">
        <CalendarCheck className="mx-auto h-14 w-14 text-slate-400" />
        <h1 className="text-2xl font-semibold">
          {a.can_change ? "Your appointment" : "This appointment can't be changed online"}
        </h1>
      </div>
    );

  return (
    <main className="mx-auto min-h-screen max-w-lg space-y-6 bg-slate-50 p-4 pt-10">
      {banner}

      <div className="space-y-1 rounded-lg border bg-white p-4">
        <p className="font-medium">{a.appointment_type} with {a.practitioner}</p>
        <p>{when}</p>
        <p className="text-sm text-slate-500">
          {a.practice_name}{a.practice_address && ` · ${a.practice_address}`}
        </p>
        {a.practice_phone && <p className="text-sm text-slate-500">{a.practice_phone}</p>}
      </div>

      {action.isError && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{action.error.message}</p>
      )}

      {a.can_change && (
        <div className="space-y-3">
          {a.status === "booked" && (
            <Button className="w-full" disabled={action.isPending} onClick={() => action.mutate("confirm")}>
              {action.isPending && !askingCancel ? "Confirming…" : "Confirm my appointment"}
            </Button>
          )}

          {!askingCancel ? (
            <Button variant="outline" className="w-full" onClick={() => setAskingCancel(true)}>
              Cancel appointment
            </Button>
          ) : (
            <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm">Are you sure you want to cancel?</p>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  className="flex-1"
                  disabled={action.isPending}
                  onClick={() => action.mutate("cancel", { onSuccess: () => setAskingCancel(false) })}
                >
                  {action.isPending ? "Cancelling…" : "Yes, cancel"}
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setAskingCancel(false)}>
                  Keep it
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}