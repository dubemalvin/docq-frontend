import {useState} from "react";
import {ChevronRight, ClipboardList, Clock, Plus} from "lucide-react";
import {Button} from "@/components/ui/button";
import {PageHeader} from "@/components/PageHeader";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {useMe} from "@/features/auth/useAuth";
import type {AppointmentType} from "@/features/diary/hooks";
import {useAppointmentTypeList} from "@/features/settings/appointmentTypes";
import {cn} from "@/lib/utils";
import AppointmentTypeFormSheet from "./AppointmentTypeFormSheet";

function ColorTile({color}: { color: string }) {
    return (
        <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-white"
            style={{backgroundColor: color}}
            aria-hidden
        >
            <Clock className="h-4 w-4"/>
        </span>
    );
}

function StatusPill({active}: { active: boolean }) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600",
            )}
        >
            <span className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-emerald-500" : "bg-slate-400")}/>
            {active ? "Active" : "Inactive"}
        </span>
    );
}

export default function AppointmentTypesSettingsPage() {
    const me = useMe();
    const types = useAppointmentTypeList();
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editing, setEditing] = useState<AppointmentType | null>(null);

    const list = types.data ?? [];
    const activeCount = list.filter((t) => t.is_active).length;

    const money = new Intl.NumberFormat("en-ZA", {
        style: "currency",
        currency: me.data?.practice?.currency ?? "ZAR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });

    function openSheet(type: AppointmentType | null) {
        setEditing(type);
        setSheetOpen(true);
    }

    return (
        <div className="space-y-3">
            <PageHeader
                icon={ClipboardList}
                title="Appointment types"
                subtitle={types.isSuccess ? `${list.length} in total, ${activeCount} active` : "Durations and prices"}
                actions={[{label: "Add type", icon: Plus, onClick: () => openSheet(null)}]}
            />

            <section className="rounded-sm border border-slate-200 bg-white shadow-sm">
                {types.isError && (
                    <p role="alert" className="m-4 rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        Couldn't load appointment types. Refresh the page to try again.
                    </p>
                )}

                {types.isLoading && <p className="p-4 text-sm text-slate-500">Loading…</p>}

                {types.isSuccess && list.length === 0 && (
                    <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
                        <div
                            className="flex h-10 w-10 items-center justify-center rounded-sm bg-slate-100 text-slate-500">
                            <ClipboardList className="h-5 w-5"/>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-900">No appointment types yet</p>
                            <p className="text-xs text-slate-500">
                                Add the visits you offer. Duration decides the length of each booking.
                            </p>
                        </div>
                        <Button onClick={() => openSheet(null)}>
                            <Plus className="mr-1.5 h-4 w-4"/> Add type
                        </Button>
                    </div>
                )}

                {list.length > 0 && (
                    <>
                        {/* Desktop: table */}
                        <div className="hidden overflow-x-auto md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                                        <TableHead>Type</TableHead>
                                        <TableHead>Duration</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Online booking</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {list.map((t) => (
                                        <TableRow
                                            key={t.id}
                                            tabIndex={0}
                                            className="cursor-pointer focus-visible:bg-slate-50 focus-visible:outline-none"
                                            onClick={() => openSheet(t)}
                                            onKeyDown={(e) => e.key === "Enter" && openSheet(t)}
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <ColorTile color={t.color}/>
                                                    <span className="truncate font-medium text-slate-900">{t.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap text-slate-700">{t.duration_minutes} min</TableCell>
                                            <TableCell className="whitespace-nowrap text-slate-700">{money.format(Number(t.price))}</TableCell>
                                            <TableCell>
                                                <span className={t.bookable_online ? "text-slate-900" : "text-slate-400"}>
                                                    {t.bookable_online ? "Yes" : "No"}
                                                </span>
                                            </TableCell>
                                            <TableCell><StatusPill active={t.is_active}/></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobile: tappable rows */}
                        <ul className="divide-y divide-slate-100 md:hidden">
                            {list.map((t) => (
                                <li key={t.id}>
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => openSheet(t)}
                                        onKeyDown={(e) => e.key === "Enter" && openSheet(t)}
                                        className="flex cursor-pointer items-center gap-3 px-4 py-3 active:bg-slate-100"
                                    >
                                        <ColorTile color={t.color}/>
                                        <div className="min-w-0 flex-1 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <p className="truncate text-sm font-medium text-slate-900">{t.name}</p>
                                                <StatusPill active={t.is_active}/>
                                            </div>
                                            <p className="truncate text-xs text-slate-500">
                                                {[`${t.duration_minutes} min`, money.format(Number(t.price)), t.bookable_online ? "Bookable online" : null]
                                                    .filter(Boolean).join(", ")}
                                            </p>
                                        </div>
                                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400"/>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </section>

            <AppointmentTypeFormSheet open={sheetOpen} onOpenChange={setSheetOpen} appointmentType={editing}/>
        </div>
    );
}