import {useEffect, useState} from "react";
import {Copy, Plus, X} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle} from "@/components/ui/sheet";
import {Switch} from "@/components/ToggleRow";
import {cn} from "@/lib/utils";
import {
    useSaveWorkingHours, useWorkingHours, type PractitionerFull, type WorkingBlock,
} from "@/features/settings/practitioners";

type Block = { start: string; end: string }; // "HH:MM"
type Day = { weekday: number; blocks: Block[] };

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function fromServer(rows: WorkingBlock[]): Day[] {
    return DAY_NAMES.map((_, weekday) => ({
        weekday,
        blocks: rows
            .filter((row) => row.weekday === weekday)
            .sort((a, b) => a.start_time.localeCompare(b.start_time))
            .map((row) => ({start: row.start_time.slice(0, 5), end: row.end_time.slice(0, 5)})),
    }));
}

function validate(days: Day[]): string | null {
    for (const day of days) {
        const name = DAY_NAMES[day.weekday];
        const sorted = [...day.blocks].sort((a, b) => a.start.localeCompare(b.start));
        for (const [index, block] of sorted.entries()) {
            if (!block.start || !block.end) return `${name}: fill in both times.`;
            if (block.end <= block.start) return `${name}: the end time must be after the start time.`;
            if (index > 0 && block.start < sorted[index - 1].end) return `${name}: blocks cannot overlap.`;
        }
    }
    return null;
}

type Props = { practitioner: PractitionerFull | null; onOpenChange: (open: boolean) => void };

export default function WorkingHoursSheet({practitioner, onOpenChange}: Props) {
    const hours = useWorkingHours(practitioner?.id ?? null);
    const save = useSaveWorkingHours(practitioner?.id ?? "");
    const [days, setDays] = useState<Day[] | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    // Load the schedule into the editor once per opening (a background refetch must not wipe edits)
    useEffect(() => {
        if (!practitioner) {
            setDays(null);
            setFormError(null);
        } else if (hours.data && days === null) {
            setDays(fromServer(hours.data));
        }
    }, [practitioner, hours.data, days]);

    function changeDay(weekday: number, change: (blocks: Block[]) => Block[]) {
        setDays((current) => current && current.map((d) => (d.weekday === weekday ? {...d, blocks: change(d.blocks)} : d)));
    }

    function copyMondayToWeekdays() {
        setDays((current) => {
            if (!current) return current;
            const monday = current[0].blocks;
            return current.map((d) => (d.weekday >= 1 && d.weekday <= 4 ? {...d, blocks: monday.map((b) => ({...b}))} : d));
        });
    }

    function onSave() {
        if (!days) return;
        const problem = validate(days);
        if (problem) return setFormError(problem);
        setFormError(null);
        save.mutate(
            days.flatMap((d) => d.blocks.map((b) => ({weekday: d.weekday, start_time: b.start, end_time: b.end}))),
            {onSuccess: () => onOpenChange(false), onError: (error) => setFormError(error.message)},
        );
    }

    return (
        <Sheet open={practitioner !== null} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
                <SheetHeader className="border-b border-border">
                    <SheetTitle>Working hours</SheetTitle>
                    <SheetDescription>{practitioner?.display_name}. Patients can only book inside these times.</SheetDescription>
                </SheetHeader>

                <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                    {hours.isLoading && <p className="text-sm text-slate-500">Loading…</p>}
                    {hours.isError && <p className="text-sm text-red-600">Couldn't load the schedule.</p>}

                    {formError && (
                        <p role="alert" className="rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {formError}
                        </p>
                    )}

                    {days && (
                        <>
                            <div className="flex justify-end">
                                <Button type="button" variant="outline" size="sm" onClick={copyMondayToWeekdays}>
                                    <Copy className="mr-1.5 h-3.5 w-3.5"/> Copy Monday to Tue – Fri
                                </Button>
                            </div>

                            <div className="divide-y divide-slate-100 rounded-sm border border-slate-200 bg-white">
                                {days.map((day) => {
                                    const isOpen = day.blocks.length > 0;
                                    return (
                                        <div key={day.weekday}
                                             className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-start">
                                            <label
                                                className="flex w-40 shrink-0 cursor-pointer items-center justify-between gap-3 sm:justify-start sm:pt-1">
                                                <Switch
                                                    checked={isOpen}
                                                    onChange={(event) =>
                                                        changeDay(day.weekday, () => (event.target.checked ? [{
                                                            start: "08:00",
                                                            end: "17:00"
                                                        }] : []))
                                                    }
                                                />
                                                <span
                                                    className={cn("flex-1 text-sm font-medium sm:flex-none", isOpen ? "text-slate-900" : "text-slate-400")}>
                                                    {DAY_NAMES[day.weekday]}
                                                </span>
                                            </label>

                                            <div className="min-w-0 flex-1 space-y-2">
                                                {!isOpen && <p className="text-sm text-slate-400 sm:pt-1">Closed</p>}
                                                {day.blocks.map((block, index) => (
                                                    <div key={index} className="flex items-center gap-2">
                                                        <Input
                                                            type="time"
                                                            aria-label={`${DAY_NAMES[day.weekday]} start`}
                                                            value={block.start}
                                                            onChange={(event) =>
                                                                changeDay(day.weekday, (blocks) => blocks.map((b, i) => (i === index ? {
                                                                    ...b,
                                                                    start: event.target.value
                                                                } : b)))
                                                            }
                                                        />
                                                        <span className="text-xs text-slate-500">to</span>
                                                        <Input
                                                            type="time"
                                                            aria-label={`${DAY_NAMES[day.weekday]} end`}
                                                            value={block.end}
                                                            onChange={(event) =>
                                                                changeDay(day.weekday, (blocks) => blocks.map((b, i) => (i === index ? {
                                                                    ...b,
                                                                    end: event.target.value
                                                                } : b)))
                                                            }
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            aria-label="Remove block"
                                                            className="shrink-0"
                                                            onClick={() => changeDay(day.weekday, (blocks) => blocks.filter((_, i) => i !== index))}
                                                        >
                                                            <X className="h-4 w-4"/>
                                                        </Button>
                                                    </div>
                                                ))}
                                                {isOpen && (
                                                    <button
                                                        type="button"
                                                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                                                        onClick={() =>
                                                            changeDay(day.weekday, (blocks) => [
                                                                ...blocks,
                                                                blocks.length ? {
                                                                    start: "13:30",
                                                                    end: "17:00"
                                                                } : {start: "08:00", end: "17:00"},
                                                            ])
                                                        }
                                                    >
                                                        <Plus className="h-3 w-3"/> Add block (e.g. after lunch)
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                <SheetFooter className="flex-row gap-2 border-t border-border px-4">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button className="flex-1" disabled={!days || save.isPending} onClick={onSave}>
                        {save.isPending ? "Saving…" : "Save hours"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}