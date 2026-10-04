import { useState } from "react";
import { useNavigate } from "react-router";
import { Clock, Plus, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePractitionerList, type PractitionerFull } from "@/features/settings/practitioners";
import { useStaff } from "@/features/settings/users";
import PractitionerFormSheet from "./PractitionerFormSheet";
import WorkingHoursSheet from "./WorkingHoursSheet";

function Badge({ on, onLabel, offLabel }: { on: boolean; onLabel: string; offLabel: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${on ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>
      {on ? onLabel : offLabel}
    </span>
  );
}

export default function PractitionersSettingsPage() {
  const navigate = useNavigate();
  const practitioners = usePractitionerList();
  const staff = useStaff();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<PractitionerFull | null>(null);
  const [hoursFor, setHoursFor] = useState<PractitionerFull | null>(null);

  const emailOf = (userId: string | null) => staff.data?.find((u) => u.id === userId)?.email;

  function openSheet(practitioner: PractitionerFull | null) {
    setEditing(practitioner);
    setSheetOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-600">The clinicians who appear in the diary and on your booking page.</p>
        <Button onClick={() => openSheet(null)}>
          <Plus className="mr-2 h-4 w-4" /> Add practitioner
        </Button>
      </div>

      {practitioners.isError && <p className="text-red-600">Couldn't load practitioners.</p>}

      <div className="overflow-x-auto rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Field</TableHead>
              <TableHead>Slot</TableHead>
              <TableHead>Online booking</TableHead>
              <TableHead>Login</TableHead>
              <TableHead>Public profile</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {practitioners.isLoading && (
              <TableRow><TableCell colSpan={8} className="text-slate-500">Loading…</TableCell></TableRow>
            )}
            {practitioners.data?.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-slate-500">No practitioners yet.</TableCell></TableRow>
            )}
            {practitioners.data?.map((p) => (
              <TableRow key={p.id} className="cursor-pointer" onClick={() => openSheet(p)}>
                <TableCell className="font-medium">
                  <span className="mr-2 inline-block h-3 w-3 rounded-full align-middle" style={{ backgroundColor: p.color }} />
                  {p.display_name}
                </TableCell>
                <TableCell>{p.discipline_label || p.specialty || "—"}</TableCell>
                <TableCell>{p.slot_minutes} min</TableCell>
                <TableCell>{p.bookable_online ? "Yes" : "No"}</TableCell>
                <TableCell className="text-sm">{emailOf(p.user) ?? <span className="text-slate-400">Not linked</span>}</TableCell>
                <TableCell><Badge on={p.show_profile_publicly} onLabel="Public" offLabel="Hidden" /></TableCell>
                <TableCell><Badge on={p.is_active} onLabel="Active" offLabel="Inactive" /></TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation(); // don't also open the edit panel
                        navigate(`/settings/practitioners/${p.id}`);
                      }}
                    >
                      <UserRound className="mr-1.5 h-3.5 w-3.5" /> Profile
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        setHoursFor(p);
                      }}
                    >
                      <Clock className="mr-1.5 h-3.5 w-3.5" /> Hours
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PractitionerFormSheet open={sheetOpen} onOpenChange={setSheetOpen} practitioner={editing} />
      <WorkingHoursSheet practitioner={hoursFor} onOpenChange={(open) => !open && setHoursFor(null)} />
    </div>
  );
}