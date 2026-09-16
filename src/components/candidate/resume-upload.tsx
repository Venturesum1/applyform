"use client";

import { useRef, useState } from "react";
import { FileText, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { validateResumeMetadata } from "@/lib/validation/resume";
import { cn } from "cn";

interface ResumeUploadProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  error?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ResumeUpload({ file, onFileChange, error }: ResumeUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | undefined>();

  function handleFiles(fileList: FileList | null) {
    const selected = fileList?.[0];
    if (!selected) return;

    const check = validateResumeMetadata(selected);
    if (!check.valid) {
      setLocalError(check.error);
      onFileChange(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setLocalError(undefined);
    onFileChange(selected);
  }

  const displayError = localError ?? error;

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />

      {!file ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input bg-muted/30 px-6 py-10 text-center transition-colors hover:border-ring hover:bg-muted/50",
            displayError && "border-destructive/60",
          )}
        >
          <Upload className="size-6 text-muted-foreground" aria-hidden />
          <span className="text-sm font-medium">Click to upload your resume</span>
          <span className="text-xs text-muted-foreground">PDF only, up to 5 MB</span>
        </button>
      ) : (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-input bg-muted/30 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <FileText className="size-5 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
            </div>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              Replace
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Remove resume"
              onClick={() => {
                onFileChange(null);
                setLocalError(undefined);
                if (inputRef.current) inputRef.current.value = "";
              }}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {displayError && <p className="text-sm text-destructive">{displayError}</p>}
    </div>
  );
}
