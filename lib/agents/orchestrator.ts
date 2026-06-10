import type { AgentEvent, AgentSpec, Proposal } from "./types";
import { AutonomyTier } from "./types";
import { agentsForEvent } from "./registry";
import { requiresApproval } from "./approval";

/**
 * The Concierge orchestrator (stub).
 *
 * Flow: an event arrives -> wake the specialists that subscribe to it ->
 * each runs and returns proposals -> proposals are split into auto-eligible
 * (Tier 0–2) and host-approval-required (Tier 3) -> auto ones can execute,
 * the rest surface on Today for the host to approve.
 *
 * `runAgent` is the seam where a real model call goes (Claude Messages API or
 * the Agent SDK). It's injected so the orchestrator stays testable and
 * provider-agnostic.
 */

export type AgentRunner = (agent: AgentSpec, event: AgentEvent) => Promise<Proposal[]>;

export interface RouteResult {
  woke: string[];
  proposals: Proposal[];
  autoEligible: Proposal[];
  needsApproval: Proposal[];
}

export async function route(event: AgentEvent, runAgent: AgentRunner): Promise<RouteResult> {
  const woken = agentsForEvent(event.type);
  const batches = await Promise.all(woken.map((a) => runAgent(a, event)));
  const proposals = batches.flat();

  // Enforce each agent's tier ceiling — a proposal can never exceed its spec.
  for (const p of proposals) {
    const spec = woken.find((a) => a.id === p.agent);
    if (spec && p.tier > spec.maxTier) {
      throw new Error(`Agent "${p.agent}" emitted Tier ${p.tier} but its ceiling is ${spec.maxTier}.`);
    }
  }

  return {
    woke: woken.map((a) => a.id),
    proposals,
    autoEligible: proposals.filter((p) => p.tier <= AutonomyTier.ReversibleWrite),
    needsApproval: proposals.filter(requiresApproval),
  };
}

/**
 * Example runner stub. Replace with a real call:
 *
 *   const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
 *   const res = await anthropic.messages.create({
 *     model: "claude-sonnet-4-6",
 *     system: agent.systemPrompt,
 *     tools: toolDefsFor(agent.tools),
 *     messages: [{ role: "user", content: contextFor(agent, event) }],
 *   });
 *   return parseProposals(agent, res);
 */
export const stubRunner: AgentRunner = async (agent, event) => {
  return [
    {
      id: `prop_${agent.id}_${Date.now()}`,
      agent: agent.id,
      kind: "recommendation",
      payload: { note: `${agent.name} would act on ${event.type}`, owns: agent.owns },
      tier: Math.min(agent.maxTier, AutonomyTier.Draft) as AutonomyTier,
      references: [],
      createdAt: new Date().toISOString(),
      status: "pending",
    },
  ];
};
