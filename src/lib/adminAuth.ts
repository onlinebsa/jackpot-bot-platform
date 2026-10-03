import "server-only";
import { cookies } from "next/headers";

const COOKIE_NAME = "admin_auth";

export async function isAdminLoggedIn(): Promise<boolean> {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  return !!value && value === process.env.ADMIN_SESSION_SECRET;
}

export async function requireAdminSession() {
  const ok = await isAdminLoggedIn();
  if (!ok) throw new Error("Not authorized");
}

export async function setAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, process.env.ADMIN_SESSION_SECRET || "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    // No maxAge set on purpose: this makes it a session cookie,
    // which browsers clear automatically when the browser is fully closed.
  });
}

export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}