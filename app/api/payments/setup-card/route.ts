import { NextResponse } from "next/server";
import { createSetupIntent } from "@/lib/payments/deposits";

/** POST /api/payments/setup-card — start saving a card on file (SetupIntent). */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const result = await createSetupIntent(
      body.email ? String(body.email) : undefined,
      body.name ? String(body.name) : undefined,
    );
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Could not start card setup." }, { status: 500 });
  }
}
