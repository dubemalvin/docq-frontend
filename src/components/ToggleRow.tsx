import type {InputHTMLAttributes} from "react";
import {cn} from "@/lib/utils";

/** A real checkbox drawn as a switch, so it works with react-hook-form's register(). */
export function Switch({className, ...props}: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <span className={cn("relative inline-block shrink-0", className)}>
            <input type="checkbox" className="peer sr-only" {...props} />
            <span
                className="block h-5 w-9 rounded-full bg-slate-300 transition-colors peer-checked:bg-blue-600 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-600 peer-focus-visible:ring-offset-2 peer-disabled:opacity-50"/>
            <span
                className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4"/>
        </span>
    );
}

/** Bordered row with a title, optional description and a switch on the right. */
export default function ToggleRow({title, description, className, ...props}: InputHTMLAttributes<HTMLInputElement> & {
    title: string;
    description?: string;
}) {
    return (
        <label
            className={cn(
                "flex cursor-pointer items-center justify-between gap-4 rounded-sm border border-slate-200 px-3 py-2.5 transition-colors hover:bg-slate-50",
                className,
            )}
        >
            <span className="min-w-0">
                <span className="block text-sm font-medium text-slate-900">{title}</span>
                {description && <span className="block text-xs text-slate-500">{description}</span>}
            </span>
            <Switch {...props} />
        </label>
    );
}