import type {FieldValues, Path, UseFormSetError} from "react-hook-form";
import {ApiError} from "@/lib/api";

/** Maps Django's { field: ["message"] } errors onto form fields.
 *  Returns a general message for anything that isn't a field error, or null. */
export function applyServerErrors<T extends FieldValues>(
    error: unknown,
    setError: UseFormSetError<T>,
    fields: readonly string[],
): string | null {
    if (!(error instanceof ApiError)) return "Something went wrong. Please try again.";
    const data = (error.data ?? {}) as Record<string, unknown>;
    let general: string | null = null;
    let matched = false;
    for (const [key, value] of Object.entries(data)) {
        const message = Array.isArray(value) ? String(value[0]) : typeof value === "string" ? value : null;
        if (!message) continue;
        if (fields.includes(key)) {
            setError(key as Path<T>, {type: "server", message});
            matched = true;
        } else {
            general = message; // non_field_errors, detail, ...
        }
    }
    return matched && !general ? null : (general ?? error.message);
}