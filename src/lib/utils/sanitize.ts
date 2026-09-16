/**
 * Produces a display-only filename with path separators and control characters
 * stripped. This is NEVER used to build a filesystem path — storage keys are
 * always server-generated (see lib/storage). It only protects what gets shown
 * back to the admin UI and in Content-Disposition headers.
 */
export function sanitizeDisplayFilename(originalFilename: string): string {
  const withoutPath = originalFilename.split(/[/\\]/).pop() ?? "resume.pdf";
  const cleaned = withoutPath
    .replace(/[\x00-\x1f\x7f]/g, "")
    .replace(/["]/g, "")
    .trim();
  return cleaned.length > 0 ? cleaned.slice(0, 200) : "resume.pdf";
}

/** Escapes user input for safe use inside a MongoDB $regex filter. */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i;

export function isValidObjectId(value: string): boolean {
  return OBJECT_ID_PATTERN.test(value);
}
