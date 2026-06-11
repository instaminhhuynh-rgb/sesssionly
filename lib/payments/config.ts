/**
 * Client-safe payments flag. Mirrors `supabaseConfigured`.
 *
 * The app runs fine with NO Stripe configured (deposits and no-show charges are
 * simulated in the UI). Real charging only switches on once the publishable key
 * is present in the environment. The secret key lives server-side only.
 */
export const paymentsConfigured = Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
