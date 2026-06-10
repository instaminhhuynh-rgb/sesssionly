import { AutonomyTier, type Proposal, type AuditEvent, type AgentId } from "./types";

/**
 * The approval gate — the single chokepoint between agents and the real world.
 *
 * Tier 0–2 proposals can flow automatically (still audited). Tier 3 proposals
 * (send, charge, refund, cancel, publish) MUST be approved by the host before
 * the Concierge executes them. There is no other path to the tool layer.
 */

export function requiresApproval(p: Proposal): boolean {
  return p.tier >= AutonomyTier.External;
}

/** Host approves a pending proposal. Returns the updated proposal. */
export function approve(p: Proposal): Proposal {
  if (p.status !== "pending") throw new Error(`Cannot approve a proposal in status "${p.status}".`);
  return { ...p, status: "approved" };
}

export function dismiss(p: Proposal): Proposal {
  return { ...p, status: "dismissed" };
}

/**
 * Execute an approved (or auto-eligible) proposal. In the real implementation
 * this is where the Concierge calls the tool layer. Here it only enforces the
 * gate and returns the audit row that MUST be written.
 *
 * Throws if a Tier 3 proposal reaches execution without host approval — this is
 * the invariant the whole safety model rests on.
 */
export function execute(p: Proposal, hostId: string): { proposal: Proposal; audit: AuditEvent } {
  if (requiresApproval(p) && p.status !== "approved") {
    throw new Error(`Tier ${p.tier} proposal from "${p.agent}" cannot execute without host approval.`);
  }
  // TODO(phase-6): dispatch p.payload to the appropriate tool based on p.kind/payload.
  const audit = auditFor(p, hostId);
  return { proposal: { ...p, status: "executed" }, audit };
}

function auditFor(p: Proposal, hostId: string): AuditEvent {
  return {
    id: `audit_${p.id}`,
    hostId,
    actor: "ai",
    agent: p.agent as AgentId,
    action: `${p.kind}.executed`,
    entity: "proposal",
    entityId: p.id,
    proposalId: p.id,
    createdAt: new Date().toISOString(),
  };
}
