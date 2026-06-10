import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Server-only Anthropic client.
 *
 * The key is read from the environment at call time and never leaves the
 * server. `import "server-only"` makes the build fail loudly if this module is
 * ever pulled into a client bundle.
 *
 * Returns `null` when no key is configured, so callers can fall back to a
 * deterministic path instead of throwing — the app must work with or without AI.
 */
let cached: Anthropic | null = null;

export function getAnthropic(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  if (!cached) cached = new Anthropic({ apiKey });
  return cached;
}

/** Override with SESSIONLY_SCORING_MODEL if you want Haiku for cost, etc. */
export const SCORING_MODEL = process.env.SESSIONLY_SCORING_MODEL || "claude-sonnet-4-6";
