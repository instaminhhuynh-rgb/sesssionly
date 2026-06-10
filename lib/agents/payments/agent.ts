import "server-only";
import { getClientByName } from "@/lib/mock-data";
import { getAgent } from "@/lib/agents/registry";
import { getAnthropic, SCORING_MODEL } from "@/lib/agents/anthropic";

/**
 * Payments agent — drafts a payment reminder tuned to the client's history
 * (gentle for reliable payers, firmer for repeat-late). Draft only; it never
 * moves money. Falls back to a template.
 */
export interface ReminderInput {
  client: string;
  what: string;
  amount: number;
  status: string; // "Overdue" | "Unpaid"
  age: string;
}
export interface ReminderDraft {
  subject: string | null;
  body: string;
  tone: "gentle" | "firm";
  source: "ai" | "template";
  model?: string;
}

const TOOL = {
  name: "submit_reminder",
  description: "Return a payment reminder message tuned to the client's history.",
  input_schema: {
    type: "object" as const,
    properties: {
      subject: { type: "string", maxLength: 80 },
      body: { type: "string", description: "The reminder body. Polite, clear about amount and what it's for. End with the sign-off token {{sender}}." },
      tone: { type: "string", enum: ["gentle", "firm"] },
    },
    required: ["body", "tone"],
  },
};

export async function draftReminder(input: ReminderInput): Promise<ReminderDraft> {
  const client = getAnthropic();
  const record = getClientByName(input.client);
  const reliable = !record || (record.cancellations === 0 && record.noShows === 0);

  if (!client) return template(input, reliable);

  try {
    const spec = getAgent("payments");
    const signals = {
      client: input.client,
      owes: `$${input.amount} for ${input.what}`,
      status: input.status,
      age: input.age,
      history: record ? { tag: record.tag, sessionsAttended: record.sessions, cancellations: record.cancellations, noShows: record.noShows } : "limited history",
      suggestedTone: reliable ? "gentle" : "firm",
    };
    const msg = await client.messages.create({
      model: SCORING_MODEL,
      max_tokens: 450,
      system: `${spec.systemPrompt}\n\nDraft a short payment reminder. Be ${reliable ? "warm and gentle, assuming the best" : "polite but firm and clear about next steps"}. State the amount and what it's for. Offer an easy way to pay. End with the sign-off token "{{sender}}". Call submit_reminder.`,
      tools: [TOOL],
      tool_choice: { type: "tool", name: TOOL.name },
      messages: [{ role: "user", content: `Draft the reminder. Context:\n${JSON.stringify(signals, null, 2)}` }],
    });

    const block = (msg.content as unknown as Array<{ type: string; input?: unknown }>).find((b) => b.type === "tool_use");
    if (!block || typeof block.input !== "object" || block.input === null) return template(input, reliable);
    const r = block.input as Record<string, unknown>;
    const body = typeof r.body === "string" ? r.body.trim() : "";
    if (!body) return template(input, reliable);
    const subject = typeof r.subject === "string" && r.subject.trim() ? r.subject.trim() : null;
    const tone: ReminderDraft["tone"] = r.tone === "firm" ? "firm" : "gentle";

    return { subject, body, tone, source: "ai", model: SCORING_MODEL };
  } catch {
    return template(input, reliable);
  }
}

export function template(input: ReminderInput, reliable: boolean): ReminderDraft {
  const first = input.client.split(" ")[0];
  if (reliable) {
    return {
      subject: `Quick note on your invoice`,
      body: `Hi ${first}, just a friendly nudge that the $${input.amount} for ${input.what} is still open (${input.age}). No worries at all if it slipped your mind. You can settle it here whenever you get a moment: {{pay_link}}.\n\nThanks,\n{{sender}}`,
      tone: "gentle",
      source: "template",
    };
  }
  return {
    subject: `Payment due: ${input.what}`,
    body: `Hi ${first}, following up on the $${input.amount} for ${input.what}, which is now ${input.age}. Please settle it here in the next day or two so we can keep things on track: {{pay_link}}. Let me know if anything is getting in the way.\n\nThanks,\n{{sender}}`,
    tone: "firm",
    source: "template",
  };
}
