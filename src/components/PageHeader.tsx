import type {ReactNode} from "react";
import {Link} from "react-router";
import {ArrowLeft, type LucideIcon} from "lucide-react";
import {buttonVariants} from "@/components/ui/button";
import {cn} from "@/lib/utils";

interface PageHeaderAction {
    label: string;
    icon: LucideIcon;
    href?: string;
    onClick?: () => void;
    variant?: "primary" | "secondary";
}

interface PageHeaderProps {
    icon?: LucideIcon;
    title: string;
    subtitle?: string;
    /** Small element next to the title, e.g. an "Archived" pill. */
    badge?: ReactNode;
    backHref?: string | (() => void);
    actions?: PageHeaderAction[];
    /** Toolbar content (search, filters). Own row on mobile, shares the title row on sm+. */
    children?: ReactNode;
}

const backCls =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 active:scale-95";

export function PageHeader({
                               icon: Icon,
                               title,
                               subtitle,
                               badge,
                               backHref,
                               actions = [],
                               children,
                           }: PageHeaderProps) {
    const renderAction = (action: PageHeaderAction) => {
        const ActionIcon = action.icon;
        const cls = cn(
            buttonVariants({variant: action.variant === "secondary" ? "outline" : "default"}),
            "max-sm:w-8 max-sm:px-0"
        );
        const content = (
            <>
                <ActionIcon className="h-4 w-4 sm:mr-1.5"/>
                <span className="hidden sm:inline">{action.label}</span>
            </>
        );

        return action.href ? (
            <Link key={action.label} to={action.href} className={cls} aria-label={action.label}>
                {content}
            </Link>
        ) : (
            <button key={action.label} type="button" onClick={action.onClick} className={cls}
                    aria-label={action.label}>
                {content}
            </button>
        );
    };

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Back + icon + title + (mobile) actions: always one row */}
            <div className="flex min-w-0 items-center gap-3">
                {backHref &&
                    (typeof backHref === "string" ? (
                        <Link to={backHref} aria-label="Back" className={backCls}>
                            <ArrowLeft className="h-4 w-4"/>
                        </Link>
                    ) : (
                        <button type="button" onClick={backHref} aria-label="Back" className={backCls}>
                            <ArrowLeft className="h-4 w-4"/>
                        </button>
                    ))}

                {Icon && (
                    <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-blue-600 shadow-sm">
                        <Icon className="h-5 w-5"/>
                    </div>
                )}

                <div className="min-w-0 flex-1 sm:flex-initial">
                    <div className="flex items-center gap-2">
                        <h1 className="truncate text-lg font-semibold leading-tight text-slate-900 sm:text-xl">
                            {title}
                        </h1>
                        {badge}
                    </div>
                    {subtitle && <p className="truncate text-sm leading-tight text-slate-500">{subtitle}</p>}
                </div>

                {actions.length > 0 && (
                    <div className="flex shrink-0 gap-2 sm:hidden">{actions.map(renderAction)}</div>
                )}
            </div>

            {(children || actions.length > 0) && (
                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap sm:justify-end">
                    {children}
                    {actions.length > 0 && (
                        <div className="hidden shrink-0 gap-2 sm:flex">{actions.map(renderAction)}</div>
                    )}
                </div>
            )}
        </div>
    );
}