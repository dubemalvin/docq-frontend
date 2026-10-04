import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/lib/useDebounce";
import { usePatients } from "./hooks";

export type ChosenPatient = { id: string; name: string };

type Props = { value: ChosenPatient | null; onChange: (patient: ChosenPatient | null) => void };

export default function PatientPicker({ value, onChange }: Props) {
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search);
  const { data } = usePatients(debounced, 1);

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-md border bg-slate-50 px-3 py-2 text-sm">
        <span className="font-medium">{value.name}</span>
        <button type="button" className="text-blue-600 hover:underline" onClick={() => onChange(null)}>
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Input
        placeholder="Search name, ID or phone"
        autoComplete="off"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      {debounced && (
        <ul className="max-h-48 overflow-y-auto rounded-md border bg-white">
          {data?.results.length === 0 && <li className="p-3 text-sm text-slate-500">No patients found.</li>}
          {data?.results.slice(0, 8).map((patient) => (
            <li key={patient.id}>
              <button
                type="button"
                className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-slate-50"
                onClick={() => onChange({ id: patient.id, name: patient.full_name })}
              >
                <span className="font-medium">{patient.full_name}</span>
                <span className="text-xs text-slate-500">
                  {[patient.phone, patient.id_number].filter(Boolean).join(" · ")}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}