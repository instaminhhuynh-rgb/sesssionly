import { NextResponse } from "next/server";
import { createDepositCheckout } from "@/lib/payments/deposits";

/** POST /api/payments/deposit — start a deposit (real Checkout or simulated). */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const origin = req.headers.get("origin") || new URL(req.url).origin;
    const result = await createDepositCheckout({
      serviceName: String(body.serviceName ?? "Appointment"),
      amountCents: Math.round(Number(body.amount ?? 0) * 100),
      clientName: body.clientName ? String(body.clientName) : undefined,
      clientEmail: body.clientEmail ? String(body.clientEmail) : undefined,
      successUrl: `${origin}${body.successPath ?? "/"}`,
      cancelUrl: `${origin}${body.cancelPath ?? "/"}`,
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Could not start the deposit." }, { status: 500 });
  }
}
