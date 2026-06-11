import "server-only";
import { getStripe } from "./stripe";

/**
 * Payments — deposits, card-on-file, and no-show charging.
 *
 * Every function returns a result tagged `source: "stripe" | "simulated"`.
 * Without a Stripe key the functions SIMULATE success so the demo flows end to
 * end. With a key, they hit real Stripe. This is the same graceful-degradation
 * pattern the AI agents use.
 *
 * NOTE: the real no-show / off-session charge needs a saved customer + payment
 * method (collected via createSetupIntent at booking time and persisted). Until
 * that persistence lands, the real path returns `status: "no_card"` rather than
 * charging — it never silently fails. The simulated path always "succeeds" for
 * the demo.
 */

/* ------------------------------- deposits -------------------------------- */

export interface DepositInput {
  serviceName: string;
  amountCents: number;
  clientName?: string;
  clientEmail?: string;
  successUrl: string;
  cancelUrl: string;
}

export interface DepositResult {
  source: "stripe" | "simulated";
  /** "redirect" → send the client to checkoutUrl; "secured" → already done (demo). */
  status: "redirect" | "secured";
  checkoutUrl?: string;
  id: string;
}

/** Collect a deposit. Live: a Stripe Checkout Session. Demo: simulated hold. */
export async function createDepositCheckout(input: DepositInput): Promise<DepositResult> {
  const stripe = await getStripe();
  if (!stripe) {
    return { source: "simulated", status: "secured", id: `sim_dep_${Date.now()}` };
  }
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: `Deposit — ${input.serviceName}` },
          unit_amount: input.amountCents,
        },
        quantity: 1,
      },
    ],
    customer_email: input.clientEmail,
    metadata: { kind: "deposit", clientName: input.clientName ?? "" },
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
  });
  return { source: "stripe", status: "redirect", checkoutUrl: session.url ?? input.successUrl, id: session.id };
}

/* --------------------------- card on file -------------------------------- */

export interface SetupIntentResult {
  source: "stripe" | "simulated";
  clientSecret: string | null;
  customerId: string | null;
}

/** Start saving a card on file (SetupIntent). Demo returns a simulated stub. */
export async function createSetupIntent(email?: string, name?: string): Promise<SetupIntentResult> {
  const stripe = await getStripe();
  if (!stripe) {
    return { source: "simulated", clientSecret: null, customerId: `sim_cus_${Date.now()}` };
  }
  const customer = await stripe.customers.create({ email, name });
  const si = await stripe.setupIntents.create({
    customer: customer.id,
    payment_method_types: ["card"],
    usage: "off_session",
  });
  return { source: "stripe", clientSecret: si.client_secret, customerId: customer.id };
}

/* --------------------------- no-show charge ------------------------------ */

export interface NoShowInput {
  clientName: string;
  amountCents: number;
  reason: string;
  /** Required for a real charge; collected via createSetupIntent + persisted. */
  customerId?: string;
  paymentMethodId?: string;
}

export interface ChargeResult {
  source: "stripe" | "simulated";
  status: "charged" | "failed" | "no_card";
  id?: string;
}

/** Charge a no-show / late-cancel fee against the card on file (off-session). */
export async function chargeNoShow(input: NoShowInput): Promise<ChargeResult> {
  const stripe = await getStripe();
  if (!stripe) {
    return { source: "simulated", status: "charged", id: `sim_chg_${Date.now()}` };
  }
  if (!input.customerId || !input.paymentMethodId) {
    // Real Stripe is on, but no saved card to charge yet.
    return { source: "stripe", status: "no_card" };
  }
  try {
    const pi = await stripe.paymentIntents.create({
      amount: input.amountCents,
      currency: "usd",
      customer: input.customerId,
      payment_method: input.paymentMethodId,
      off_session: true,
      confirm: true,
      description: `No-show fee — ${input.clientName} (${input.reason})`,
      metadata: { kind: "no_show_fee", clientName: input.clientName },
    });
    return { source: "stripe", status: pi.status === "succeeded" ? "charged" : "failed", id: pi.id };
  } catch {
    return { source: "stripe", status: "failed" };
  }
}
