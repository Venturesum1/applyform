import { cookies } from "next/headers";
import { getIronSession, type IronSession } from "iron-session";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/constants";

export interface AdminSessionData {
  isAdmin: boolean;
  email: string;
  loggedInAt: number;
}

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET environment variable must be set to a string of 32+ characters");
  }
  return secret;
}

function sessionOptions() {
  return {
    password: getSessionSecret(),
    cookieName: SESSION_COOKIE_NAME,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: "/",
    },
  };
}

export async function getAdminSession(): Promise<IronSession<AdminSessionData>> {
  const cookieStore = await cookies();
  return getIronSession<AdminSessionData>(cookieStore, sessionOptions());
}

export async function requireAdminSession(): Promise<IronSession<AdminSessionData> | null> {
  const session = await getAdminSession();
  if (!session.isAdmin) {
    return null;
  }
  return session;
}
