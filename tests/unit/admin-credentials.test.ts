import { afterEach, describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";
import { getAdminPasswordHash } from "@/lib/auth/admin-credentials";

const ORIGINAL_ENV = process.env.ADMIN_PASSWORD_HASH_BASE64;

describe("getAdminPasswordHash", () => {
  afterEach(() => {
    if (ORIGINAL_ENV === undefined) {
      delete process.env.ADMIN_PASSWORD_HASH_BASE64;
    } else {
      process.env.ADMIN_PASSWORD_HASH_BASE64 = ORIGINAL_ENV;
    }
  });

  it("decodes a base64-encoded bcrypt hash back to its original form", async () => {
    const hash = await bcrypt.hash("some password", 12);
    process.env.ADMIN_PASSWORD_HASH_BASE64 = Buffer.from(hash, "utf8").toString("base64");
    expect(getAdminPasswordHash()).toBe(hash);
  });

  it("returns undefined when the env var is not set", () => {
    delete process.env.ADMIN_PASSWORD_HASH_BASE64;
    expect(getAdminPasswordHash()).toBeUndefined();
  });

  it("returns undefined for a value that doesn't decode to a bcrypt hash", () => {
    process.env.ADMIN_PASSWORD_HASH_BASE64 = Buffer.from("not a hash", "utf8").toString("base64");
    expect(getAdminPasswordHash()).toBeUndefined();
  });

  it("survives round-tripping through a value containing literal $ characters", () => {
    // This is exactly the scenario that broke when the raw hash was stored directly
    // in a .env file and Next's env loader tried to expand "$word" as a variable.
    const hashWithDollarWords = "$2b$12$GAB8fASgGxtxQBOVxzCXdu4FNT/zybZ/aWU1NXwCwmHm8MwGD7znO";
    process.env.ADMIN_PASSWORD_HASH_BASE64 = Buffer.from(hashWithDollarWords, "utf8").toString(
      "base64",
    );
    expect(getAdminPasswordHash()).toBe(hashWithDollarWords);
  });
});
