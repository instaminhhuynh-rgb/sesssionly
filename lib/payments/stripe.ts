import "server-only";
import type Stripe from "stripe";

/**
 * Server-only Stripe client, mirroring `getAnthropic()`.
 *
 * Returns `null` when no secret key is configured, so every payment path can
 * fall back to a SIMULATED result instead of throwing — the app must work with
 * or without real payments (demo mode).
 *
 * The `stripe` package is imported DYNAMICALLY and only when a key is present,
 * so the live demo never loads it (and doesn't even require it installed) until
 * payments are actually turned on.
 */
let cached: Stripe | null = null;

export const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);

export async function getStripe(): Promise<Stripe | null> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!cached) {
    const { default: StripeCtor } = await import("stripe");
    cached = new StripeCtor(key, { apiVersion: "2024-12-18.acacia" });
  }
  return cached;
}
