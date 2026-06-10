import type {
  Host,
  Service,
  Client,
  Session,
  EnrichedSession,
  FollowUp,
  AttentionItem,
  OutstandingPayment,
} from "./types";

/**
 * Mock data layer.
 *
 * Everything the UI needs goes through the accessor functions at the bottom
 * (getHost, getServices, getSessions, ...). When Supabase is wired up, only
 * those functions change — components keep calling the same API.
 */

export const HOST: Host = {
  id: "host_1",
  firstName: "Minh",
  lastName: "Huynh",
  business: "Minh Huynh Coaching",
  role: "Leadership & Career Coach",
  initials: "MH",
  slug: "minh",
  timezone: "America/Los_Angeles",
};

export const SERVICES: Service[] = [
  { id: "svc_disc", name: "Discovery Call", duration: 30, price: 0, deposit: 0, color: "#8AA0B2", intake: true, cancelWindow: 12, active: true, bookings: 34, policy: "Free intro call. One per client. No deposit. 12-hour cancellation window." },
  { id: "svc_1on1", name: "1:1 Coaching Session", duration: 60, price: 180, deposit: 50, color: "#3E5C76", intake: true, cancelWindow: 24, active: true, bookings: 128, policy: "$50 deposit applied to balance. 24-hour cancellation window. Deposit forfeited on late cancel or no-show." },
  { id: "svc_intensive", name: "Strategy Intensive", duration: 90, price: 320, deposit: 100, color: "#5B8266", intake: true, cancelWindow: 48, active: true, bookings: 41, policy: "$100 deposit. 48-hour cancellation window. Pre-session intake required." },
  { id: "svc_pkg", name: "Monthly Coaching Package", duration: 60, price: 640, deposit: 160, color: "#A6794C", intake: true, cancelWindow: 24, active: true, bookings: 22, policy: "4 sessions / month. 25% deposit. Sessions expire at month end." },
  { id: "svc_workshop", name: "Team Workshop", duration: 120, price: 1200, deposit: 300, color: "#7A5C8E", intake: true, cancelWindow: 72, active: false, bookings: 6, policy: "On-site available (travel mode). $300 deposit. 72-hour cancellation window." },
];

export const CLIENTS: Client[] = [
  {
    id: "cl_sarah", name: "Sarah Mitchell", initials: "SM", email: "sarah.m@example.com", phone: "(415) 555-0118",
    tag: "Repeat", since: "2024-09", sessions: 7, cancellations: 0, noShows: 0, balance: 0, depositHeld: 50,
    lastSeen: "Yesterday", nextLabel: "Today 10:30 AM", avgScore: 94, lifetime: 1260, color: "#3E5C76",
    prefs: ["Prefers mornings", "Working on Q3 promotion case", "Direct feedback style"],
    notes: [
      { d: "Jun 8", t: "Session 7 — mapped the promotion conversation. Felt much more confident. Wants to role-play the salary ask next time." },
      { d: "May 25", t: "Discussed manager friction. Action: send weekly update email to skip-level." },
    ],
    reviews: [{ d: "May 2026", stars: 5, t: "Minh helped me reframe how I show up in leadership meetings. I got the promotion. Worth every dollar." }],
    payments: [{ d: "Jun 1", amt: 180, status: "Paid", what: "1:1 Coaching" }, { d: "May 18", amt: 180, status: "Paid", what: "1:1 Coaching" }],
  },
  {
    id: "cl_john", name: "John Davies", initials: "JD", email: "john.d@example.com", phone: "(415) 555-0922",
    tag: "At risk", since: "2025-03", sessions: 3, cancellations: 2, noShows: 1, balance: 50, depositHeld: 0,
    lastSeen: "3 weeks ago", nextLabel: "Tomorrow 9:00 AM", avgScore: 42, lifetime: 360, color: "#BE123C",
    prefs: ["Reschedules often", "Reach via SMS", "Intake usually incomplete"],
    notes: [{ d: "May 19", t: "No-show on rescheduled session. Sent gentle check-in. Suggested moving to deposit-required booking." }],
    reviews: [],
    payments: [{ d: "Apr 30", amt: 180, status: "Paid", what: "1:1 Coaching" }, { d: "Jun 7", amt: 50, status: "Unpaid", what: "Deposit — tomorrow" }],
  },
  {
    id: "cl_priya", name: "Priya Sharma", initials: "PS", email: "priya.s@example.com", phone: "(206) 555-0143",
    tag: "New lead", since: "2026-06", sessions: 0, cancellations: 0, noShows: 0, balance: 0, depositHeld: 0,
    lastSeen: "—", nextLabel: "Today 1:00 PM", avgScore: 61, lifetime: 0, color: "#A6794C",
    prefs: ["Inbound from LinkedIn", "Exploring career pivot into PM"],
    notes: [{ d: "Jun 6", t: "Booked discovery call via Smart Invite. Intake not yet completed." }],
    reviews: [],
    payments: [],
  },
  {
    id: "cl_marcus", name: "Marcus Chen", initials: "MC", email: "marcus.c@example.com", phone: "(312) 555-0177",
    tag: "Package", since: "2025-01", sessions: 18, cancellations: 1, noShows: 0, balance: 0, depositHeld: 160,
    lastSeen: "Last week", nextLabel: "Today 3:30 PM", avgScore: 88, lifetime: 3840, color: "#5B8266",
    prefs: ["Monthly package", "Founder — fundraising stress", "Likes structured agendas"],
    notes: [{ d: "Jun 2", t: "Session focused on board update narrative. Renewal due — package resets Jun 30." }],
    reviews: [{ d: "Mar 2026", stars: 5, t: "The monthly cadence keeps me accountable. Sessionly reminders mean I never miss." }],
    payments: [{ d: "Jun 1", amt: 640, status: "Paid", what: "Monthly Package" }],
  },
  {
    id: "cl_elena", name: "Elena Rodriguez", initials: "ER", email: "elena.r@example.com", phone: "(646) 555-0190",
    tag: "Repeat", since: "2025-06", sessions: 9, cancellations: 0, noShows: 0, balance: 0, depositHeld: 0,
    lastSeen: "Jun 6", nextLabel: "—", avgScore: 90, lifetime: 1620, color: "#7A5C8E",
    prefs: ["VP Eng", "Prefers Friday afternoons", "Working on delegation"],
    notes: [{ d: "Jun 6", t: "Completed Strategy Intensive. Big breakthrough on delegation framework. Follow-up: send recap + review request." }],
    reviews: [],
    payments: [{ d: "Jun 6", amt: 320, status: "Paid", what: "Strategy Intensive" }],
  },
  {
    id: "cl_david", name: "David Thompson", initials: "DT", email: "david.t@example.com", phone: "(503) 555-0155",
    tag: "Overdue", since: "2025-08", sessions: 5, cancellations: 0, noShows: 0, balance: 180, depositHeld: 0,
    lastSeen: "Jun 3", nextLabel: "—", avgScore: 79, lifetime: 900, color: "#B45309",
    prefs: ["Invoices monthly", "Slow to pay but reliable"],
    notes: [{ d: "Jun 3", t: "Session went well. Invoice sent same day — still unpaid." }],
    reviews: [],
    payments: [{ d: "Jun 3", amt: 180, status: "Overdue", what: "1:1 Coaching — 6 days overdue" }],
  },
];

// Week of Mon Jun 8 – Sun Jun 14, 2026. (Jun 9 = today, Tuesday.)
export const TODAY = "2026-06-09";

export const SESSIONS: Session[] = [
  { id: "ses_1", clientId: "cl_sarah", serviceId: "svc_1on1", day: "2026-06-09", start: "10:30", end: "11:30", confirmed: true, depositPaid: true, intakeDone: true, score: 94, location: "Zoom", prep: "Role-play the salary negotiation. She wants to practice the opening line and how to hold silence after stating her number." },
  { id: "ses_2", clientId: "cl_priya", serviceId: "svc_disc", day: "2026-06-09", start: "13:00", end: "13:30", confirmed: true, depositPaid: true, intakeDone: false, score: 61, location: "Zoom", prep: "First call. Intake not completed — confirm goals live. Inbound from LinkedIn, exploring a pivot into product management." },
  { id: "ses_3", clientId: "cl_marcus", serviceId: "svc_intensive", day: "2026-06-09", start: "15:30", end: "17:00", confirmed: true, depositPaid: true, intakeDone: true, score: 88, location: "Zoom", prep: "Board update narrative round 2. Bring the one-pager template. Package renews Jun 30 — flag near end." },
  { id: "ses_4", clientId: "cl_john", serviceId: "svc_1on1", day: "2026-06-10", start: "09:00", end: "10:00", confirmed: false, depositPaid: false, intakeDone: false, score: 42, location: "Zoom", prep: "High no-show risk: no deposit, intake incomplete, 2 prior cancellations. Engine recommends requiring deposit + confirmation before this runs." },
  { id: "ses_5", clientId: "cl_marcus", serviceId: "svc_1on1", day: "2026-06-11", start: "11:00", end: "12:00", confirmed: true, depositPaid: true, intakeDone: true, score: 90, location: "Zoom", prep: "Package session 3 of 4. Continue fundraising prep." },
  { id: "ses_6", clientId: "cl_sarah", serviceId: "svc_1on1", day: "2026-06-12", start: "10:30", end: "11:30", confirmed: true, depositPaid: true, intakeDone: true, score: 95, location: "Zoom", prep: "Follow-through on salary ask. Debrief the real conversation if it happened." },
];

export const FOLLOWUPS: FollowUp[] = [
  { id: "fu_1", clientId: "cl_elena", kind: "Recap + review request", due: "Today", context: "Strategy Intensive completed Jun 6", draft: "Hi Elena — what a session. You landed on a delegation framework you can actually use this week: name the outcome, hand over the decision, check in on the metric (not the method).\n\nTwo small asks:\n1) Try it on one project before Friday and note what felt hard.\n2) If Sessionly's been useful, a short review means a lot: {{review_link}}\n\nProud of the progress. — Minh" },
  { id: "fu_2", clientId: "cl_marcus", kind: "Package renewal", due: "Jun 28", context: "Monthly package resets Jun 30", draft: "Hi Marcus — your June package wraps at month end and you've used 3 of 4 sessions. Want me to roll you into July? I can hold your usual Wednesday 11:00 slot. — Minh" },
  { id: "fu_3", clientId: "cl_sarah", kind: "Rebook prompt", due: "Today", context: "Session 7 completed yesterday", draft: "Hi Sarah — great work yesterday. Next time we role-play the salary ask. I've got Friday 10:30 open if you want to lock it in: {{booking_link}} — Minh" },
];

export const NEEDS_ATTENTION: AttentionItem[] = [
  { id: "na_1", icon: "risk", title: "John Davies — tomorrow 9:00 AM is high-risk", why: ["No deposit on file", "Intake incomplete", "2 prior cancellations, 1 no-show"], actions: ["Require deposit", "Request confirmation"] },
  { id: "na_2", icon: "money", title: "David Thompson invoice is 6 days overdue", why: ["$180 unpaid since Jun 3", "Reliable payer, just slow"], actions: ["Send gentle reminder"] },
  { id: "na_3", icon: "slot", title: "Open slot tomorrow 2:00 PM", why: ["Cancellation opened a 60-min gap", "2 waitlist clients fit this service"], actions: ["Offer to waitlist"] },
  { id: "na_4", icon: "intake", title: "Priya Sharma intake not completed", why: ["Discovery call today at 1:00 PM", "Form sent Jun 6, not opened"], actions: ["Resend intake"] },
];

export const OUTSTANDING: OutstandingPayment[] = [
  { client: "David Thompson", what: "1:1 Coaching", amt: 180, status: "Overdue", age: "6 days" },
  { client: "John Davies", what: "Deposit — tomorrow", amt: 50, status: "Unpaid", age: "Due before session" },
];

export const DEPOSITS_HELD = [
  { client: "Sarah Mitchell", what: "1:1 Coaching today", amt: 50 },
  { client: "Marcus Chen", what: "Monthly package", amt: 160 },
];

export const RECENT_PAID = [
  { client: "Marcus Chen", what: "Monthly Package", amt: 640, d: "Jun 1" },
  { client: "Elena Rodriguez", what: "Strategy Intensive", amt: 320, d: "Jun 6" },
  { client: "Sarah Mitchell", what: "1:1 Coaching", amt: 180, d: "Jun 1" },
];

export const REVENUE_WEEKS = [1280, 1640, 1420, 1980, 2140, 2380];
export const WEEK_LABELS = ["May 5", "May 12", "May 19", "May 26", "Jun 2", "Jun 9"];

/* ------------------------------------------------------------------ */
/* Accessors — the seam where Supabase queries will eventually live.   */
/* ------------------------------------------------------------------ */

export function getHost(): Host {
  return HOST;
}
export function getServices(): Service[] {
  return SERVICES;
}
export function getService(id: string): Service | undefined {
  return SERVICES.find((s) => s.id === id);
}
export function getClients(): Client[] {
  return CLIENTS;
}
export function getClient(id: string): Client | undefined {
  return CLIENTS.find((c) => c.id === id);
}
export function getClientByName(name: string): Client | undefined {
  return CLIENTS.find((c) => c.name.toLowerCase() === name.toLowerCase());
}
export function enrichSession(s: Session): EnrichedSession {
  return { ...s, client: getClient(s.clientId)!, service: getService(s.serviceId)! };
}
export function getSessions(): EnrichedSession[] {
  return SESSIONS.map(enrichSession);
}
export function getSessionsForDay(day: string): EnrichedSession[] {
  return SESSIONS.filter((s) => s.day === day).map(enrichSession);
}
export function getSessionsForClient(clientId: string): EnrichedSession[] {
  return SESSIONS.filter((s) => s.clientId === clientId).map(enrichSession);
}
export function getSessionById(id: string): EnrichedSession | undefined {
  const s = SESSIONS.find((x) => x.id === id);
  return s ? enrichSession(s) : undefined;
}
