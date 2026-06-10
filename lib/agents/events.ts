import type { AgentEvent, EventType } from "./types";

/**
 * The event catalog. These are the only triggers in the system — agents react
 * to events via the orchestrator, never call each other directly.
 *
 * Each entry documents the expected payload shape. When the backend lands,
 * these events are emitted from DB triggers / webhooks / a daily cron.
 */
export const EVENT_CATALOG: Record<EventType, { description: string; payload: string }> = {
  "day.start": { description: "Fired once each morning to build the Daily Briefing.", payload: "{ date }" },
  "booking.created": { description: "A new booking exists.", payload: "{ bookingId }" },
  "booking.changed": { description: "A booking's time/state changed.", payload: "{ bookingId }" },
  "session.completed": { description: "A session finished — triggers follow-up.", payload: "{ bookingId }" },
  "payment.overdue": { description: "An invoice passed its due date.", payload: "{ paymentId }" },
  "deposit.due": { description: "A deposit is required before an upcoming session.", payload: "{ bookingId }" },
  "slot.opened": { description: "A cancellation freed a bookable slot.", payload: "{ slotStart, slotEnd, serviceId }" },
  "intake.submitted": { description: "A client completed an intake form.", payload: "{ bookingId, responseId }" },
  "intake.missing": { description: "Intake is incomplete as a session approaches.", payload: "{ bookingId }" },
  "lead.cold": { description: "A lead has gone quiet — candidate for a Smart Invite nudge.", payload: "{ clientId }" },
  "host.request": { description: "The host explicitly invoked an agent.", payload: "{ agent, input }" },
};

export function makeEvent(type: EventType, hostId: string, payload: Record<string, unknown>): AgentEvent {
  return { type, hostId, payload, occurredAt: new Date().toISOString() };
}
