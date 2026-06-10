import { NextResponse } from "next/server";
import { scoreSession } from "@/lib/agents/no-show/agent";

// Node runtime — the agent uses the Anthropic SDK and reads a server-only key.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let bookingId: string | undefined;
  try {
    const body = await req.json();
    bookingId = typeof body?.bookingId === "string" ? body.bookingId : undefined;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!bookingId) {
    return NextResponse.json({ error: "bookingId is required." }, { status: 400 });
  }

  try {
    const result = await scoreSession(bookingId);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scoring failed.";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
