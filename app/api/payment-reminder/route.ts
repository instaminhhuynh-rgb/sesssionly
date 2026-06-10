import { NextResponse } from "next/server";
import { draftReminder, type ReminderInput } from "@/lib/agents/payments/agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let input: ReminderInput | undefined;
  try {
    const b = await req.json();
    if (typeof b?.client === "string" && typeof b?.what === "string") {
      input = { client: b.client, what: b.what, amount: Number(b.amount) || 0, status: String(b.status ?? "Unpaid"), age: String(b.age ?? "") };
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!input) return NextResponse.json({ error: "client and what are required." }, { status: 400 });

  try {
    return NextResponse.json(await draftReminder(input));
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Reminder draft failed." }, { status: 500 });
  }
}
