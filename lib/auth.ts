import { NextRequest } from "next/server";

export function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = req.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;

  const url = new URL(req.url);
  const queryToken = url.searchParams.get("token");
  if (queryToken === secret) return true;

  return false;
}
