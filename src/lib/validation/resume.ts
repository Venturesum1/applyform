import {
  MAX_RESUME_SIZE_BYTES,
  PDF_MAGIC_BYTES,
  RESUME_ALLOWED_EXTENSION,
  RESUME_ALLOWED_MIME_TYPES,
} from "@/lib/constants";

export interface ResumeValidationResult {
  valid: boolean;
  error?: string;
}

interface ResumeFileLike {
  name: string;
  type: string;
  size: number;
}

/** Client/metadata-level checks — fast, but never sufficient on their own since MIME/extension are attacker-controlled. */
export function validateResumeMetadata(file: ResumeFileLike): ResumeValidationResult {
  if (file.size <= 0) {
    return { valid: false, error: "Please upload a PDF resume." };
  }
  if (file.size > MAX_RESUME_SIZE_BYTES) {
    return { valid: false, error: "Resume file is too large. Please upload a smaller PDF." };
  }
  const hasValidExtension = file.name.toLowerCase().endsWith(RESUME_ALLOWED_EXTENSION);
  const hasValidMimeType = RESUME_ALLOWED_MIME_TYPES.includes(file.type);
  if (!hasValidExtension || !hasValidMimeType) {
    return { valid: false, error: "Please upload a PDF resume." };
  }
  return { valid: true };
}

/** Authoritative server-side check: verifies the actual file bytes are a real PDF via its magic number. */
export function validateResumeContent(bytes: Buffer): ResumeValidationResult {
  if (bytes.length === 0 || bytes.length > MAX_RESUME_SIZE_BYTES) {
    return { valid: false, error: "Resume file is too large. Please upload a smaller PDF." };
  }
  const header = bytes.subarray(0, PDF_MAGIC_BYTES.length);
  if (!header.equals(PDF_MAGIC_BYTES)) {
    return { valid: false, error: "The uploaded file is not a valid PDF." };
  }
  return { valid: true };
}
