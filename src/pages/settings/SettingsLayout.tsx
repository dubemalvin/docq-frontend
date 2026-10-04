import {useSyncExternalStore} from "react";
import {Navigate, NavLink, Outlet, useMatch, useResolvedPath} from "react-router";
import {
    Building2,
    ChevronRight,
    ClipboardList,
    Settings,
    Stethoscope,
    Users,
    type LucideIcon,
} from "lucide-react";
import {PageHeader} from "@/components/PageHeader";
import {cn} from "@/lib/utils";

const TABS: { to: string; label: string; description: string; icon: LucideIcon }[] = [
    {to: "practice", label: "Practice", description: "Details, hours and messaging", icon: Building2},
    {to: "practitioners", label: "Practitioners", description: "Doctors, colours and schedules", icon: Stethoscope},
    {to: "appointment-types", label: "Appointment types", description: "Durations and prices", icon: ClipboardList},
    {to: "staff", label: "Staff", description: "Team members and roles", icon: Users},
];

function useIsDesktop() {
    return useSyncExternalStore(
        (cb) => {
            const mq = window.matchMedia("(min-width: 1024px)");
            mq.addEventListener("change", cb);
            return () => mq.removeEventListener("change", cb);
        },
        () => window.matchMedia("(min-width: 1024px)").matches,
        () => false,
    );
}

/** Index route: mobile menu list, or redirect to the first tab on desktop. */
export function SettingsIndex() {
    const isDesktop = useIsDesktop();
    if (isDesktop) return <Navigate to={TABS[0].to} replace/>;

    return (
        <nav aria-label="Settings sections">
            <ul className="space-y-2">
                {TABS.map(({to, label, description, icon: Icon}) => (
                    <li key={to}>
                        <NavLink
                            to={to}
                            className="flex items-center gap-3 rounded-sm border border-slate-200 bg-white p-3 shadow-sm transition-colors active:bg-slate-100"
                        >
                            <span
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-slate-200 bg-slate-50 text-blue-600">
                                <Icon className="h-5 w-5"/>
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block text-sm font-semibold text-slate-900">{label}</span>
                                <span className="block truncate text-xs text-slate-500">{description}</span>
                            </span>
                            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400"/>
                        </NavLink>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

export default function SettingsLayout() {
    // True only on the bare settings route (works wherever you mount it)
    const base = useResolvedPath(".");
    const isIndex = !!useMatch({path: base.pathname, end: true});
    const isDesktop = useIsDesktop();

    return (
        <div className="flex flex-col gap-3 lg:h-full">
            <div className="shrink-0">
                <PageHeader
                    icon={Settings}
                    title="Settings"
                    subtitle="Manage your practice"
                    // Back to the settings list: mobile sub-pages only
                    backHref={!isDesktop && !isIndex ? "." : undefined}
                />
            </div>

            <div className="flex flex-col gap-3 lg:min-h-0 lg:flex-1 lg:flex-row">
                {/* Desktop only: vertical sidebar */}
                <nav
                    aria-label="Settings sections"
                    className="hidden shrink-0 flex-col gap-1 self-stretch overflow-y-auto rounded-sm border border-slate-200 bg-white p-2 shadow-sm lg:flex lg:w-64"
                >
                    {TABS.map(({to, label, description, icon: Icon}) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({isActive}) =>
                                cn(
                                    "group flex items-center gap-3 rounded-sm px-3 py-2 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-slate-900 text-white"
                                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                                )
                            }
                        >
                            {({isActive}) => (
                                <>
                                    <span
                                        className={cn(
                                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-sm",
                                            isActive
                                                ? "bg-white/10 text-white"
                                                : "bg-slate-100 text-slate-500 group-hover:bg-white",
                                        )}
                                    >
                                        <Icon className="h-4 w-4"/>
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block leading-tight">{label}</span>
                                        <span
                                            className={cn(
                                                "mt-0.5 block text-xs font-normal leading-tight",
                                                isActive ? "text-slate-300" : "text-slate-400",
                                            )}
                                        >
                                            {description}
                                        </span>
                                    </span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Page content scrolls on its own on desktop */}
                <div className="min-w-0 lg:min-h-0 lg:flex-1">
                    <Outlet/>
                </div>
            </div>
        </div>
    );
}