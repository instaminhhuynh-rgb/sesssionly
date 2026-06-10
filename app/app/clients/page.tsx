"use client";

import { useState } from "react";
import { Avatar, Btn, Card, Pill, ScoreRing, Segmented } from "@/components/ui";
import { Icon } from "@/components/icons";
import { useOverlays } from "@/components/overlays";
import { useToast } from "@/components/toast";
import { getClients } from "@/lib/mock-data";

export default function ClientsPage() {
  const { openClient } = useOverlays();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "attention" | "repeat">("all");
  const clients = getClients();
  const filtered = clients.filter((c) => {
    const m = c.name.toLowerCase().includes(q.toLowerCase());
    const f =
      filter === "all" ||
      (filter === "attention" && (c.tag === "At risk" || c.tag === "Overdue")) ||
      (filter === "repeat" && (c.tag === "Repeat" || c.tag === "Package"));
    return m && f;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Clients</h1>
          <p className="text-sm text-muted">{clients.length} people · relationship memory, history, reviews &amp; payments in one place</p>
        </div>
        <div className="flex gap-2">
          <Btn variant="secondary" onClick={() => toast("Contact import started")}>Import contacts</Btn>
          <Btn onClick={() => toast("New client form opened")}><Icon.plus className="w-4 h-4" />Add client</Btn>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search clients…" className="inp flex-1 min-w-[200px]" />
        <Segmented<"all" | "attention" | "repeat"> value={filter} onChange={setFilter} size="sm" options={[{ value: "all", label: "All" }, { value: "attention", label: "Needs attention" }, { value: "repeat", label: "Repeat" }]} />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {filtered.map((c) => (
          <button key={c.id} onClick={() => openClient(c)} className="text-left">
            <Card className="!p-4 hover:border-[#d8d8d2] h-full">
              <div className="flex items-start gap-3">
                <Avatar initials={c.initials} color={c.color} size={42} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold truncate">{c.name}</span>
                    <Pill tone={c.tag === "At risk" || c.tag === "Overdue" ? "bad" : c.tag === "New lead" ? "info" : "good"}>{c.tag}</Pill>
                  </div>
                  <div className="text-[12px] text-muted mt-0.5">{c.sessions} sessions · ${c.lifetime.toLocaleString()} lifetime · since {c.since}</div>
                  <div className="text-[12px] text-muted mt-1">{c.nextLabel !== "—" ? <span>Next: <b className="text-ink/80">{c.nextLabel}</b></span> : <span>Last seen {c.lastSeen}</span>}</div>
                </div>
                <ScoreRing score={c.avgScore} size={38} />
              </div>
              {c.balance > 0 && <div className="mt-3 pt-3 border-t border-line"><Pill tone="bad">${c.balance} outstanding</Pill></div>}
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}
