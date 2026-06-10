import { NextResponse } from "next/server";
import { draftInvite, type InviteInput } from "@/lib/agents/smart-invite/agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let input: InviteInput | undefined;
  try {
    const b = await req.json();
    if (typeof b?.recipient === "string" && typeof b?.serviceId === "string") {
      input = { recipient: b.recipient, serviceId: b.serviceId, reqDeposit: !!b.reqDeposit, reqIntake: !!b.reqIntake };
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!input) return NextResponse.json({ error: "recipient and serviceId are required." }, { status: 400 });

  try {
    return NextResponse.json(await draftInvite(input));
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Invite draft failed." }, { status: 404 });
  }
}
