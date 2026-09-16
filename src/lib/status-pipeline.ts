import type { ApplicationStatus } from "@/types/application";

/** Forward progression through the hiring pipeline. "Rejected" is a separate terminal state reachable from any stage. */
export const PIPELINE_ORDER: ApplicationStatus[] = [
  "New",
  "Reviewing",
  "Shortlisted",
  "Interview",
  "Hired",
];

/** Returns the next stage after `current`, or null if there is no next stage (already Hired, or Rejected). */
export function getNextStatus(current: ApplicationStatus): ApplicationStatus | null {
  const index = PIPELINE_ORDER.indexOf(current);
  if (index === -1 || index === PIPELINE_ORDER.length - 1) return null;
  return PIPELINE_ORDER[index + 1];
}
