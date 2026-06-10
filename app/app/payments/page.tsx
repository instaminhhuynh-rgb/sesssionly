"use client";

import { useState } from "react";
import { Btn, Card, Pill, SectionTitle, cx } from "@/components/ui";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/toast";
import { OUTSTANDING, DEPOSITS_HELD, RECENT_PAID, REVENUE_WEEKS, WEEK_LABELS } from "@/lib/mock-data";

interface ReminderDraft {
  client: string;
  subject: string | null;
  body: string;
  tone: "gentle" | "firm";
  source: "ai" | "template";
  model?: string;
}

export default function PaymentsPage() {
  const toast = useToast();
  const max = Math.max(...REVENUE_WEEKS);
  const [drafts, setDrafts] = useState<ReminderDraft[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function draftReminders() {
    setLoading(true);
    setErr(null);
    try {
      const results = await Promise.all(
        OUTSTANDING.map(async (p) => {
          const res = await fetch("/api/payment-reminder", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ client: p.client, what: p.what, amount: p.amt, status: p.status, age: p.age }),
          });
          const data = await res.json();
          return { client: p.client, ...data } as ReminderDraft;
        }),
      );
      setDrafts(results);
    } catch {
      setErr("Could not reach the payments agent.");
    } finally {
      setLoading(false);
    }
  }

  function updateDraft(i: number, patch: Partial<ReminderDraft>) {
    setDrafts((d) => (d ? d.map((x, idx) => (idx === i ? { ...x, ...patch } : x)) : d));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Payments</h1>
          <p className="text-sm text-muted">Get paid: outstanding balances, deposits held, paid invoices, and revenue trends.</p>
        </div>
        <div className="flex gap-2">
          <Btn variant="secondary" onClick={() => toast("Exported to CSV")}>Export</Btn>
          <Btn onClick={() => toast("Payment recorded")}>Record payment</Btn>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([["Outstanding", "$230", "2 invoices", "warn"], ["Deposits held", "$210", "Applied at session", "neutral"], ["Collected this month", "$2,140", "+11% MoM", "good"], ["Avg / session", "$214", "Last 30 days", "neutral"]] as const).map(([k, v, s, t]) => (
          <Card key={k} className="!p-4"><div className="text-[12px] text-faint font-medium">{k}</div><div className="text-[22px] font-semibold mt-1 tracking-tight">{v}</div><div className={cx("text-[11px] mt-0.5", t === "good" ? "text-good" : t === "warn" ? "text-warn" : "text-faint")}>{s}</div></Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <SectionTitle>Revenue trend · weekly</SectionTitle>
          <div className="flex items-end gap-2 h-40 mt-2">
            {REVENUE_WEEKS.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="text-[10px] text-faint font-medium">${(v / 1000).toFixed(1)}k</div>
                <div className="w-full rounded-t-[6px] transition-all" style={{ height: `${(v / max) * 100}%`, background: i === REVENUE_WEEKS.length - 1 ? "#3E5C76" : "#C7D2DC" }} />
                <div className="text-[10px] text-faint">{WEEK_LABELS[i].split(" ")[1]}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="!p-0">
          <div className="px-4 py-3 border-b border-line"><span className="text-[13px] font-semibold">Outstanding</span></div>
          <div className="divide-y divide-line">
            {OUTSTANDING.map((p, i) => (
              <div key={i} className="p-3.5 flex items-center gap-3"><div className="flex-1 min-w-0"><div className="text-[13px] font-medium">{p.client}</div><div className="text-[12px] text-muted">{p.what}</div></div><div className="text-right"><div className="text-sm font-semibold">${p.amt}</div><Pill tone={p.status === "Overdue" ? "bad" : "warn"}>{p.status}</Pill></div></div>
            ))}
          </div>
          <div className="p-2.5"><Btn size="sm" variant="ghost" className="w-full" onClick={draftReminders}><Icon.spark className="w-4 h-4" />{loading ? "Drafting…" : "Draft reminders"}</Btn></div>
        </Card>
      </div>

      {err && <p className="text-[13px] text-bad">{err}</p>}

      {drafts && (
        <div>
          <SectionTitle action={<button onClick={() => setDrafts(null)} className="text-[13px] text-accent font-medium">Dismiss</button>}>Drafted reminders · you approve</SectionTitle>
          <div className="grid sm:grid-cols-2 gap-3">
            {drafts.map((d, i) => (
              <Card key={i} className="!p-3.5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[13px] font-semibold flex-1">{d.client}</span>
                  <Pill tone={d.tone === "firm" ? "warn" : "info"}>{d.tone}</Pill>
                </div>
                {d.subject !== null && (
                  <input value={d.subject} onChange={(e) => updateDraft(i, { subject: e.target.value })} className="inp mb-2 !text-[13px] font-medium" />
                )}
                <textarea value={d.body} onChange={(e) => updateDraft(i, { body: e.target.value })} rows={5} className="inp !text-[13px] leading-relaxed resize-none" />
                <div className="flex gap-1.5 mt-2.5">
                  <Btn size="sm" variant="secondary" className="flex-1" onClick={() => draftReminders()}>Regenerate</Btn>
                  <Btn size="sm" className="flex-1" onClick={() => toast(`Reminder sent to ${d.client}`)}>Approve &amp; send</Btn>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <SectionTitle>Deposits held</SectionTitle>
          <Card className="!p-0 divide-y divide-line">
            {DEPOSITS_HELD.map((p, i) => (
              <div key={i} className="p-3.5 flex items-center justify-between"><div><div className="text-[13px] font-medium">{p.client}</div><div className="text-[12px] text-muted">{p.what}</div></div><span className="text-sm font-semibold">${p.amt}</span></div>
            ))}
          </Card>
        </div>
        <div>
          <SectionTitle>Recently paid</SectionTitle>
          <Card className="!p-0 divide-y divide-line">
            {RECENT_PAID.map((p, i) => (
              <div key={i} className="p-3.5 flex items-center justify-between"><div><div className="text-[13px] font-medium">{p.client}</div><div className="text-[12px] text-muted">{p.what} · {p.d}</div></div><div className="flex items-center gap-2"><span className="text-sm font-semibold">${p.amt}</span><Pill tone="good"><Icon.check className="w-3 h-3" />Paid</Pill></div></div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
