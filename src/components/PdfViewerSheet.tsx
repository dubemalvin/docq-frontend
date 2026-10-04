import {useEffect, useRef, useState} from "react";
import * as pdfjs from "pdfjs-dist";
import type {PDFDocumentProxy, RenderTask} from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle} from "@/components/ui/sheet";

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    viewUrl: string;
    downloadUrl: string;
};

export default function PdfViewerSheet({open, onOpenChange, title, viewUrl, downloadUrl}: Props) {
    const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [zoom, setZoom] = useState(1);
    const [container, setContainer] = useState<HTMLDivElement | null>(null);
    const [width, setWidth] = useState(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Load the document whenever the viewer opens
    useEffect(() => {
        if (!open || !viewUrl) return;
        let cancelled = false;
        setDoc(null);
        setError(null);
        setPage(1);
        setZoom(1);
        const task = pdfjs.getDocument({url: viewUrl, withCredentials: true});
        task.promise
            .then((loaded) => {
                if (cancelled) loaded.destroy();
                else setDoc(loaded);
            })
            .catch(() => !cancelled && setError("Couldn't open this PDF."));
        return () => {
            cancelled = true;
            task.destroy();
        };
    }, [open, viewUrl]);

    // Track the available width so pages fit the panel
    useEffect(() => {
        if (!container) return;
        const observer = new ResizeObserver(() => setWidth(container.clientWidth));
        observer.observe(container);
        setWidth(container.clientWidth);
        return () => observer.disconnect();
    }, [container]);

    // Render the current page
    useEffect(() => {
        if (!doc || !width) return;
        let cancelled = false;
        let task: RenderTask | null = null;
        (async () => {
            const pdfPage = await doc.getPage(page);
            const canvas = canvasRef.current;
            if (cancelled || !canvas) return;
            const base = pdfPage.getViewport({scale: 1});
            const viewport = pdfPage.getViewport({scale: ((width - 32) / base.width) * zoom});
            const ratio = window.devicePixelRatio || 1;
            canvas.width = Math.floor(viewport.width * ratio);
            canvas.height = Math.floor(viewport.height * ratio);
            canvas.style.width = `${viewport.width}px`;
            canvas.style.height = `${viewport.height}px`;
            task = pdfPage.render({
                canvas,
                canvasContext: canvas.getContext("2d")!,
                viewport,
                transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : undefined,
            });
            await task.promise;
        })().catch(() => {
            /* cancelled renders throw; ignore */
        });
        return () => {
            cancelled = true;
            task?.cancel();
        };
    }, [doc, page, zoom, width]);

    const pages = doc?.numPages ?? 0;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col gap-0 sm:max-w-4xl!">
                <SheetHeader className="border-b border-border bg-white">
                    <SheetTitle className="truncate pr-8">{title}</SheetTitle>
                    <SheetDescription>{pages ? `${pages} page${pages === 1 ? "" : "s"}` : "PDF"}</SheetDescription>
                </SheetHeader>

                <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-white px-4 py-2">
                    <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-sm" aria-label="Previous page"
                                disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                            <ChevronLeft className="h-4 w-4"/>
                        </Button>
                        <span className="min-w-20 text-center text-sm text-slate-600">
                            {pages ? `${page} / ${pages}` : "–"}
                        </span>
                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-sm" aria-label="Next page"
                                disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                            <ChevronRight className="h-4 w-4"/>
                        </Button>
                    </div>

                    <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-sm" aria-label="Zoom out"
                                disabled={zoom <= 0.5} onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}>
                            <ZoomOut className="h-4 w-4"/>
                        </Button>
                        <button type="button" onClick={() => setZoom(1)}
                                className="min-w-12 text-center text-sm text-slate-600 hover:text-slate-900">
                            {Math.round(zoom * 100)}%
                        </button>
                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-sm" aria-label="Zoom in"
                                disabled={zoom >= 3} onClick={() => setZoom((z) => Math.min(3, z + 0.25))}>
                            <ZoomIn className="h-4 w-4"/>
                        </Button>
                        <a href={downloadUrl} aria-label="Download"
                           className="ml-1 flex h-8 w-8 items-center justify-center rounded-sm border border-input bg-white text-slate-600 hover:bg-slate-50">
                            <Download className="h-4 w-4"/>
                        </a>
                    </div>
                </div>

                <div ref={setContainer} className="flex min-h-0 flex-1 justify-center-safe overflow-auto bg-slate-200 p-4">
                    {error ? (
                        <p className="self-start rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </p>
                    ) : !doc ? (
                        <p className="self-start text-sm text-slate-500">Loading…</p>
                    ) : (
                        <canvas ref={canvasRef} className="h-fit shrink-0 bg-white shadow-md"/>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}