import {useState} from "react";
import {NavLink, Outlet} from "react-router";
import {LogOut, Menu, X} from "lucide-react";
import {navFor} from "@/app/navigation";
import {useLogout, useMe} from "@/features/auth/useAuth";
import {Button} from "@/components/ui/button";
import {cn} from "@/lib/utils";
import NotificationBell from "@/features/notifications/NotificationBell";

const linkClass = ({isActive}: { isActive: boolean }) =>
    cn(
        "flex items-center gap-2 rounded-sm px-4 py-1.5 text-sm font-medium transition-all duration-150",
        isActive
            ? "bg-white text-slate-900 shadow-sm"
            : "text-slate-300 hover:bg-white/10 hover:text-white"
    );

const mobileLinkClass = ({isActive}: { isActive: boolean }) =>
    cn(
        "flex items-center gap-3 rounded-sm px-3 py-3 text-sm font-medium transition-colors",
        isActive
            ? "bg-white text-slate-900 shadow-sm"
            : "text-slate-300 hover:bg-white/10 hover:text-white"
    );

export default function AppShell() {
    const [open, setOpen] = useState(false); // mobile menu
    const me = useMe();
    const logout = useLogout();
    const user = me.data;
    if (!user) return null; // RequireAuth guarantees a user; this just satisfies TypeScript

    const items = navFor(user.role);
    const initials = `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase();
    const roleLabel = user.role.replace("_", " ");

    return (
        <div className="flex h-screen flex-col bg-slate-50">
            <header className="sticky top-0 z-40 shrink-0 bg-slate-900 text-white shadow-md">
                <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-2 md:gap-6">
                    {/* Brand */}
                    <NavLink
                        to="/"
                        className="flex items-center gap-2 justify-self-start"
                        onClick={() => setOpen(false)}
                    >
                        <img
                            src="/doc_icon.svg"
                            alt="Docq"
                            className="h-16 w-16 shrink-0 object-contain md:h-16 md:w-16"
                        />
                        <div className="leading-tight">
                            <p className="text-lg font-semibold tracking-tight">Docq</p>
                            <p className="hidden max-w-40 truncate text-[11px] text-slate-400 sm:block">
                                {user.practice?.name}
                            </p>
                        </div>
                    </NavLink>

                    {/* Desktop links (centered tray) */}
                    <nav className="hidden items-center md:flex">
                        <div className="flex items-center gap-1 rounded-sm bg-white/5 p-1 ring-1 ring-white/10">
                            {items.map(({to, label, icon: Icon}) => (
                                <NavLink key={to} to={to} end={to === "/"} className={linkClass}>
                                    <Icon className="h-4 w-4"/>
                                    {label}
                                </NavLink>
                            ))}
                        </div>
                    </nav>

                    {/* Right side */}
                    <div className="col-start-3 flex items-center gap-2 justify-self-end">
                        <NotificationBell/>

                        <div className="mx-1 hidden h-6 w-px bg-white/10 sm:block"/>

                        <div className="hidden items-center gap-2.5 sm:flex">
                            <div
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-semibold ring-1 ring-white/20">
                                {initials}
                            </div>
                            <div className="text-left text-sm leading-tight">
                                <p className="font-medium">{user.first_name} {user.last_name}</p>
                                <p className="text-xs capitalize text-slate-400">{roleLabel}</p>
                            </div>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Log out"
                            title="Log out"
                            className="hidden text-slate-300 hover:bg-white/10 hover:text-white md:inline-flex"
                            onClick={() => logout.mutate()}
                        >
                            <LogOut className="h-4 w-4"/>
                        </Button>

                        {/* Hamburger (mobile only) */}
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Toggle menu"
                            aria-expanded={open}
                            aria-controls="mobile-menu"
                            className="text-white hover:bg-white/10 hover:text-white md:hidden"
                            onClick={() => setOpen((value) => !value)}
                        >
                            {open ? <X className="h-5 w-5"/> : <Menu className="h-5 w-5"/>}
                        </Button>
                    </div>
                </div>

                {/* Mobile menu: no background of its own, so it matches the header exactly */}
                {open && (
                    <div
                        id="mobile-menu"
                        className="animate-in fade-in slide-in-from-top-2 border-t border-white/10 px-4 pb-4 pt-3 duration-150 md:hidden"
                    >
                        <nav className="flex flex-col gap-1">
                            {items.map(({to, label, icon: Icon}) => (
                                <NavLink
                                    key={to}
                                    to={to}
                                    end={to === "/"}
                                    className={mobileLinkClass}
                                    onClick={() => setOpen(false)}
                                >
                                    <Icon className="h-4 w-4"/>
                                    {label}
                                </NavLink>
                            ))}
                        </nav>

                        <div className="mt-3 flex items-center justify-between gap-3 rounded-sm bg-white/5 p-3 ring-1 ring-white/10">
                            <div className="flex min-w-0 items-center gap-3">
                                <div
                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold ring-1 ring-white/20">
                                    {initials}
                                </div>
                                <div className="min-w-0 text-sm leading-tight">
                                    <p className="truncate font-medium">{user.first_name} {user.last_name}</p>
                                    <p className="truncate text-xs capitalize text-slate-400">{roleLabel}</p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="shrink-0 text-slate-300 hover:bg-white/10 hover:text-white"
                                onClick={() => logout.mutate()}
                            >
                                <LogOut className="mr-2 h-4 w-4"/> Log out
                            </Button>
                        </div>
                    </div>
                )}
            </header>

            <main className="min-h-0 w-full flex-1 overflow-y-auto p-4 md:p-6">
                <Outlet/>
            </main>
        </div>
    );
}