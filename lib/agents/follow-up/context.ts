import type { EnrichedSession } from "@/lib/types";
import { fmtDay, to12 } from "@/lib/format";

export type FollowUpKind = "recap" | "review" | "rebook" | "renewal";

export const FOLLOW_UP_KINDS: Record<FollowUpKind, string> = {
  recap: "A warm recap of the session with one concrete next step.",
  review: "A short, low-pressure request for a review or testimonial.",
  rebook: "A nudge to book the next session, offering a specific time.",
  renewal: "A reminder that a package is ending, offering to renew it.",
};

/** Signals the Follow-Up agent writes from. Keep it to what shapes the message. */
export interface FollowUpSignals {
  kind: FollowUpKind;
  kindGoal: string;
  client: { name: string; firstName: string; tag: string; sessionsAttended: number };
  service: string;
  when: string;
  prep: string;
  lastNote: string | null;
  hasReviewed: boolean;
}

export function buildFollowUpSignals(s: EnrichedSession, kind: FollowUpKind): FollowUpSignals {
  return {
    kind,
    kindGoal: FOLLOW_UP_KINDS[kind],
    client: {
      name: s.client.name,
      firstName: s.client.name.split(" ")[0],
      tag: s.client.tag,
      sessionsAttended: s.client.sessions,
    },
    service: s.service.name,
    when: `${fmtDay(s.day)} at ${to12(s.start)}`,
    prep: s.prep,
    lastNote: s.client.notes[0]?.t ?? null,
    hasReviewed: s.client.reviews.length > 0,
  };
}
