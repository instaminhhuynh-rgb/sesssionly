import "server-only";
import type { EnrichedSession } from "@/lib/types";
import { getSessionById } from "@/lib/mock-data";
import { getAgent } from "@/lib/agents/registry";
import { getAnthropic, SCORING_MODEL } from "@/lib/agents/anthropic";
import { buildFollowUpSignals, type FollowUpKind } from "./context";

/**
 * Follow-Up agent — end to end.
 *
 * draftFollowUp(bookingId, kind) returns an editable message draft. It is a
 * Tier 1 (draft) action: it NEVER sends. The host approves and sends from the
 * UI. Falls back to a templated draft when there's no key or the call fails.
 */

export interface FollowUpDraft {
  bookingId: string;
  kind: FollowUpKind;
  subject: string | null;
  body: string;
  channel: "email" | "sms";
  source: "ai" | "template";
  model?: string;
}

const TOOL = {
  name: "submit_follow_up",
  description: "Return a ready-to-edit follow-up message the host will review and send.",
  input_schema: {
    type: "object" as const,
    properties: {
      subject: { type: "string", description: "Email subject line. Omit or empty for SMS-style messages.", maxLength: 80 },
      body: { type: "string", description: "The message body. Warm, concrete, short. End with the sign-off token {{sender}}." },
    },
    required: ["body"],
  },
};

export async function draftFollowUp(bookingId: string, kind: FollowUpKind): Promise<FollowUpDraft> {
  const session = getSessionById(bookingId);
  if (!session) throw new Error(`Unknown booking: ${bookingId}`);

  const channel: FollowUpDraft["channel"] = kind === "rebook" ? "sms" : "email";
  const client = getAnthropic();
  if (!client) return template(session, kind, channel);

  try {
    const signals = buildFollowUpSignals(session, kind);
    const spec = getAgent("follow_up");

    const msg = await client.messages.create({
      model: SCORING_MODEL,
      max_tokens: 600,
      system: `${spec.systemPrompt}\n\nWrite a ${kind} message. Goal: ${signals.kindGoal} Keep it short (3-5 sentences), specific to this client and session, and human. Use {{booking_link}} or {{review_link}} as placeholders where a link belongs. End with the sign-off token "{{sender}}". Call submit_follow_up.`,
      tools: [TOOL],
      tool_choice: { type: "tool", name: TOOL.name },
      messages: [{ role: "user", content: `Draft the message. Context:\n${JSON.stringify(signals, null, 2)}` }],
    });

    const block = (msg.content as unknown as Array<{ type: string; input?: unknown }>).find((b) => b.type === "tool_use");
    if (!block || typeof block.input !== "object" || block.input === null) return template(session, kind, channel);

    const raw = block.input as Record<string, unknown>;
    const body = typeof raw.body === "string" ? raw.body.trim() : "";
    if (!body) return template(session, kind, channel);
    const subject = typeof raw.subject === "string" && raw.subject.trim() ? raw.subject.trim() : null;

    return { bookingId, kind, subject: channel === "sms" ? null : subject, body, channel, source: "ai", model: SCORING_MODEL };
  } catch {
    return template(session, kind, channel);
  }
}

/* --------------------------- template fallback --------------------------- */

export function template(s: EnrichedSession, kind: FollowUpKind, channel: FollowUpDraft["channel"]): FollowUpDraft {
  const first = s.client.name.split(" ")[0];
  let subject: string | null = null;
  let body = "";

  switch (kind) {
    case "recap":
      subject = `Recap from our ${s.service.name.toLowerCase()}`;
      body = `Hi ${first}, that was a really good session. Quick recap so it stays fresh. We made real progress, and your next step is to put it into practice this week. Reply here if anything comes up before we talk again.\n\nTalk soon,\n{{sender}}`;
      break;
    case "review":
      subject = `A quick favor, ${first}?`;
      body = `Hi ${first}, I've really enjoyed working with you. If the sessions have been useful, a short review would mean a lot to me and helps other people find me. You can leave one here whenever you have a minute: {{review_link}}. No pressure at all, and thank you.\n\n{{sender}}`;
      break;
    case "rebook":
      body = `Hi ${first}, want to keep the momentum going? I have a couple of openings next week. Grab whichever works for you: {{booking_link}}. Talk soon, {{sender}}`;
      break;
    case "renewal":
      subject = `Your package is wrapping up`;
      body = `Hi ${first}, your current package is almost used up. Want me to roll you into the next one and hold your usual slot? Just say the word and I'll take care of it.\n\n{{sender}}`;
      break;
  }

  return { bookingId: s.id, kind, subject: channel === "sms" ? null : subject, body, channel, source: "template" };
}
