import { NextResponse } from "next/server";
import { draftFollowUp } from "@/lib/agents/follow-up/agent";
import type { FollowUpKind } from "@/lib/agents/follow-up/context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KINDS: FollowUpKind[] = ["recap", "review", "rebook", "renewal"];

export async function POST(req: Request) {
  let bookingId: string | undefined;
  let kind: FollowUpKind | undefined;
  try {
    const body = await req.json();
    if (typeof body?.bookingId === "string") bookingId = body.bookingId;
    if (typeof body?.kind === "string" && KINDS.includes(body.kind)) kind = body.kind;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!bookingId || !kind) {
    return NextResponse.json({ error: "bookingId and a valid kind are required." }, { status: 400 });
  }

  try {
    const draft = await draftFollowUp(bookingId, kind);
    return NextResponse.json(draft);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Draft failed.";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
