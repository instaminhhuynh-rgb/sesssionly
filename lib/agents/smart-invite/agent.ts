import "server-only";
import { HOST, getService, getClientByName } from "@/lib/mock-data";
import { getAgent } from "@/lib/agents/registry";
import { getAnthropic, SCORING_MODEL } from "@/lib/agents/anthropic";

/**
 * Smart Invite agent — writes the personal invite message. Draft only (Tier 1).
 * Falls back to a clean template when there's no key.
 */
export interface InviteInput {
  recipient: string;
  serviceId: string;
  reqDeposit: boolean;
  reqIntake: boolean;
}
export interface InviteDraft {
  body: string;
  source: "ai" | "template";
  model?: string;
}

const SUGGESTED = ["Thu Jun 11, 10:30 AM", "Fri Jun 12, 1:00 PM", "Mon Jun 15, 9:00 AM"];

const TOOL = {
  name: "submit_invite",
  description: "Return the personal invite message body the host will review and send.",
  input_schema: {
    type: "object" as const,
    properties: {
      body: { type: "string", description: "The invite message. Warm, short, personal. End with the sign-off token {{sender}} on its own final line." },
    },
    required: ["body"],
  },
};

export async function draftInvite(input: InviteInput): Promise<InviteDraft> {
  const service = getService(input.serviceId);
  if (!service) throw new Error(`Unknown service: ${input.serviceId}`);

  const client = getAnthropic();
  if (!client) return template(input, service.name, service.deposit, service.price);

  try {
    const recipientClient = getClientByName(input.recipient);
    const signals = {
      recipientFirstName: input.recipient.split(" ")[0],
      relationship: recipientClient ? { tag: recipientClient.tag, sessionsAttended: recipientClient.sessions, prefs: recipientClient.prefs } : "new contact",
      service: { name: service.name, price: service.price, deposit: service.deposit, cancelWindow: service.cancelWindow },
      requireDeposit: input.reqDeposit && service.deposit > 0,
      requireIntake: input.reqIntake,
      suggestedTimes: SUGGESTED,
      bookingLink: `sessionly.com/${HOST.slug}/invite`,
    };
    const spec = getAgent("smart_invite");

    const msg = await client.messages.create({
      model: SCORING_MODEL,
      max_tokens: 500,
      system: `${spec.systemPrompt}\n\nWrite a short, warm invite (4-6 lines). Offer the suggested times. If a deposit is required, mention it briefly and reassuringly. Include the booking link. End with the sign-off token "{{sender}}" on its own final line. Call submit_invite.`,
      tools: [TOOL],
      tool_choice: { type: "tool", name: TOOL.name },
      messages: [{ role: "user", content: `Write the invite. Context:\n${JSON.stringify(signals, null, 2)}` }],
    });

    const block = (msg.content as unknown as Array<{ type: string; input?: unknown }>).find((b) => b.type === "tool_use");
    if (!block || typeof block.input !== "object" || block.input === null) return template(input, service.name, service.deposit, service.price);
    const body = typeof (block.input as Record<string, unknown>).body === "string" ? ((block.input as Record<string, unknown>).body as string).trim() : "";
    if (!body) return template(input, service.name, service.deposit, service.price);

    return { body, source: "ai", model: SCORING_MODEL };
  } catch {
    return template(input, service.name, service.deposit, service.price);
  }
}

export function template(input: InviteInput, serviceName: string, deposit: number, price: number): InviteDraft {
  const first = input.recipient.split(" ")[0] || "there";
  const lines = [
    `Hi ${first}, I'd love to get our next ${serviceName.toLowerCase()} on the calendar.`,
    `Here are a few times that work on my end:`,
    ...SUGGESTED.map((t) => `  ${t}`),
    input.reqDeposit && deposit ? `A $${deposit} deposit holds your spot, and it comes off the $${price} total.` : "",
    input.reqIntake ? `There's a quick intake so I can prepare. It takes about two minutes.` : "",
    `Pick a time here: sessionly.com/${HOST.slug}/invite`,
    ``,
    `{{sender}}`,
  ].filter((l) => l !== "");
  return { body: lines.join("\n"), source: "template" };
}
