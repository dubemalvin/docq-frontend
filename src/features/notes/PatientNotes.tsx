import {useState} from "react";
import {format, parseISO} from "date-fns";
import {History, Pencil, StickyNote} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Textarea} from "@/components/ui/textarea";
import {cn} from "@/lib/utils";
import {useCreateNote, useNotes, useNoteVersions, useUpdateNote, type Note} from "./hooks";

const stamp = (iso: string) => format(parseISO(iso), "d MMM yyyy, HH:mm");

function NoteItem({note, patientId}: { note: Note; patientId: string }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(note.latest_content);
    const [showHistory, setShowHistory] = useState(false);
    const update = useUpdateNote(patientId);
    const versions = useNoteVersions(note.id, showHistory);

    function save() {
        const content = draft.trim();
        if (!content) return;
        update.mutate({id: note.id, content}, {onSuccess: () => setEditing(false)});
    }

    return (
        <li className="space-y-2 rounded-sm border border-slate-200 bg-white p-3">
            <div className="flex items-start justify-between gap-2 text-xs text-slate-500">
                <span className="min-w-0">
                    <span className="font-medium text-slate-700">{note.author_name || "Unknown"}</span>
                    <span className="block text-slate-400">
                        {stamp(note.created_at)}
                        {note.latest_version > 1 && ` · edited ${stamp(note.updated_at)}`}
                    </span>
                </span>
                {!editing && (
                    <button
                        className="inline-flex shrink-0 items-center gap-1 text-blue-600 hover:underline"
                        onClick={() => {
                            setDraft(note.latest_content);
                            setEditing(true);
                        }}
                    >
                        <Pencil className="h-3 w-3"/> Edit
                    </button>
                )}
            </div>

            {editing ? (
                <div className="space-y-2">
                    <Textarea rows={4} className="rounded-sm" value={draft}
                              onChange={(event) => setDraft(event.target.value)} autoFocus/>
                    {update.isError && <p className="text-sm text-red-600">{update.error.message}</p>}
                    <div className="flex gap-2">
                        <Button size="sm" className="rounded-sm" disabled={update.isPending || !draft.trim()}
                                onClick={save}>
                            {update.isPending ? "Saving…" : "Save new version"}
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-sm"
                                onClick={() => setEditing(false)}>
                            Cancel
                        </Button>
                    </div>
                </div>
            ) : (
                <p className="whitespace-pre-line text-sm text-slate-800">{note.latest_content}</p>
            )}

            {note.latest_version > 1 && (
                <div>
                    <button
                        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
                        onClick={() => setShowHistory((value) => !value)}
                    >
                        <History className="h-3 w-3"/>
                        {showHistory ? "Hide history" : `History (${note.latest_version} versions)`}
                    </button>
                    {showHistory && (
                        <ol className="mt-2 space-y-2 border-l-2 border-slate-200 pl-3">
                            {versions.isLoading && <li className="text-xs text-slate-500">Loading…</li>}
                            {versions.data?.map((v, index) => (
                                <li key={v.id} className="text-sm">
                                    <p className="text-xs text-slate-500">
                                        {index === 0 ? "Current · " : ""}Version {v.version} ·{" "}
                                        {v.edited_by_name || "Unknown"} · {stamp(v.created_at)}
                                    </p>
                                    <p className="whitespace-pre-line text-slate-600">{v.content}</p>
                                </li>
                            ))}
                        </ol>
                    )}
                </div>
            )}
        </li>
    );
}

export default function PatientNotes({patientId, className}: { patientId: string; className?: string }) {
    const notes = useNotes(patientId);
    const create = useCreateNote(patientId);
    const [text, setText] = useState("");

    function add() {
        const content = text.trim();
        if (!content) return;
        create.mutate(content, {onSuccess: () => setText("")});
    }

    return (
        <section
            className={cn("flex min-h-0 flex-col rounded-sm border border-slate-200 bg-white shadow-sm", className)}
        >
            <h2 className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Clinical notes
                {notes.data && <span className="font-medium normal-case text-slate-400">{notes.data.length}</span>}
            </h2>

            {/* Notes list scrolls */}
            <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-3">
                {notes.isLoading && <p className="text-sm text-slate-500">Loading…</p>}
                {notes.isError && <p className="text-sm text-red-600">Couldn't load notes.</p>}
                {notes.data?.length === 0 && (
                    <div className="flex flex-col items-center gap-2 py-10 text-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-slate-100 text-slate-400">
                            <StickyNote className="h-5 w-5"/>
                        </div>
                        <p className="text-sm text-slate-500">No notes yet.</p>
                    </div>
                )}
                <ul className="space-y-2">
                    {notes.data?.map((note) => <NoteItem key={note.id} note={note} patientId={patientId}/>)}
                </ul>
            </div>

            {/* Composer pinned at the bottom */}
            <div className="shrink-0 space-y-2 border-t border-slate-200 p-3">
                <Textarea
                    rows={3}
                    className="rounded-sm bg-white"
                    placeholder="Write a consultation note…"
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                />
                {create.isError && <p className="text-sm text-red-600">{create.error.message}</p>}
                <Button size="sm" className="w-full rounded-sm" disabled={create.isPending || !text.trim()}
                        onClick={add}>
                    {create.isPending ? "Saving…" : "Add note"}
                </Button>
            </div>
        </section>
    );
}