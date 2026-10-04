import {useState, type ReactNode} from "react";
import {format, parseISO} from "date-fns";
import {
    BarChart3,
    CalendarCheck,
    CalendarDays,
    CheckCircle2,
    LayoutDashboard,
    Lightbulb,
    PieChart,
    Stethoscope,
    UserX,
    Wallet,
    type LucideIcon,
} from "lucide-react";
import {useDashboard} from "@/features/dashboard/hooks";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {PageHeader} from "@/components/PageHeader";
import {cn} from "@/lib/utils";

const RANGES = [7, 30, 90];

const initials = (name: string) =>
    name.replace(/^dr\.?\s+/i, "").split(/\s+/).filter(Boolean).slice(0, 2)
        .map((w) => w[0]?.toUpperCase()).join("") || "?";

/** Card with the same icon-tile header used on the settings and patient pages. */
function Panel({icon: Icon, title, aside, children, className, flush}: {
    icon: LucideIcon;
    title: string;
    aside?: ReactNode;
    children: ReactNode;
    className?: string;
    flush?: boolean;
}) {
    return (
        <section className={cn("flex flex-col rounded-sm border border-slate-200 bg-white shadow-sm", className)}>
            <header className="flex shrink-0 items-center gap-2.5 border-b border-slate-100 px-4 py-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-slate-100 text-blue-600">
                    <Icon className="h-3.5 w-3.5"/>
                </span>
                <h2 className="flex-1 text-sm font-semibold text-slate-900">{title}</h2>
                {aside && <div className="min-w-0 text-xs text-slate-500">{aside}</div>}
            </header>
            <div className={cn("min-h-0 flex-1", !flush && "p-4")}>{children}</div>
        </section>
    );
}

function Stat({label, value, sub, icon: Icon, tone}: {
    label: string;
    value: ReactNode;
    sub: string;
    icon: LucideIcon;
    tone: string;
}) {
    return (
        <div className="flex items-start gap-3 rounded-sm border border-slate-200 bg-white p-4 shadow-sm">
            <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-sm", tone)}>
                <Icon className="h-5 w-5"/>
            </span>
            <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">{label}</p>
                <p className="mt-0.5 truncate text-2xl font-semibold leading-tight text-slate-900">{value}</p>
                <p className="mt-0.5 truncate text-xs text-slate-500">{sub}</p>
            </div>
        </div>
    );
}

function Meter({label, value, total, color}: { label: string; value: number; total: number; color: string }) {
    const pct = total ? Math.round((100 * value) / total) : 0;
    return (
        <div>
            <div className="mb-1 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-600">
                    <span className={cn("h-2 w-2 rounded-full", color)}/>
                    {label}
                </span>
                <span className="font-medium text-slate-900">
                    {value} <span className="text-xs font-normal text-slate-400">· {pct}%</span>
                </span>
            </div>
            <div className="h-2 overflow-hidden rounded-sm bg-slate-100">
                <div className={cn("h-full", color)} style={{width: `${pct}%`}}/>
            </div>
        </div>
    );
}

function Donut({pct}: { pct: number }) {
    const r = 38;
    const c = 2 * Math.PI * r;
    return (
        <div className="relative h-24 w-24 shrink-0">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden>
                <circle cx="50" cy="50" r={r} fill="none" strokeWidth="11" className="stroke-slate-100"/>
                <circle
                    cx="50" cy="50" r={r} fill="none" strokeWidth="11" strokeLinecap="butt"
                    className="stroke-blue-500"
                    strokeDasharray={`${(pct / 100) * c} ${c}`}
                />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xl font-semibold text-slate-900">
                {pct}%
            </span>
        </div>
    );
}

function InfoRow({label, children}: { label: string; children: ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-3 py-2">
            <dt className="text-sm text-slate-500">{label}</dt>
            <dd className="min-w-0 truncate text-sm font-medium text-slate-900">{children}</dd>
        </div>
    );
}

export default function DashboardPage() {
    const [days, setDays] = useState(30);
    const [hoverDay, setHoverDay] = useState<number | null>(null);
    const {data, isLoading, isError, isFetching} = useDashboard(days);

    if (isLoading) {
        return (
            <div className="flex flex-col gap-3">
                <div className="h-10 w-48 animate-pulse rounded-sm bg-slate-200"/>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({length: 4}).map((_, i) => (
                        <div key={i} className="h-24 animate-pulse rounded-sm bg-slate-200"/>
                    ))}
                </div>
                <div className="grid gap-3 lg:grid-cols-3">
                    <div className="h-80 animate-pulse rounded-sm bg-slate-200 lg:col-span-2"/>
                    <div className="h-80 animate-pulse rounded-sm bg-slate-200"/>
                </div>
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="space-y-3">
                <PageHeader icon={LayoutDashboard} title="Dashboard"/>
                <p className="rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    Couldn't load the dashboard.
                </p>
            </div>
        );
    }

    const money = new Intl.NumberFormat("en-ZA", {
        style: "currency", currency: data.currency, maximumFractionDigits: 0,
    });

    const {total, completed, no_show, cancelled} = data.totals;
    const other = Math.max(0, total - completed - no_show - cancelled);
    const upcomingTotal = data.upcoming.booked + data.upcoming.confirmed;
    const confirmedPct = upcomingTotal ? Math.round((100 * data.upcoming.confirmed) / upcomingTotal) : 0;
    const avgRevenue = completed ? Number(data.estimated_revenue) / completed : 0;
    const completionRate = total ? Math.round((100 * completed) / total) : 0;
    const cancelRate = total ? Math.round((100 * cancelled) / total) : 0;

    const maxPerDay = Math.max(1, ...data.per_day.map((d) => d.total));
    const labelStep = Math.max(1, Math.ceil(data.per_day.length / 8));
    const hovered = hoverDay !== null ? data.per_day[hoverDay] : null;

    const busiest = data.per_day.reduce<(typeof data.per_day)[number] | null>(
        (best, d) => (!best || d.total > best.total ? d : best), null);
    const topPractitioner = data.per_practitioner.reduce<(typeof data.per_practitioner)[number] | null>(
        (best, p) => (!best || p.total > best.total ? p : best), null);

    return (
        <div className={cn("flex flex-col gap-3 transition-opacity lg:h-full", isFetching && "opacity-70")}>
            <div className="shrink-0">
                <PageHeader icon={LayoutDashboard} title="Dashboard" subtitle={`Last ${data.days} days`}>
                    <div role="group" aria-label="Date range"
                         className="flex rounded-sm border border-slate-200 bg-white p-0.5 shadow-sm">
                        {RANGES.map((range) => (
                            <button
                                key={range}
                                type="button"
                                onClick={() => setDays(range)}
                                aria-pressed={range === days}
                                className={cn(
                                    "rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
                                    range === days ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100",
                                )}
                            >
                                {range} days
                            </button>
                        ))}
                    </div>
                </PageHeader>
            </div>

            {/* KPIs */}
            <div className="grid shrink-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Stat
                    label="Appointments"
                    value={total}
                    sub={`${completed} completed · ${cancelled} cancelled`}
                    icon={CalendarDays}
                    tone="bg-blue-50 text-blue-600"
                />
                <Stat
                    label="No-show rate"
                    value={`${data.no_show_rate}%`}
                    sub={`${no_show} no-show${no_show === 1 ? "" : "s"}`}
                    icon={UserX}
                    tone={data.no_show_rate > 15 ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}
                />
                <Stat
                    label="Est. revenue"
                    value={money.format(Number(data.estimated_revenue))}
                    sub={completed ? `${money.format(avgRevenue)} per completed visit` : "From completed visits"}
                    icon={Wallet}
                    tone="bg-green-50 text-green-600"
                />
                <Stat
                    label="Completion rate"
                    value={`${completionRate}%`}
                    sub={`${completed} of ${total} appointments`}
                    icon={CheckCircle2}
                    tone="bg-violet-50 text-violet-600"
                />
            </div>

            {/* Two columns. Cards keep their natural height; the chart absorbs any spare room. */}
            <div className="grid gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-3 lg:grid-rows-[minmax(0,1fr)]">
                <div className="flex min-w-0 flex-col gap-3 lg:col-span-2 lg:min-h-0">
                    <Panel
                        icon={BarChart3}
                        title="Appointments per day"
                        className="min-h-56 flex-1 lg:max-h-[28rem]"
                        aside={
                            hovered ? (
                                <span className="font-medium text-slate-900">
                                    {format(parseISO(hovered.date), "EEE d MMM")} · {hovered.total} appt
                                    {hovered.total === 1 ? "" : "s"} · {hovered.no_show} no-show
                                    {hovered.no_show === 1 ? "" : "s"}
                                </span>
                            ) : (
                                <span className="flex items-center gap-3">
                                    <span className="flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-sm bg-blue-500"/> Attended or booked
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-sm bg-red-400"/> No-shows
                                    </span>
                                </span>
                            )
                        }
                    >
                        {data.per_day.length === 0 ? (
                            <div className="flex h-full min-h-48 items-center justify-center text-sm text-slate-400">
                                No appointments in this period.
                            </div>
                        ) : (
                            <div className="flex h-64 gap-2 lg:h-full lg:min-h-40">
                                <div className="flex w-7 shrink-0 flex-col justify-between pb-5 text-right text-[10px] text-slate-400">
                                    <span>{maxPerDay}</span>
                                    <span>{Math.round(maxPerDay / 2)}</span>
                                    <span>0</span>
                                </div>

                                <div className="relative min-w-0 flex-1">
                                    <div className="pointer-events-none absolute inset-x-0 bottom-5 top-0 flex flex-col justify-between">
                                        <div className="border-t border-dashed border-slate-200"/>
                                        <div className="border-t border-dashed border-slate-200"/>
                                        <div className="border-t border-slate-300"/>
                                    </div>

                                    <div className="relative flex h-full gap-px" onMouseLeave={() => setHoverDay(null)}>
                                        {data.per_day.map((day, index) => (
                                            <div
                                                key={day.date}
                                                className="flex min-w-0 flex-1 flex-col"
                                                onMouseEnter={() => setHoverDay(index)}
                                            >
                                                <div className="flex flex-1 items-end">
                                                    <div
                                                        className={cn(
                                                            "flex w-full flex-col overflow-hidden rounded-t-sm transition-opacity",
                                                            hoverDay !== null && hoverDay !== index && "opacity-40",
                                                        )}
                                                        style={{height: `${(day.total / maxPerDay) * 100}%`, minHeight: 2}}
                                                    >
                                                        <div className="bg-red-400"
                                                             style={{height: `${(day.no_show / day.total) * 100}%`}}/>
                                                        <div className="flex-1 bg-blue-500"/>
                                                    </div>
                                                </div>
                                                <div className="h-5 pt-1 text-center text-[10px] text-slate-400">
                                                    {index % labelStep === 0 && (
                                                        <span className="whitespace-nowrap">
                                                            {format(parseISO(day.date), "d MMM")}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </Panel>

                    <Panel icon={Stethoscope} title="By practitioner" flush>
                        {data.per_practitioner.length === 0 ? (
                            <p className="p-4 text-sm text-slate-400">No appointments in this period.</p>
                        ) : (
                            <div className="max-h-52 overflow-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                                            <TableHead>Practitioner</TableHead>
                                            <TableHead>Share</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                            <TableHead className="hidden text-right sm:table-cell">Completed</TableHead>
                                            <TableHead className="text-right">No-show</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.per_practitioner.map((row) => {
                                            const share = total ? (100 * row.total) / total : 0;
                                            const rate = row.completed + row.no_show
                                                ? Math.round((100 * row.no_show) / (row.completed + row.no_show))
                                                : 0;
                                            return (
                                                <TableRow key={row.practitioner_id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-slate-100 text-xs font-semibold text-slate-700">
                                                                {initials(row.name)}
                                                            </span>
                                                            <span className="truncate font-medium text-slate-900">{row.name}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="w-40">
                                                        <div className="h-2 overflow-hidden rounded-sm bg-slate-100">
                                                            <div className="h-full bg-blue-500" style={{width: `${share}%`}}/>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">{row.total}</TableCell>
                                                    <TableCell className="hidden text-right sm:table-cell">{row.completed}</TableCell>
                                                    <TableCell className="text-right">
                                                        {row.no_show}
                                                        <span className={cn("ml-1.5 text-xs", rate > 15 ? "text-red-600" : "text-slate-400")}>
                                                            {rate}%
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </Panel>
                </div>

                <div className="flex min-w-0 flex-col gap-3 lg:min-h-0 lg:overflow-y-auto">
                    <Panel icon={CalendarCheck} title="Upcoming confirmations">
                        {upcomingTotal === 0 ? (
                            <p className="text-sm text-slate-400">Nothing booked ahead yet.</p>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-center gap-4">
                                    <Donut pct={confirmedPct}/>
                                    <dl className="min-w-0 flex-1 space-y-2">
                                        <div className="flex items-center justify-between rounded-sm border border-blue-100 bg-blue-50 px-3 py-2">
                                            <dt className="flex items-center gap-2 text-xs font-medium text-blue-700">
                                                <span className="h-2 w-2 rounded-full bg-blue-500"/> Confirmed
                                            </dt>
                                            <dd className="text-lg font-semibold leading-tight text-blue-900">
                                                {data.upcoming.confirmed}
                                            </dd>
                                        </div>
                                        <div className="flex items-center justify-between rounded-sm border border-slate-200 bg-slate-50 px-3 py-2">
                                            <dt className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                                <span className="h-2 w-2 rounded-full bg-slate-400"/> Awaiting
                                            </dt>
                                            <dd className="text-lg font-semibold leading-tight text-slate-900">
                                                {data.upcoming.booked}
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                                <p className="text-xs text-slate-500">
                                    {confirmedPct}% of {upcomingTotal} upcoming appointment{upcomingTotal === 1 ? "" : "s"} confirmed
                                </p>
                            </div>
                        )}
                    </Panel>

                    <Panel icon={PieChart} title="Outcomes">
                        {total === 0 ? (
                            <p className="text-sm text-slate-400">No appointments in this period.</p>
                        ) : (
                            <div className="space-y-3">
                                <Meter label="Completed" value={completed} total={total} color="bg-green-500"/>
                                <Meter label="No-show" value={no_show} total={total} color="bg-red-400"/>
                                <Meter label="Cancelled" value={cancelled} total={total} color="bg-slate-400"/>
                                {other > 0 && <Meter label="Other" value={other} total={total} color="bg-blue-300"/>}
                            </div>
                        )}
                    </Panel>

                    <Panel icon={Lightbulb} title="Highlights">
                        {total === 0 ? (
                            <p className="text-sm text-slate-400">Highlights appear once you have appointments.</p>
                        ) : (
                            <dl className="-my-2 divide-y divide-slate-100">
                                <InfoRow label="Busiest day">
                                    {busiest ? `${format(parseISO(busiest.date), "EEE d MMM")}, ${busiest.total}` : "—"}
                                </InfoRow>
                                <InfoRow label="Average per day">{(total / data.days).toFixed(1)}</InfoRow>
                                <InfoRow label="Cancellation rate">{cancelRate}%</InfoRow>
                                <InfoRow label="Busiest practitioner">
                                    {topPractitioner ? `${topPractitioner.name}, ${topPractitioner.total}` : "—"}
                                </InfoRow>
                            </dl>
                        )}
                    </Panel>
                </div>
            </div>
        </div>
    );
}