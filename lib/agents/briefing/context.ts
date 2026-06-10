import { HOST, getSessionsForDay, NEEDS_ATTENTION, OUTSTANDING, FOLLOWUPS, getClient, TODAY } from "@/lib/mock-data";
import { to12 } from "@/lib/format";

/**
 * Signals the Daily Briefing agent summarizes. It aggregates what the other
 * agents/screens surfaced for today — the briefing never invents new facts.
 */
export interface BriefingSignals {
  host: string;
  date: string;
  todaySessions: { client: string; service: string; time: string; score: number; confirmed: boolean }[];
  needsAttention: { title: string; why: string[] }[];
  paymentsDue: { client: string; what: string; amount: number; status: string; age: string }[];
  followUpsToday: { client: string; kind: string }[];
}

export function buildBriefingSignals(): BriefingSignals {
  return {
    host: HOST.firstName,
    date: "Tuesday, June 9",
    todaySessions: getSessionsForDay(TODAY).map((s) => ({
      client: s.client.name,
      service: s.service.name,
      time: to12(s.start),
      score: s.score,
      confirmed: s.confirmed,
    })),
    needsAttention: NEEDS_ATTENTION.map((n) => ({ title: n.title, why: n.why })),
    paymentsDue: OUTSTANDING.map((p) => ({ client: p.client, what: p.what, amount: p.amt, status: p.status, age: p.age })),
    followUpsToday: FOLLOWUPS.filter((f) => f.due === "Today").map((f) => ({
      client: getClient(f.clientId)?.name ?? "A client",
      kind: f.kind,
    })),
  };
}
