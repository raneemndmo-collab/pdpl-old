import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User, PlatformUser } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { parse as parseCookieHeader } from "cookie";
import { jwtVerify } from "jose";
import { ENV } from "./env";
import { getPlatformUserById } from "../db";

const PLATFORM_COOKIE = "platform_session";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  platformUser: PlatformUser | null;
};

async function authenticatePlatformUser(
  req: CreateExpressContextOptions["req"]
): Promise<PlatformUser | null> {
  try {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return null;
    const cookies = parseCookieHeader(cookieHeader);
    const token = cookies[PLATFORM_COOKIE];
    if (!token) return null;

    const secret = new TextEncoder().encode(ENV.cookieSecret);
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });

    const platformUserId = payload.platformUserId as number | undefined;
    if (!platformUserId) return null;

    const user = await getPlatformUserById(platformUserId);
    if (!user || user.status !== "active") return null;

    return user;
  } catch {
    return null;
  }
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let platformUser: PlatformUser | null = null;

  // Try platform auth first (custom userId + password)
  platformUser = await authenticatePlatformUser(opts.req);

  // If no platform user, try OAuth
  if (!platformUser) {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch (error) {
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    platformUser,
  };
}
