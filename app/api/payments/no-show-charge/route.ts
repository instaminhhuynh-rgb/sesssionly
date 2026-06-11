import { NextResponse } from "next/server";
import { chargeNoShow } from "@/lib/payments/deposits";

/** POST /api/payments/no-show-charge — charge a no-show fee (real or simulated). */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await chargeNoShow({
      clientName: String(body.clientName ?? "Client"),
      amountCents: Math.round(Number(body.amount ?? 0) * 100),
      reason: String(body.reason ?? "no-show"),
      customerId: body.customerId ? String(body.customerId) : undefined,
      paymentMethodId: body.paymentMethodId ? String(body.paymentMethodId) : undefined,
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Could not process the charge." }, { status: 500 });
  }
}
