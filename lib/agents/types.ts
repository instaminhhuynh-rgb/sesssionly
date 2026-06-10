/**
 * Agent system types.
 *
 * Sessionly's AI is a set of narrow agents coordinated by an orchestrator
 * (the Concierge). Each agent is described by an `AgentSpec`. Agents never act
 * directly — they emit `Proposal`s. Only the Concierge, after host approval for
 * Tier 3, executes anything. See SESSIONLY_AGENTS.md for the full design.
 *
 * These specs are provider-agnostic: a runner turns an AgentSpec + context into
 * a Claude Messages API call (or an Agent SDK run). Swapping runners never
 * touches the specs.
 */

/** What an agent is allowed to do without a human in the loop. */
export enum AutonomyTier {
  /** Read, compute, summarize. No writes. */
  Observe = 0,
  /** Write a draft/proposal. Never sends or charges. */
  Draft = 1,
  /** Reversible internal write (score, tag, prep note). Auto + audit. */
  ReversibleWrite = 2,
  /** Irreversible / external (send, charge, refund, cancel, publish). Host approval required. */
  External = 3,
}

/** Tools are the ONLY way agents touch the outside world. */
export type ToolName =
  | "db.read"
  | "db.write"
  | "calendar.read"
  | "calendar.write"
  | "stripe.read"
  | "stripe.charge"
  | "stripe.refund"
  | "email.send"
  | "sms.send"
  | "ai.generate";

/** Stable ids for every agent in the registry. */
export type AgentId =
  | "concierge"
  | "briefing"
  | "smart_invite"
  | "scheduling"
  | "no_show"
  | "payments"
  | "follow_up"
  | "slot_recovery"
  | "client_memory"
  | "intake_prep"
  | "service_builder";

/** The events that can wake agents. The orchestrator owns the bus. */
export type EventType =
  | "day.start"
  | "booking.created"
  | "booking.changed"
  | "session.completed"
  | "payment.overdue"
  | "deposit.due"
  | "slot.opened"
  | "intake.submitted"
  | "intake.missing"
  | "lead.cold"
  | "host.request"; // host explicitly invoked an agent (e.g. "Build with AI")

export interface AgentEvent {
  type: EventType;
  hostId: string;
  /** Loosely-typed payload; each event documents its own shape in events.ts. */
  payload: Record<string, unknown>;
  occurredAt: string; // ISO timestamp
}

/** The declarative description of one agent. */
export interface AgentSpec {
  id: AgentId;
  /** Human-facing name. */
  name: string;
  /** One sentence: the single task this agent owns. */
  owns: string;
  /** Events that should wake this agent. */
  wakesOn: EventType[];
  /** Tools this agent may use. Anything not listed is denied. */
  tools: ToolName[];
  /** The agent's ceiling. It can never exceed this tier. */
  maxTier: AutonomyTier;
  /** System prompt used when this agent runs. */
  systemPrompt: string;
  /** Hard rules enforced around the agent, in plain language (and in code where possible). */
  guardrails: string[];
}

/** What an agent produces instead of acting. */
export interface Proposal {
  id: string;
  agent: AgentId;
  kind: "draft" | "recommendation" | "flag";
  /** The proposed content — a message draft, a recommended action, a flag. */
  payload: Record<string, unknown>;
  /** The tier of the action this proposal would trigger if approved. */
  tier: AutonomyTier;
  /** Ids of context rows / other proposals this was derived from (traceability). */
  references: string[];
  createdAt: string;
  status: "pending" | "approved" | "executed" | "dismissed";
}

/** Append-only record of anything an agent or host did. */
export interface AuditEvent {
  id: string;
  hostId: string;
  actor: "host" | "ai";
  agent?: AgentId;
  action: string;
  entity: string;
  entityId: string;
  proposalId?: string;
  createdAt: string;
}
