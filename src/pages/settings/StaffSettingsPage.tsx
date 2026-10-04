import {useState} from "react";
import {formatDistanceToNow, parseISO} from "date-fns";
import {ChevronRight, UserPlus, Users} from "lucide-react";
import {Button} from "@/components/ui/button";
import {PageHeader} from "@/components/PageHeader";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {ROLE_LABEL, useStaff, type StaffUser} from "@/features/settings/users";
import {cn} from "@/lib/utils";
import StaffFormSheet from "./StaffFormSheet";

const initials = (u: StaffUser) =>
    `${u.first_name?.[0] ?? ""}${u.last_name?.[0] ?? ""}`.toUpperCase() || u.email[0]?.toUpperCase() || "?";

function Avatar({user}: { user: StaffUser }) {
    return (
        <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-slate-100 text-xs font-semibold text-slate-700"
            aria-hidden
        >
            {initials(user)}
        </span>
    );
}

function StatusBadge({user}: { user: StaffUser }) {
    const [label, pill, dot] = !user.is_active
        ? ["Inactive", "bg-slate-100 text-slate-600", "bg-slate-400"]
        : user.last_login === null
            ? ["Invite pending", "bg-amber-50 text-amber-700", "bg-amber-500"]
            : ["Active", "bg-emerald-50 text-emerald-700", "bg-emerald-500"];
    return (
        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", pill)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", dot)}/>
            {label}
        </span>
    );
}

const lastSignIn = (u: StaffUser) =>
    u.last_login ? formatDistanceToNow(parseISO(u.last_login), {addSuffix: true}) : "Never";

export default function StaffSettingsPage() {
    const staff = useStaff();
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editing, setEditing] = useState<StaffUser | null>(null);

    const list = staff.data ?? [];
    const pending = list.filter((u) => u.is_active && u.last_login === null).length;

    function openSheet(user: StaffUser | null) {
        setEditing(user);
        setSheetOpen(true);
    }

    return (
        <div className="space-y-3">
            <PageHeader
                icon={Users}
                title="Staff"
                subtitle={staff.isSuccess
                    ? `${list.length} can sign in${pending ? `, ${pending} invite${pending === 1 ? "" : "s"} pending` : ""}`
                    : "Team members and roles"}
                actions={[{label: "Invite staff", icon: UserPlus, onClick: () => openSheet(null)}]}
            />

            <section className="rounded-sm border border-slate-200 bg-white shadow-sm">
                {staff.isError && (
                    <p role="alert" className="m-4 rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        Couldn't load staff. Refresh the page to try again.
                    </p>
                )}

                {staff.isLoading && <p className="p-4 text-sm text-slate-500">Loading…</p>}

                {staff.isSuccess && list.length === 0 && (
                    <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
                        <div
                            className="flex h-10 w-10 items-center justify-center rounded-sm bg-slate-100 text-slate-500">
                            <Users className="h-5 w-5"/>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-900">No staff yet</p>
                            <p className="text-xs text-slate-500">Invite your team so they can sign in.</p>
                        </div>
                        <Button onClick={() => openSheet(null)}>
                            <UserPlus className="mr-1.5 h-4 w-4"/> Invite staff
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
                                        <TableHead>Staff member</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Last sign-in</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {list.map((u) => (
                                        <TableRow
                                            key={u.id}
                                            tabIndex={0}
                                            className="cursor-pointer focus-visible:bg-slate-50 focus-visible:outline-none"
                                            onClick={() => openSheet(u)}
                                            onKeyDown={(e) => e.key === "Enter" && openSheet(u)}
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar user={u}/>
                                                    <div className="min-w-0">
                                                        <p className="truncate font-medium text-slate-900">
                                                            {u.first_name} {u.last_name}
                                                        </p>
                                                        <p className="truncate text-xs text-slate-500">{u.email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-slate-700">{ROLE_LABEL[u.role]}</TableCell>
                                            <TableCell><StatusBadge user={u}/></TableCell>
                                            <TableCell className="text-sm text-slate-600">{lastSignIn(u)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobile: tappable rows */}
                        <ul className="divide-y divide-slate-100 md:hidden">
                            {list.map((u) => (
                                <li key={u.id}>
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => openSheet(u)}
                                        onKeyDown={(e) => e.key === "Enter" && openSheet(u)}
                                        className="flex cursor-pointer items-center gap-3 px-4 py-3 active:bg-slate-100"
                                    >
                                        <Avatar user={u}/>
                                        <div className="min-w-0 flex-1 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <p className="truncate text-sm font-medium text-slate-900">
                                                    {u.first_name} {u.last_name}
                                                </p>
                                                <StatusBadge user={u}/>
                                            </div>
                                            <p className="truncate text-xs text-slate-500">{u.email}</p>
                                            <p className="truncate text-xs text-slate-400">
                                                {ROLE_LABEL[u.role]}, last sign-in {lastSignIn(u).toLowerCase()}
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

            <StaffFormSheet open={sheetOpen} onOpenChange={setSheetOpen} user={editing}/>
        </div>
    );
}