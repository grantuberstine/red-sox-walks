import { NextResponse } from "next/server";
import { loadState } from "@/lib/storage";

export const runtime = "nodejs";
export const revalidate = 60;

export async function GET() {
  try {
    const state = await loadState();
    return NextResponse.json({ ok: true, state });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
