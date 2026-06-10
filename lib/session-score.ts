import type { EnrichedSession } from "./types";

/**
 * Session Score is host-only and MUST be explainable.
 * This returns the positive and negative reasons behind a score so the UI
 * can always show why. When this moves server-side, keep the reason list —
 * never surface a bare number.
 */
export interface ScoreBreakdown {
  pos: string[];
  neg: string[];
  band: "good" | "warn" | "bad";
}

export function scoreBand(score: number): ScoreBreakdown["band"] {
  return score >= 80 ? "good" : score >= 60 ? "warn" : "bad";
}

export function scoreReasons(s: EnrichedSession): ScoreBreakdown {
  const c = s.client;
  const pos: string[] = [];
  const neg: string[] = [];

  if (c.tag === "Repeat" || c.tag === "Package") pos.push(`Repeat client · ${c.sessions} sessions attended`);
  if (c.cancellations === 0 && c.sessions > 0) pos.push("No cancellations on record");
  if (s.depositPaid) pos.push("Deposit paid");
  else neg.push("No deposit on file");
  if (s.confirmed) pos.push("Confirmed attendance");
  else neg.push("Not yet confirmed");
  if (s.intakeDone) pos.push("Intake completed");
  else neg.push("Intake incomplete");
  if (c.cancellations > 0) neg.push(`${c.cancellations} prior cancellation${c.cancellations > 1 ? "s" : ""}`);
  if (c.noShows > 0) neg.push(`${c.noShows} prior no-show`);
  if (c.tag === "New lead") neg.push("New lead · no history yet");

  return { pos, neg, band: scoreBand(s.score) };
}
