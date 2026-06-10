import "server-only";
import type { EnrichedSession } from "@/lib/types";
import { getSessionById } from "@/lib/mock-data";
import { getAgent } from "@/lib/agents/registry";
import { getAnthropic, SCORING_MODEL } from "@/lib/agents/anthropic";
import { buildScoringSignals } from "./context";

/**
 * No-Show / Session Score agent — end to end.
 *
 * scoreSession(bookingId):
 *   1. builds the signal context from the data layer,
 *   2. asks Claude to weigh the signals and return a structured score + reasons
 *      via a forced tool call (so output is always machine-readable),
 *   3. validates and clamps the result,
 *   4. falls back to a deterministic heuristic if there's no key or the call
 *      fails — the score must always render, AI or not.
 *
 * The score is HOST-ONLY and always carries its reasons. There is no code path
 * that returns a bare number.
 */

export type ScoreBandName = "good" | "warn" | "bad";

export interface SessionScoreResult {
  bookingId: string;
  score: number; // 0-100
  band: ScoreBandName;
  reasons: { positive: string[]; negative: string[] };
  recommendations: string[]; // e.g. "Require deposit", "Request confirmation"
  source: "ai" | "heuristic";
  model?: string;
}

const TOOL = {
  name: "submit_session_score",
  description:
    "Return the host-only Session Score with the reasons behind it. Always include the reasons that justify the number.",
  input_schema: {
    type: "object" as const,
    properties: {
      score: { type: "integer", minimum: 0, maximum: 100, description: "0-100 readiness/trust score for this booking." },
      positive: { type: "array", items: { type: "string", maxLength: 60 }, description: "Signals that raise confidence. Each a short phrase, max ~7 words." },
      negative: { type: "array", items: { type: "string", maxLength: 60 }, description: "Signals that raise no-show risk. Each a short phrase, max ~7 words." },
      recommendations: {
        type: "array",
        items: { type: "string", maxLength: 28 },
        description: "Short imperative button labels, max 4 words, e.g. 'Require deposit', 'Request confirmation', 'Resend intake'.",
      },
    },
    required: ["score", "positive", "negative", "recommendations"],
  },
};

export async function scoreSession(bookingId: string): Promise<SessionScoreResult> {
  const session = getSessionById(bookingId);
  if (!session) throw new Error(`Unknown booking: ${bookingId}`);

  const client = getAnthropic();
  if (!client) return heuristic(session); // no key configured -> deterministic path

  try {
    const signals = buildScoringSignals(session);
    const spec = getAgent("no_show");

    const msg = await client.messages.create({
      model: SCORING_MODEL,
      max_tokens: 700,
      system: `${spec.systemPrompt}\n\nWeigh the signals and call submit_session_score. Higher score = more likely to attend and be well-prepared. Each reason is a short phrase (max ~7 words), not a sentence. Recommendations are short imperative button labels (max 4 words, e.g. "Require deposit") and only for real gaps — no deposit, unconfirmed, missing intake, weak history.`,
      tools: [TOOL],
      tool_choice: { type: "tool", name: TOOL.name },
      messages: [
        {
          role: "user",
          content: `Score this upcoming session. Signals:\n${JSON.stringify(signals, null, 2)}`,
        },
      ],
    });

    // Find the forced tool call and validate its input.
    const block = (msg.content as unknown as Array<{ type: string; input?: unknown }>).find((b) => b.type === "tool_use");
    if (!block || typeof block.input !== "object" || block.input === null) return heuristic(session);

    return validate(bookingId, block.input as Record<string, unknown>, SCORING_MODEL);
  } catch {
    // Never let an AI failure break the screen.
    return heuristic(session);
  }
}

/* ----------------------------- validation ----------------------------- */

function validate(bookingId: string, raw: Record<string, unknown>, model: string): SessionScoreResult {
  const score = clamp(Number(raw.score));
  const positive = toStringArray(raw.positive);
  const negative = toStringArray(raw.negative);
  const recommendations = toStringArray(raw.recommendations);

  // Invariant: a score must carry its reasons. If the model returned none,
  // fall back rather than show a bare number.
  if (positive.length === 0 && negative.length === 0) {
    const s = getSessionById(bookingId)!;
    return heuristic(s);
  }

  return {
    bookingId,
    score,
    band: band(score),
    reasons: { positive, negative },
    recommendations,
    source: "ai",
    model,
  };
}

function toStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).slice(0, 6);
}

function clamp(n: number): number {
  if (Number.isNaN(n)) return 50;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function band(score: number): ScoreBandName {
  return score >= 80 ? "good" : score >= 60 ? "warn" : "bad";
}

/* --------------------------- heuristic fallback --------------------------- */

/**
 * Deterministic score from the same signals. Used when there's no API key or
 * the AI path fails. Keeps the agent honest — the AI should land near this.
 */
export function heuristic(s: EnrichedSession): SessionScoreResult {
  const c = s.client;
  let score = 60;
  const positive: string[] = [];
  const negative: string[] = [];
  const recommendations: string[] = [];

  if (c.tag === "Repeat" || c.tag === "Package") {
    score += 15;
    positive.push(`Repeat client · ${c.sessions} sessions attended`);
  }
  if (c.sessions >= 5 && c.cancellations === 0) {
    score += 8;
    positive.push("No cancellations on record");
  }
  if (s.depositPaid) {
    score += 12;
    positive.push("Deposit paid");
  } else {
    score -= 8;
    negative.push("No deposit on file");
    if (s.service.deposit > 0) recommendations.push("Require deposit");
  }
  if (s.confirmed) {
    score += 8;
    positive.push("Confirmed attendance");
  } else {
    score -= 6;
    negative.push("Not yet confirmed");
    recommendations.push("Request confirmation");
  }
  if (s.intakeDone) {
    score += 6;
    positive.push("Intake completed");
  } else {
    score -= 6;
    negative.push("Intake incomplete");
    recommendations.push("Resend intake");
  }
  if (c.cancellations > 0) {
    score -= c.cancellations * 8;
    negative.push(`${c.cancellations} prior cancellation${c.cancellations > 1 ? "s" : ""}`);
  }
  if (c.noShows > 0) {
    score -= c.noShows * 12;
    negative.push(`${c.noShows} prior no-show`);
  }
  if (c.tag === "New lead") {
    score -= 6;
    negative.push("New lead · no history yet");
  }

  const final = clamp(score);
  return {
    bookingId: s.id,
    score: final,
    band: band(final),
    reasons: { positive, negative },
    recommendations,
    source: "heuristic",
  };
}
