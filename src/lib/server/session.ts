import "server-only";
import { cookies } from "next/headers";
import { newSession, validSession, sessionHash } from "../session-token";
import { HttpError } from "./http";
export async function browserOwner(create = false) {
  const secret = process.env.APP_SESSION_SECRET;
  if (!secret || secret.length < 32)
    throw new HttpError(503, "This service is being prepared.");
  const jar = await cookies();
  let token = jar.get("hd_session")?.value;
  if (!token || !validSession(token, secret)) {
    if (!create)
      throw new HttpError(401, "Reopen this page to continue in this browser.");
    token = newSession(secret);
    jar.set("hd_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return sessionHash(token);
}
