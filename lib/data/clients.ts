"use client";

import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { getClients } from "@/lib/mock-data";
import type { Client, ClientTag } from "@/lib/types";

/**
 * Clients data layer. When Supabase is configured, reads/writes the real
 * `clients` table (scoped to the signed-in host by row-level security).
 * Otherwise falls back to the in-memory mock so the demo keeps working.
 */

export interface NewClientInput {
  name: string;
  email: string;
  phone: string;
  address: string;
  tag: ClientTag;
  color: string;
  photo: string | null;
  note: string;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.map((p) => p[0]).slice(0, 2).join("") || "?").toUpperCase();
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToClient(row: any): Client {
  return {
    id: row.id,
    name: row.name,
    initials: initialsOf(row.name),
    email: row.email ?? "",
    phone: row.phone ?? "",
    address: row.address ?? "",
    tag: (row.tag ?? "New lead") as ClientTag,
    since: row.since ?? (typeof row.created_at === "string" ? row.created_at.slice(0, 7) : ""),
    sessions: 0,
    cancellations: 0,
    noShows: 0,
    balance: 0,
    depositHeld: 0,
    lastSeen: "Just added",
    nextLabel: "—",
    avgScore: 60,
    lifetime: Math.round((row.lifetime_cents ?? 0) / 100),
    color: row.color ?? "#3E5C76",
    photo: row.photo ?? null,
    prefs: row.prefs ?? [],
    notes: [],
    reviews: [],
    payments: [],
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Live mode flag the UI can read to know whether data persists. */
export const clientsAreLive = supabaseConfigured;

export async function listClients(): Promise<Client[]> {
  if (!supabaseConfigured) return getClients();
  const supabase = createClient();
  const { data, error } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToClient);
}

export async function addClient(input: NewClientInput): Promise<Client> {
  // Demo mode: build a local client (not persisted).
  if (!supabaseConfigured) {
    const now = new Date();
    return {
      id: "cl_" + now.getTime(),
      name: input.name.trim(),
      initials: initialsOf(input.name),
      email: input.email.trim(),
      phone: input.phone.trim(),
      address: input.address.trim(),
      tag: input.tag,
      since: now.toISOString().slice(0, 7),
      sessions: 0,
      cancellations: 0,
      noShows: 0,
      balance: 0,
      depositHeld: 0,
      lastSeen: "Just added",
      nextLabel: "—",
      avgScore: 60,
      lifetime: 0,
      color: input.color,
      photo: input.photo,
      prefs: [],
      notes: [],
      reviews: [],
      payments: [],
    };
  }

  const supabase = createClient();
  // The host's own id (RLS lets a host read only their own hosts row).
  const { data: hostRow, error: hostErr } = await supabase.from("hosts").select("id").limit(1).single();
  if (hostErr || !hostRow) throw new Error(hostErr?.message || "Could not find your host record.");

  const { data, error } = await supabase
    .from("clients")
    .insert({
      host_id: hostRow.id,
      name: input.name.trim(),
      email: input.email.trim() || null,
      phone: input.phone.trim() || null,
      address: input.address.trim() || null,
      tag: input.tag,
      color: input.color,
      photo: input.photo,
      since: new Date().toISOString().slice(0, 7),
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return rowToClient(data);
}
