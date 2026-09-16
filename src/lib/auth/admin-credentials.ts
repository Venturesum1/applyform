/**
 * The bcrypt hash is stored in the environment as base64 (ADMIN_PASSWORD_HASH_BASE64)
 * rather than as a raw "$2b$12$..." string. Next.js's env loader performs $VAR-style
 * expansion on .env files, which silently corrupts a literal bcrypt hash whenever a
 * "$word" segment happens to look like a variable reference. Base64 sidesteps that
 * entirely since it never contains "$".
 */
export function getAdminPasswordHash(): string | undefined {
  const encoded = process.env.ADMIN_PASSWORD_HASH_BASE64;
  if (!encoded) return undefined;
  try {
    const decoded = Buffer.from(encoded, "base64").toString("utf8");
    return decoded.startsWith("$2") ? decoded : undefined;
  } catch {
    return undefined;
  }
}
