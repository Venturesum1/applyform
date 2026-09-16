export const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const RESUME_ALLOWED_MIME_TYPES = ["application/pdf"];
export const RESUME_ALLOWED_EXTENSION = ".pdf";
export const PDF_MAGIC_BYTES = Buffer.from("%PDF-");

export const LOGIN_RATE_LIMIT = {
  maxAttempts: 10,
  windowMs: 10 * 60 * 1000, // 10 minutes
};

export const APPLICATIONS_PAGE_SIZE = 10;
export const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60; // 8 hours
export const SESSION_COOKIE_NAME = "admin_session";
export const CSRF_COOKIE_NAME = "csrf_token";
