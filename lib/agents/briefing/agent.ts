import "server-only";
import { getAgent } from "@/lib/agents/registry";
import { getAnthropic, SCORING_MODEL } from "@/lib/agents/anthropic";
import { buildBriefingSignals } from "./context";

/**
 * AI Daily Briefing agent — end to end.
 *
 * composeBriefing() turns today's data into a short, calm, prioritized briefing
 * for the Today screen. Draft only (Tier 1). Falls back to a fixed briefing
 * when there's no key or the call fails.
 */

export interface BriefingResult {
  paragraphs: string[];
  actions: string[];
  source: "ai" | "template";
  model?: string;
}

const TOOL = {
  name: "submit_briefing",
  description: "Return the host's morning briefing as 2-3 short paragraphs plus a few quick action labels.",
  input_schema: {
    type: "object" as const,
    properties: {
      paragraphs: {
        type: "array",
        items: { type: "string", maxLength: 320 },
        description: "2-3 short paragraphs. Lead with what needs the host first.",
        minItems: 2,
        maxItems: 3,
      },
      actions: {
        type: "array",
        items: { type: "string", maxLength: 28 },
        description: "2-4 short imperative button labels, max 4 words each.",
      },
    },
    required: ["paragraphs", "actions"],
  },
};

export async function composeBriefing(): Promise<BriefingResult> {
  const client = getAnthropic();
  if (!client) return TEMPLATE;

  try {
    const signals = buildBriefingSignals();
    const spec = getAgent("briefing");

    const msg = await client.messages.create({
      model: SCORING_MODEL,
      max_tokens: 700,
      system: `${spec.systemPrompt}\n\nWrite a warm, calm briefing of 2-3 short paragraphs. Lead with what needs the host first (risk, then money, then opportunities). Be specific with names and numbers from the data. Each action is a short button label (max 4 words). Summarize ONLY the provided data. Call submit_briefing.`,
      tools: [TOOL],
      tool_choice: { type: "tool", name: TOOL.name },
      messages: [{ role: "user", content: `Today's data:\n${JSON.stringify(signals, null, 2)}` }],
    });

    const block = (msg.content as unknown as Array<{ type: string; input?: unknown }>).find((b) => b.type === "tool_use");
    if (!block || typeof block.input !== "object" || block.input === null) return TEMPLATE;

    const raw = block.input as Record<string, unknown>;
    const paragraphs = toStringArray(raw.paragraphs, 3);
    const actions = toStringArray(raw.actions, 4);
    if (paragraphs.length === 0) return TEMPLATE;

    return { paragraphs, actions, source: "ai", model: SCORING_MODEL };
  } catch {
    return TEMPLATE;
  }
}

function toStringArray(v: unknown, max: number): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).slice(0, max);
}

const TEMPLATE: BriefingResult = {
  paragraphs: [
    "Good morning, Minh. You have three sessions today. They're all set except one thing. Priya's intake isn't done before her 1:00 discovery call, so I drafted a resend for you.",
    "Tomorrow's 9:00 with John Davies is your main worry. No deposit, intake incomplete, and two past cancellations. I'd ask for a deposit and a confirmation before it runs.",
    "On the money side, David Thompson is six days overdue at $180, and I've drafted a gentle reminder. You also have a 2:00 PM gap tomorrow from a cancellation, and two waitlist clients would fit it nicely.",
  ],
  actions: ["Resend Priya's intake", "Protect John's session", "Send David a reminder"],
  source: "template",
};
