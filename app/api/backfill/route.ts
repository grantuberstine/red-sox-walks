import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { processGames } from "@/lib/process";
import { SEASON_END, SEASON_START } from "@/lib/constants";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const startDate = url.searchParams.get("startDate") ?? SEASON_START;
  const endDate = url.searchParams.get("endDate") ?? SEASON_END;

  try {
    const { report } = await processGames({ startDate, endDate });
    return NextResponse.json({ ok: true, mode: "backfill", startDate, endDate, report });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export const POST = GET;
