import {useEffect, useRef, useState, type ChangeEvent, type InputHTMLAttributes, type KeyboardEvent} from "react";
import {Camera, X} from "lucide-react";
import {Input} from "@/components/ui/input";
import {cn} from "@/lib/utils";
import {useProfilePhoto, type Option} from "./profile";

export const selectClass =
    "h-9 w-full rounded-sm border border-input bg-white px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

function Pill({label, onRemove}: { label: string; onRemove: () => void }) {
    return (
        <span className="inline-flex items-center gap-1 rounded-sm border border-blue-200 bg-blue-50 py-0.5 pl-2 pr-1 text-xs font-medium text-blue-700">
            {label}
            <button
                type="button"
                aria-label={`Remove ${label}`}
                onClick={onRemove}
                className="rounded-sm p-0.5 hover:bg-blue-100"
            >
                <X className="h-3 w-3"/>
            </button>
        </span>
    );
}

/** Switch row. Controlled checkbox, no pills or circles. */
export function Toggle({title, description, className, ...props}: InputHTMLAttributes<HTMLInputElement> & {
    title: string;
    description?: string;
}) {
    return (
        <label
            className={cn(
                "flex cursor-pointer items-center justify-between gap-3 rounded-sm border border-slate-200 px-3 py-2 transition-colors hover:bg-slate-50",
                className,
            )}
        >
            <span className="min-w-0">
                <span className="block text-sm font-medium text-slate-900">{title}</span>
                {description && <span className="block text-xs text-slate-500">{description}</span>}
            </span>
            <span className="relative shrink-0">
                <input type="checkbox" className="peer sr-only" {...props} />
                <span className="block h-5 w-9 rounded-sm bg-slate-300 transition-colors peer-checked:bg-blue-600 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-600 peer-focus-visible:ring-offset-2"/>
                <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-sm bg-white shadow-sm transition-transform peer-checked:translate-x-4"/>
            </span>
        </label>
    );
}

/** Pick several items from a fixed list (languages). */
export function ChipPicker({options, value, onChange, exclude = [], placeholder}: {
    options: Option[];
    value: string[];
    onChange: (value: string[]) => void;
    exclude?: string[];
    placeholder: string;
}) {
    const labelOf = (code: string) => options.find((o) => o.value === code)?.label ?? code;
    const available = options.filter((o) => !value.includes(o.value) && !exclude.includes(o.value));
    return (
        <div className="space-y-2">
            {value.length > 0 && (
                <ul className="flex flex-wrap gap-1.5">
                    {value.map((code) => (
                        <li key={code}>
                            <Pill label={labelOf(code)} onRemove={() => onChange(value.filter((c) => c !== code))}/>
                        </li>
                    ))}
                </ul>
            )}
            <select
                className={selectClass}
                value=""
                onChange={(event) => event.target.value && onChange([...value, event.target.value])}
            >
                <option value="">{placeholder}</option>
                {available.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        </div>
    );
}

/** Free-text tags (special interests): type and press Enter or comma. */
export function TagInput({value, onChange, max = 10, placeholder}: {
    value: string[];
    onChange: (value: string[]) => void;
    max?: number;
    placeholder: string;
}) {
    const [draft, setDraft] = useState("");

    function commit() {
        const text = draft.replace(/\s+/g, " ").trim();
        setDraft("");
        if (!text || value.length >= max) return;
        if (value.some((tag) => tag.toLowerCase() === text.toLowerCase())) return;
        onChange([...value, text]);
    }

    function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            commit();
        } else if (event.key === "Backspace" && !draft && value.length) {
            onChange(value.slice(0, -1));
        }
    }

    return (
        <div className="space-y-2">
            {value.length > 0 && (
                <ul className="flex flex-wrap gap-1.5">
                    {value.map((tag) => (
                        <li key={tag}><Pill label={tag} onRemove={() => onChange(value.filter((t) => t !== tag))}/></li>
                    ))}
                </ul>
            )}
            <Input
                value={draft}
                disabled={value.length >= max}
                placeholder={value.length >= max ? `Maximum of ${max} reached` : placeholder}
                maxLength={60}
                className="bg-white"
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={onKeyDown}
                onBlur={commit}
            />
            <p className="text-xs text-slate-500">{value.length}/{max} · Press Enter after each one.</p>
        </div>
    );
}

/** Profile photo with change/remove. Compact so it fits beside other content. */
export function ProfilePhoto({name, photoPath, hasPhoto, version}: {
    name: string;
    photoPath: string;
    hasPhoto: boolean;
    version: string | null;
}) {
    const {upload, remove} = useProfilePhoto(photoPath);
    const inputRef = useRef<HTMLInputElement>(null);
    const [broken, setBroken] = useState(false);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => setBroken(false), [version]);

    const initials = name.replace(/^(dr|prof|sr|mr|ms|mrs)\.?\s+/i, "").split(/\s+/).filter(Boolean)
        .slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");

    function onPick(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        setError(null);
        upload.mutate(file, {onError: (e) => setError(e.message)});
    }

    return (
        <div className="flex items-center gap-4">
            <div className="relative shrink-0">
                {hasPhoto && !broken ? (
                    <img
                        src={`/api${photoPath}?v=${encodeURIComponent(version ?? "")}`}
                        alt={name}
                        onError={() => setBroken(true)}
                        className="h-20 w-20 rounded-sm object-cover"
                    />
                ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-sm bg-slate-900 text-2xl font-semibold text-white">
                        {initials}
                    </div>
                )}
                <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onPick}/>
                <button
                    type="button"
                    aria-label={hasPhoto ? "Change photo" : "Add photo"}
                    disabled={upload.isPending}
                    onClick={() => inputRef.current?.click()}
                    className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-sm border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-50"
                >
                    <Camera className="h-3.5 w-3.5"/>
                </button>
            </div>
            <div className="min-w-0 space-y-1 text-sm">
                <p className="text-slate-600">A friendly, well-lit headshot works best.</p>
                {upload.isPending && <p className="text-xs text-slate-500">Uploading…</p>}
                {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
                {hasPhoto && !upload.isPending && (
                    <button
                        type="button"
                        className="text-xs text-slate-500 hover:text-red-600 hover:underline"
                        disabled={remove.isPending}
                        onClick={() => remove.mutate()}
                    >
                        Remove photo
                    </button>
                )}
            </div>
        </div>
    );
}