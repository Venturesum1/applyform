"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/types/application";
import { getCsrfTokenFromCookie } from "@/lib/csrf-client";
import { getNextStatus } from "@/lib/status-pipeline";

export function StatusSelect({
  applicationId,
  initialStatus,
}: {
  applicationId: string;
  initialStatus: ApplicationStatus;
}) {
  const [status, setStatus] = useState<ApplicationStatus>(initialStatus);
  const [isSaving, setIsSaving] = useState(false);

  async function updateStatus(nextStatus: ApplicationStatus) {
    const previous = status;
    setStatus(nextStatus);
    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/applications/${applicationId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": getCsrfTokenFromCookie() ?? "",
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      toast.success(`Status updated to "${nextStatus}"`);
    } catch {
      setStatus(previous);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  const nextStatus = getNextStatus(status);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        disabled={isSaving || !nextStatus}
        onClick={() => nextStatus && updateStatus(nextStatus)}
        className="bg-emerald-600 text-white hover:bg-emerald-600/90"
      >
        <Check className="size-4" />
        {nextStatus ? `Approve → ${nextStatus}` : "Approve"}
      </Button>
      <Button
        size="sm"
        variant="destructive"
        disabled={isSaving || status === "Rejected"}
        onClick={() => updateStatus("Rejected")}
      >
        <X className="size-4" />
        Reject
      </Button>

      <Select
        value={status}
        onValueChange={(value) => value && updateStatus(value as ApplicationStatus)}
        disabled={isSaving}
      >
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {APPLICATION_STATUSES.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isSaving && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
    </div>
  );
}
