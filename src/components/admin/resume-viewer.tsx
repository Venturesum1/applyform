"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Loader2,
  Maximize,
  Minimize,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

const MIN_SCALE = 0.6;
const MAX_SCALE = 2.4;

export function ResumeViewer({ applicationId }: { applicationId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadError, setLoadError] = useState<string>();

  const inlineUrl = `/api/admin/applications/${applicationId}/resume?mode=inline`;
  const downloadUrl = `/api/admin/applications/${applicationId}/resume?mode=download`;

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  async function toggleFullscreen() {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await containerRef.current.requestFullscreen();
    }
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col overflow-hidden rounded-xl border border-border bg-muted/40 data-[fullscreen]:bg-background"
      data-fullscreen={isFullscreen || undefined}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-card px-3 py-2">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Previous page"
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-20 text-center text-sm text-muted-foreground">
            Page {pageNumber} of {numPages ?? "—"}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Next page"
            disabled={!numPages || pageNumber >= numPages}
            onClick={() => setPageNumber((p) => (numPages ? Math.min(numPages, p + 1) : p))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Zoom out"
            disabled={scale <= MIN_SCALE}
            onClick={() => setScale((s) => Math.max(MIN_SCALE, Number((s - 0.2).toFixed(2))))}
          >
            <ZoomOut className="size-4" />
          </Button>
          <span className="min-w-12 text-center text-sm text-muted-foreground">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Zoom in"
            disabled={scale >= MAX_SCALE}
            onClick={() => setScale((s) => Math.min(MAX_SCALE, Number((s + 0.2).toFixed(2))))}
          >
            <ZoomIn className="size-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Toggle fullscreen" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
          </Button>
          <a
            href={inlineUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
            aria-label="Open in new tab"
          >
            <ExternalLink className="size-4" />
          </a>
          <a
            href={downloadUrl}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Download className="size-4" />
            Download
          </a>
        </div>
      </div>

      <div className="max-h-[75vh] flex-1 overflow-auto p-4 [[data-fullscreen]_&]:max-h-none">
        <div className="flex justify-center">
          {loadError ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="text-sm text-muted-foreground">
                We couldn&apos;t preview this resume in the browser.
              </p>
              <a href={downloadUrl} className={buttonVariants({ variant: "outline", size: "sm" })}>
                <Download className="size-4" />
                Download resume instead
              </a>
            </div>
          ) : (
            <Document
              file={inlineUrl}
              onLoadSuccess={({ numPages: loaded }) => {
                setNumPages(loaded);
                setPageNumber(1);
              }}
              onLoadError={() => setLoadError("Failed to load PDF")}
              loading={
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              }
            >
              <Page pageNumber={pageNumber} scale={scale} renderAnnotationLayer renderTextLayer />
            </Document>
          )}
        </div>
      </div>
    </div>
  );
}
