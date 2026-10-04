import {useMemo, useState, type ReactNode} from "react";
import {Search, SlidersHorizontal, X} from "lucide-react";
import {selectClass} from "@/features/practitioners/ProfileBlocks";
import {cn} from "@/lib/utils";
import DoctorCard, {DoctorProfileSheet} from "./DoctorCard";
import {applyFilters, filterOptions, hasAnyFilter, NO_FILTERS, type DoctorFilters} from "./doctorFilters";
import type {PublicPractitioner} from "./hooks";

type Props = {
    slug: string;
    doctors: PublicPractitioner[];
    typeId: string;
    maxDaysAhead: number;
    onBook: (doctorId: string, slot?: string) => void;
};

function FilterSelect({label, value, onChange, children}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    children: ReactNode;
}) {
    return (
        <select aria-label={label} className={selectClass} value={value} onChange={(e) => onChange(e.target.value)}>
            <option value="">{label}</option>
            {children}
        </select>
    );
}

function matchesSearch(d: PublicPractitioner, query: string) {
    if (!query) return true;
    const haystack = [
        d.display_name, d.specialty, d.discipline_label,
        ...(d.languages_fluent ?? []).map((l) => l.label),
        ...(d.languages_conversational ?? []).map((l) => l.label),
        ...(d.special_interests ?? []),
        ...(d.qualifications ?? []).map((q) => q.degree),
    ].filter(Boolean).join(" ").toLowerCase();
    return query.toLowerCase().split(/\s+/).every((word) => haystack.includes(word));
}

export default function DoctorPicker({slug, doctors, typeId, maxDaysAhead, onBook}: Props) {
    const [filters, setFilters] = useState<DoctorFilters>(NO_FILTERS);
    const [search, setSearch] = useState("");
    const [panelOpen, setPanelOpen] = useState(false);
    const [reading, setReading] = useState<PublicPractitioner | null>(null);

    const options = useMemo(() => filterOptions(doctors), [doctors]);
    const shown = useMemo(
        () => applyFilters(doctors, filters).filter((d) => matchesSearch(d, search.trim())),
        [doctors, filters, search],
    );

    const showFilters = doctors.length >= 2 && options.hasAny;
    const activeCount = [filters.gender, filters.language, filters.discipline, filters.interest]
        .filter(Boolean).length + (filters.acceptingOnly ? 1 : 0);
    const change = (patch: Partial<DoctorFilters>) => setFilters((current) => ({...current, ...patch}));
    const clearAll = () => {
        setFilters(NO_FILTERS);
        setSearch("");
    };

    return (
        <div className="space-y-4">
            {doctors.length >= 2 && (
                <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/>
                            <input
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name, language, qualification or speciality"
                                aria-label="Search doctors"
                                className="h-10 w-full rounded-md border border-input bg-transparent pl-9 pr-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            />
                        </div>
                        {showFilters && (
                            <button
                                type="button"
                                onClick={() => setPanelOpen((open) => !open)}
                                aria-expanded={panelOpen}
                                className={cn(
                                    "inline-flex h-10 shrink-0 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors",
                                    panelOpen || activeCount ? "border-slate-900 bg-slate-900 text-white" : "border-input bg-white text-slate-700 hover:bg-slate-50",
                                )}
                            >
                                <SlidersHorizontal className="h-4 w-4"/>
                                <span className="hidden sm:inline">Filters</span>
                                {activeCount > 0 && (
                                    <span className="rounded-full bg-white px-1.5 text-xs text-slate-900">{activeCount}</span>
                                )}
                            </button>
                        )}
                    </div>

                    {showFilters && panelOpen && (
                        <div className="space-y-3 border-t border-slate-100 pt-3">
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                                {options.genders.length > 0 && (
                                    <FilterSelect label="Any gender" value={filters.gender}
                                                  onChange={(gender) => change({gender})}>
                                        {options.genders.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </FilterSelect>
                                )}
                                {options.languages.length > 0 && (
                                    <FilterSelect label="Any language" value={filters.language}
                                                  onChange={(language) => change({language})}>
                                        {options.languages.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </FilterSelect>
                                )}
                                {options.disciplines.length > 0 && (
                                    <FilterSelect label="Any field" value={filters.discipline}
                                                  onChange={(discipline) => change({discipline})}>
                                        {options.disciplines.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </FilterSelect>
                                )}
                                {options.interests.length > 0 && (
                                    <FilterSelect label="Any interest" value={filters.interest}
                                                  onChange={(interest) => change({interest})}>
                                        {options.interests.map((i) => <option key={i} value={i}>{i}</option>)}
                                    </FilterSelect>
                                )}
                            </div>
                            <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4"
                                    checked={filters.acceptingOnly}
                                    onChange={(e) => change({acceptingOnly: e.target.checked})}
                                />
                                Only doctors accepting new patients
                            </label>
                        </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{shown.length} of {doctors.length} doctors</span>
                        {(hasAnyFilter(filters) || search) && (
                            <button type="button" onClick={clearAll}
                                    className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline">
                                <X className="h-3 w-3"/> Clear all
                            </button>
                        )}
                    </div>
                </div>
            )}

            {shown.length === 0 ? (
                <p className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-600">
                    No doctors match your search.{" "}
                    <button type="button" className="font-medium text-blue-600 hover:underline" onClick={clearAll}>
                        Clear all
                    </button>
                </p>
            ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-4">
                    {shown.map((doctor) => (
                        <DoctorCard
                            key={doctor.id}
                            slug={slug}
                            doctor={doctor}
                            typeId={typeId}
                            maxDaysAhead={maxDaysAhead}
                            onBook={() => onBook(doctor.id)}
                            onPickSlot={(iso) => onBook(doctor.id, iso)}
                            onReadMore={() => setReading(doctor)}
                        />
                    ))}
                </div>
            )}

            <DoctorProfileSheet
                doctor={reading}
                onClose={() => setReading(null)}
                onBook={() => reading && onBook(reading.id)}
            />
        </div>
    );
}