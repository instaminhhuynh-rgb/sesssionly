import "server-only";
import { getAgent } from "@/lib/agents/registry";
import { getAnthropic, SCORING_MODEL } from "@/lib/agents/anthropic";

/**
 * Service Builder agent — turns a free-text description into a structured
 * service draft. Draft only; the host saves it. Falls back to a basic parse.
 */
export interface ServiceDraft {
  name: string;
  duration: number;
  price: number;
  deposit: number;
  intake: boolean;
  cancelWindow: number;
  policy: string;
  source: "ai" | "template";
  model?: string;
}

const TOOL = {
  name: "submit_service",
  description: "Return a structured service definition with a clear, friendly policy.",
  input_schema: {
    type: "object" as const,
    properties: {
      name: { type: "string", maxLength: 60 },
      duration: { type: "integer", description: "Minutes." },
      price: { type: "integer", description: "Total price in whole dollars." },
      deposit: { type: "integer", description: "Deposit in whole dollars, 0 if none." },
      intake: { type: "boolean", description: "Whether a pre-session intake is required." },
      cancelWindow: { type: "integer", description: "Cancellation window in hours." },
      policy: { type: "string", maxLength: 280, description: "Friendly plain-language policy sentence(s)." },
    },
    required: ["name", "duration", "price", "deposit", "intake", "cancelWindow", "policy"],
  },
};

export async function buildService(description: string): Promise<ServiceDraft> {
  const client = getAnthropic();
  if (!client) return template(description);

  try {
    const spec = getAgent("service_builder");
    const msg = await client.messages.create({
      model: SCORING_MODEL,
      max_tokens: 500,
      system: `${spec.systemPrompt}\n\nTurn the description into a structured service. Infer sensible defaults when unstated (e.g. 24h cancellation, intake for paid services). Write a short, friendly policy. Call submit_service.`,
      tools: [TOOL],
      tool_choice: { type: "tool", name: TOOL.name },
      messages: [{ role: "user", content: `Description: ${description}` }],
    });

    const block = (msg.content as unknown as Array<{ type: string; input?: unknown }>).find((b) => b.type === "tool_use");
    if (!block || typeof block.input !== "object" || block.input === null) return template(description);
    const r = block.input as Record<string, unknown>;

    return {
      name: str(r.name, "New Service"),
      duration: int(r.duration, 60),
      price: int(r.price, 0),
      deposit: int(r.deposit, 0),
      intake: r.intake === true,
      cancelWindow: int(r.cancelWindow, 24),
      policy: str(r.policy, "Standard cancellation policy applies."),
      source: "ai",
      model: SCORING_MODEL,
    };
  } catch {
    return template(description);
  }
}

function str(v: unknown, fallback: string): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}
function int(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : fallback;
}

export function template(description: string): ServiceDraft {
  return {
    name: description.slice(0, 40) || "New Service",
    duration: 60,
    price: 150,
    deposit: 50,
    intake: true,
    cancelWindow: 24,
    policy: "A deposit holds your spot and comes off the total. Please give at least 24 hours notice to cancel or reschedule.",
    source: "template",
  };
}
