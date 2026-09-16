"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

/**
 * react-pdf (via pdfjs-dist) evaluates a Node.js-specific code path at module
 * load time that uses `Promise.withResolvers`, a Node 22+ API. Next.js
 * evaluates "use client" components on the server too (for SSR), which
 * crashes on Node 20. Loading it with `ssr: false` skips server evaluation
 * entirely — the module only ever loads in the browser, where that Node-only
 * branch never runs anyway.
 */
const ResumeViewer = dynamic(
  () => import("./resume-viewer").then((mod) => mod.ResumeViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center rounded-xl border border-border bg-muted/40 py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    ),
  },
);

export function ResumeViewerLoader({ applicationId }: { applicationId: string }) {
  return <ResumeViewer applicationId={applicationId} />;
}
