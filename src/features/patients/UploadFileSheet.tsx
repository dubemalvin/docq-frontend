import {useEffect, useRef, useState, type ChangeEvent, type DragEvent} from "react";
import {Check, FileText, UploadCloud, X} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle} from "@/components/ui/sheet";
import Field from "@/components/Field";
import {useMe} from "@/features/auth/useAuth";
import {cn} from "@/lib/utils";
import {CATEGORY_LABEL, CLINICAL_CATEGORIES, formatBytes, useUploadFile, type FileCategory} from "./files";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

type Props = { open: boolean; onOpenChange: (open: boolean) => void; patientId: string };

export default function UploadFileSheet({open, onOpenChange, patientId}: Props) {
    const me = useMe();
    const isClinical = me.data?.role === "doctor" || me.data?.role === "nurse";
    const categories = (Object.keys(CATEGORY_LABEL) as FileCategory[]).filter(
        (category) => isClinical || !CLINICAL_CATEGORIES.includes(category),
    );

    const inputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);
    const [category, setCategory] = useState<FileCategory>("other");
    const [description, setDescription] = useState("");
    const [error, setError] = useState<string | null>(null);
    const upload = useUploadFile(patientId);

    useEffect(() => {
        if (!open) return;
        setFile(null);
        setCategory(categories[0]);
        setDescription("");
        setError(null);
        setDragging(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // Thumbnail for images; revoked when the file changes or the sheet closes
    useEffect(() => {
        if (!file || !file.type.startsWith("image/")) {
            setPreview(null);
            return;
        }
        const url = URL.createObjectURL(file);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    // Quick checks for a friendlier message; the server still makes the real decision
    function accept(picked: File | undefined | null) {
        setError(null);
        setFile(null);
        if (!picked) return;
        if (picked.size > MAX_BYTES) return setError(`That file is ${formatBytes(picked.size)}. The limit is 10 MB.`);
        if (picked.type && !ALLOWED_TYPES.includes(picked.type)) {
            return setError("Only PDF, JPG, PNG and WebP files are allowed.");
        }
        setFile(picked);
    }

    const onPick = (event: ChangeEvent<HTMLInputElement>) => accept(event.target.files?.[0]);

    function onDrop(event: DragEvent<HTMLLabelElement>) {
        event.preventDefault();
        setDragging(false);
        accept(event.dataTransfer.files?.[0]);
    }

    function clearFile() {
        setFile(null);
        setError(null);
        if (inputRef.current) inputRef.current.value = "";
    }

    function onSubmit() {
        if (!file) return;
        setError(null);
        upload.mutate(
            {file, category, description: description.trim()},
            {onSuccess: () => onOpenChange(false), onError: (e) => setError(e.message)},
        );
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
                <SheetHeader className="border-b border-slate-100">
                    <SheetTitle>Upload file</SheetTitle>
                    <SheetDescription>PDF, JPG, PNG or WebP, up to 10 MB.</SheetDescription>
                </SheetHeader>

                <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
                    {error && (
                        <p role="alert" className="rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {error}
                        </p>
                    )}

                    <Field label="File" htmlFor="file">
                        {file ? (
                            <div className="flex items-center gap-3 rounded-sm border border-slate-200 bg-slate-50 p-2.5">
                                {preview ? (
                                    <img src={preview} alt="" className="h-12 w-12 shrink-0 rounded-sm border border-slate-200 object-cover"/>
                                ) : (
                                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border border-slate-200 bg-white text-slate-500">
                                        <FileText className="h-5 w-5"/>
                                    </span>
                                )}
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-slate-900">{file.name}</p>
                                    <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={clearFile}
                                    aria-label="Remove file"
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900"
                                >
                                    <X className="h-4 w-4"/>
                                </button>
                            </div>
                        ) : (
                            <label
                                htmlFor="file"
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setDragging(true);
                                }}
                                onDragLeave={() => setDragging(false)}
                                onDrop={onDrop}
                                className={cn(
                                    "flex cursor-pointer flex-col items-center gap-2 rounded-sm border-2 border-dashed px-4 py-8 text-center transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-600",
                                    dragging
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50",
                                )}
                            >
                                <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-slate-100 text-blue-600">
                                    <UploadCloud className="h-5 w-5"/>
                                </span>
                                <span className="text-sm font-medium text-slate-900">
                                    {dragging ? "Drop to add" : "Drag a file here, or click to browse"}
                                </span>
                                <span className="text-xs text-slate-500">PDF, JPG, PNG or WebP</span>
                                <input
                                    ref={inputRef}
                                    id="file"
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                                    onChange={onPick}
                                    className="sr-only"
                                />
                            </label>
                        )}
                    </Field>

                    <div className="space-y-1.5">
                        <p id="category-label" className="text-sm font-medium text-slate-900">Type of file</p>
                        <div role="radiogroup" aria-labelledby="category-label" className="grid grid-cols-2 gap-2">
                            {categories.map((c) => {
                                const selected = c === category;
                                return (
                                    <button
                                        key={c}
                                        type="button"
                                        role="radio"
                                        aria-checked={selected}
                                        onClick={() => setCategory(c)}
                                        className={cn(
                                            "flex items-center justify-between gap-2 rounded-sm border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600",
                                            selected
                                                ? "border-blue-300 bg-blue-50 font-medium text-blue-700"
                                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                                        )}
                                    >
                                        <span className="truncate">{CATEGORY_LABEL[c]}</span>
                                        {selected && <Check className="h-4 w-4 shrink-0"/>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <Field label="Note (optional)" htmlFor="description">
                        <Input
                            id="description"
                            autoComplete="off"
                            placeholder="e.g. Bloods taken 12 August"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </Field>
                </div>

                <SheetFooter className="flex-row gap-2 border-t border-border px-4">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button className="flex-1" disabled={!file || upload.isPending} onClick={onSubmit}>
                        {upload.isPending ? "Uploading…" : "Upload"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}