import {useState} from "react";
import {useNavigate} from "react-router";
import {ChevronRight, Phone, Plus, Search, SearchX, Users} from "lucide-react";
import {usePatients} from "@/features/patients/hooks";
import {useDebounce} from "@/lib/useDebounce";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {PageHeader} from "@/components/PageHeader";
import PatientFormSheet from "@/features/patients/PatientFormSheet";

const PAGE_SIZE = 50; // matches PAGE_SIZE in Django settings

function initialsOf(name: string) {
    const parts = name.trim().split(/\s+/);
    return `${parts[0]?.[0] ?? ""}${parts.length > 1 ? parts[parts.length - 1][0] : ""}`.toUpperCase();
}

export default function PatientsPage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const debouncedSearch = useDebounce(search);
    const {data, isLoading, isError, isFetching} = usePatients(debouncedSearch, page);
    const [createOpen, setCreateOpen] = useState(false);

    const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1;
    const subtitle = data ? `${data.count} patient${data.count === 1 ? "" : "s"}` : undefined;

    return (
        <div className="space-y-4">
            <PageHeader
                icon={Users}
                title="Patients"
                subtitle={subtitle}
                actions={[{label: "New patient", icon: Plus, onClick: () => setCreateOpen(true)}]}
            >
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/>
                    <Input
                        className="bg-white pl-9"
                        placeholder="Search name, ID, phone or email"
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                            setPage(1);
                        }}
                    />
                </div>
            </PageHeader>

            {isError && (
                <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    Couldn't load patients.
                </p>
            )}

            <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow className="hover:bg-slate-50">
                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Patient
                            </TableHead>
                            <TableHead
                                className="hidden text-xs font-semibold uppercase tracking-wide text-slate-500 md:table-cell">
                                ID number
                            </TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Age
                            </TableHead>
                            <TableHead
                                className="hidden text-xs font-semibold uppercase tracking-wide text-slate-500 sm:table-cell">
                                Phone
                            </TableHead>
                            <TableHead className="w-8"/>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading &&
                            Array.from({length: 5}).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={5}>
                                        <div className="h-8 animate-pulse rounded bg-slate-100"/>
                                    </TableCell>
                                </TableRow>
                            ))}

                        {data?.results.length === 0 && (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={5}>
                                    <div className="flex flex-col items-center gap-2 py-12 text-center">
                                        <div
                                            className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                            {debouncedSearch ? <SearchX className="h-6 w-6"/> :
                                                <Users className="h-6 w-6"/>}
                                        </div>
                                        <p className="font-medium text-slate-900">
                                            {debouncedSearch ? "No patients match your search" : "No patients yet"}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            {debouncedSearch
                                                ? "Try a different name, ID number or phone."
                                                : "Add your first patient to get started."}
                                        </p>
                                        {!debouncedSearch && (
                                            <Button size="sm" className="mt-2" onClick={() => setCreateOpen(true)}>
                                                <Plus className="mr-1.5 h-4 w-4"/> New patient
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}

                        {data?.results.map((patient) => (
                            <TableRow
                                key={patient.id}
                                tabIndex={0}
                                className="group cursor-pointer transition-colors hover:bg-blue-50/50 focus-visible:bg-blue-50/50 focus-visible:outline-none"
                                onClick={() => navigate(`/patients/${patient.id}`)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") navigate(`/patients/${patient.id}`);
                                }}
                            >
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                                            {initialsOf(patient.full_name)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate font-medium text-slate-900">{patient.full_name}</p>
                                            <p className="truncate text-xs text-slate-500 sm:hidden">
                                                {patient.phone || "No phone"}
                                            </p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="hidden font-mono text-sm text-slate-600 md:table-cell">
                                    {patient.id_number || <span className="text-slate-300">—</span>}
                                </TableCell>
                                <TableCell>
                                    {patient.age != null ? (
                                        <span
                                            className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                                            {patient.age} yrs
                                        </span>
                                    ) : (
                                        <span className="text-slate-300">—</span>
                                    )}
                                </TableCell>
                                <TableCell className="hidden sm:table-cell">
                                    {patient.phone ? (
                                        <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                                            <Phone className="h-3.5 w-3.5 text-slate-400"/>
                                            {patient.phone}
                                        </span>
                                    ) : (
                                        <span className="text-slate-300">—</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <ChevronRight
                                        className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600"/>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {/* Pagination footer */}
                <div
                    className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/60 px-4 py-2.5 text-sm text-slate-600">
                    <span>
                        Page {page} of {totalPages}
                        {isFetching && !isLoading ? " · updating…" : ""}
                    </span>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages}
                            onClick={() => setPage((p) => p + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>

            <PatientFormSheet open={createOpen} onOpenChange={setCreateOpen}/>
        </div>
    );
}