# Sessionly Agents

The runtime AI brain. One narrow agent per task, coordinated by the **Concierge** orchestrator, working through a **shared store**, a **host-approval gate**, and an **audit log**. Full design + diagram: `../../../SESSIONLY_AGENTS.md`.

```
types.ts         AgentSpec, Proposal, AgentEvent, AutonomyTier, ToolName
events.ts        the typed event catalog (the only triggers)
registry.ts      every agent as a spec — add a pillar by adding a spec here
orchestrator.ts  Concierge: route(event, runAgent) -> proposals
approval.ts      the gate: requiresApproval / approve / execute (+ audit)
```

## The contract

- Agents **never act** — they return `Proposal`s (`draft | recommendation | flag`).
- Every proposal carries an **autonomy tier**. Tier 0–2 can flow automatically (audited); **Tier 3 (send/charge/refund/cancel/publish) needs host approval**.
- The Concierge is the **only** path to the tool layer, and only for approved proposals — each execution writes an `AuditEvent`.
- Agents are **server-side only**. They hold the API key and touch the DB/Stripe; the browser calls a thin server action and never sees a key.

## Run an agent (sketch)

```ts
import { route, type AgentRunner } from "@/lib/agents/orchestrator";
import { makeEvent } from "@/lib/agents/events";

const runAgent: AgentRunner = async (agent, event) => {
  // const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  // const res = await anthropic.messages.create({
  //   model: "claude-sonnet-4-6",
  //   system: agent.systemPrompt,
  //   tools: toolDefsFor(agent.tools),
  //   messages: [{ role: "user", content: contextFor(agent, event) }],
  // });
  // return parseProposals(agent, res);
  return [];
};

const result = await route(makeEvent("slot.opened", hostId, { slotStart, slotEnd, serviceId }), runAgent);
// result.needsApproval -> surface on Today; result.autoEligible -> execute via the Concierge
```

## Add a new agent

1. Add its id to `AgentId` and any new events to `EventType` in `types.ts`.
2. Add an `AgentSpec` to `SPECIALISTS` in `registry.ts` (owns one task, lists `wakesOn`, `tools`, `maxTier`, `systemPrompt`, `guardrails`).
3. That's it — the orchestrator wakes it automatically for its events; the gate enforces its tier.

## Live agent: No-Show / Session Score

The first agent wired end-to-end. Files:

```
no-show/context.ts   builds the signal payload (deposit/confirm/intake + client history)
no-show/agent.ts     scoreSession(bookingId): Claude tool-call -> validated score + reasons,
                     with a deterministic heuristic fallback
anthropic.ts         server-only Anthropic client (null when no key)
../../app/api/session-score/route.ts   POST { bookingId } -> SessionScoreResult
```

Flow: the **Session detail** drawer has a **"Score with AI"** button → it POSTs to `/api/session-score` → the agent builds the signals, asks Claude to return a structured score **and its reasons** via a forced `submit_session_score` tool call, validates/clamps the result, and renders it. The score is host-only and never returned without reasons.

**Test it:**

```bash
# with a key set in .env.local — real Claude score:
curl -s localhost:3000/api/session-score -H 'content-type: application/json' -d '{"bookingId":"ses_4"}' | jq

# without a key — identical shape, source:"heuristic":
# (unset ANTHROPIC_API_KEY) same curl returns the deterministic fallback
```

`ses_4` (John Davies) is the high-risk seed: no deposit, intake incomplete, prior cancellations — a good one to watch the reasons populate.

## Keys

Set `ANTHROPIC_API_KEY` server-side only (see `../../.env.local.example`). Create a `Sessionly` workspace in the Claude Console to isolate keys + spend limits.
