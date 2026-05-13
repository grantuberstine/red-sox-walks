import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { processGames } from "@/lib/process";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  try {
    const { report } = await processGames({
      startDate: sevenDaysAgo,
      endDate: today,
    });
    return NextResponse.json({ ok: true, mode: "refresh", report });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
