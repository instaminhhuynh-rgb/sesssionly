import type { EnrichedSession } from "@/lib/types";
import { fmtDay, to12 } from "@/lib/format";

/**
 * Builds the signal payload the No-Show agent reasons over. Keep it to the
 * facts that actually move risk — the agent should never need anything else,
 * and a tight payload keeps scores stable and cheap.
 */
export interface ScoringSignals {
  service: string;
  when: string;
  location: string;
  flags: { depositPaid: boolean; confirmed: boolean; intakeDone: boolean; depositRequired: boolean };
  client: {
    name: string;
    tag: string;
    sessionsAttended: number;
    cancellations: number;
    noShows: number;
    clientSince: string;
  };
}

export function buildScoringSignals(s: EnrichedSession): ScoringSignals {
  return {
    service: s.service.name,
    when: `${fmtDay(s.day)} at ${to12(s.start)}`,
    location: s.location,
    flags: {
      depositPaid: s.depositPaid,
      confirmed: s.confirmed,
      intakeDone: s.intakeDone,
      depositRequired: s.service.deposit > 0,
    },
    client: {
      name: s.client.name,
      tag: s.client.tag,
      sessionsAttended: s.client.sessions,
      cancellations: s.client.cancellations,
      noShows: s.client.noShows,
      clientSince: s.client.since,
    },
  };
}
