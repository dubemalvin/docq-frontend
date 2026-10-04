import {
    CalendarDays, LayoutDashboard, MessageSquare, Settings, Users, type LucideIcon, UserCircle,
} from "lucide-react";
import type {Role} from "@/features/auth/types";

export type NavItem = { to: string; label: string; icon: LucideIcon; roles?: Role[] };

// No `roles` means every staff role can see it.
export const NAV_ITEMS: NavItem[] = [
    {to: "/diary", label: "Diary", icon: CalendarDays},
    {to: "/patients", label: "Patients", icon: Users},
    {to: "/messages", label: "Messages", icon: MessageSquare, roles: ["receptionist", "practice_manager"]},
    {to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["practice_manager"]},
    { to: "/profile", label: "My profile", icon: UserCircle, roles: ["doctor", "nurse"] },
    {to: "/settings", label: "Settings", icon: Settings, roles: ["practice_manager"]},
];

export const navFor = (role: Role) => NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));