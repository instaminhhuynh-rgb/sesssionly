/**
 * Domain types for Sessionly.
 *
 * These are intentionally close to the future Supabase row shapes so the
 * mock-data layer can be swapped for real queries with minimal churn.
 * Snake_case DB columns map to these camelCase fields in the data layer.
 */

export type ClientTag = "Repeat" | "Package" | "At risk" | "Overdue" | "New lead";
export type PaymentStatus = "Paid" | "Unpaid" | "Overdue";

export interface Host {
  id: string;
  firstName: string;
  lastName: string;
  business: string;
  role: string;
  initials: string;
  slug: string;
  timezone: string;
}

export interface Service {
  id: string;
  name: string;
  duration: number; // minutes
  price: number; // total price, cents-safe number in real impl
  deposit: number;
  color: string;
  intake: boolean;
  cancelWindow: number; // hours
  active: boolean;
  bookings: number;
  policy: string;
}

export interface ClientNote {
  d: string; // display date
  t: string; // note text
}

export interface Review {
  d: string;
  stars: number;
  t: string;
  /** True only when the client submitted it via a review request. Host-saved notes are false. */
  verified?: boolean;
}

export interface ClientPayment {
  d: string;
  amt: number;
  status: PaymentStatus;
  what: string;
}

export interface Client {
  id: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  address?: string;
  tag: ClientTag;
  since: string;
  sessions: number;
  cancellations: number;
  noShows: number;
  balance: number;
  depositHeld: number;
  lastSeen: string;
  nextLabel: string;
  avgScore: number;
  lifetime: number;
  color: string;
  /** Optional uploaded photo (data URL). Falls back to color + initials. */
  photo?: string | null;
  prefs: string[];
  notes: ClientNote[];
  reviews: Review[];
  payments: ClientPayment[];
}

export interface Session {
  id: string;
  clientId: string;
  serviceId: string;
  day: string; // ISO date
  start: string; // HH:mm
  end: string; // HH:mm
  confirmed: boolean;
  depositPaid: boolean;
  intakeDone: boolean;
  score: number; // Session Score 0-100
  location: string;
  prep: string;
}

/** Session joined with its client + service (the shape pages actually render). */
export interface EnrichedSession extends Session {
  client: Client;
  service: Service;
}

export interface FollowUp {
  id: string;
  clientId: string;
  kind: string;
  due: string;
  context: string;
  draft: string;
}

export interface AttentionItem {
  id: string;
  icon: "risk" | "money" | "slot" | "intake";
  title: string;
  why: string[];
  actions: string[];
}

export interface OutstandingPayment {
  client: string;
  what: string;
  amt: number;
  status: PaymentStatus;
  age: string;
}
