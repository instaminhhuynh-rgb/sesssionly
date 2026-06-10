import { NextResponse } from "next/server";
import { composeBriefing } from "@/lib/agents/briefing/agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const briefing = await composeBriefing();
    return NextResponse.json(briefing);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Briefing failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
