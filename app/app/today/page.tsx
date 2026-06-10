"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar, Btn, Card, Pill, ScoreRing, SectionTitle, cx } from "@/components/ui";
import { HostAvatar } from "@/components/profile";
import { Icon, type IconName } from "@/components/icons";
import { useOverlays } from "@/components/overlays";
import { useToast } from "@/components/toast";
import { HOST, getSessionsForDay, getSessions, getClient, NEEDS_ATTENTION, OUTSTANDING, FOLLOWUPS, TODAY } from "@/lib/mock-data";
import { fmtDay, to12 } from "@/lib/format";

const attnIcon: Record<string, IconName> = { risk: "risk", money: "payments", slot: "calendar", intake: "services" };

/** Shape returned by POST /api/briefing. */
interface Briefing {
  paragraphs: string[];
  actions: string[];
  source: "ai" | "template";
  model?: string;
}

const DEFAULT_PARAS = [
  "Good morning, Minh. You have three sessions today. They're all set except one thing. Priya's intake isn't done before her 1:00 discovery call, so I drafted a resend for you.",
  "Tomorrow's 9:00 with John Davies is your main worry. No deposit, intake incomplete, and two past cancellations. I'd ask for a deposit and a confirmation before it runs.",
  "On the money side, David Thompson is six days overdue at $180, and I've drafted a gentle reminder. You also have a 2:00 PM gap tomorrow from a cancellation, and two waitlist clients would fit it nicely.",
];
const DEFAULT_ACTIONS = ["Resend Priya's intake", "Protect John's session", "Send David a reminder"];

export default function TodayPage() {
  const { openInvite, openSession } = useOverlays();
  const toast = useToast();
  const today = getSessionsForDay(TODAY);
  const next = today[0];
  const upcoming = getSessions().filter((s) => s.day > TODAY);

  // AI Daily Briefing
  const [brief, setBrief] = useState<Briefing | null>(null);
  const [bLoading, setBLoading] = useState(false);
  const [bErr, setBErr] = useState<string | null>(null);
  const paragraphs = brief?.paragraphs ?? DEFAULT_PARAS;
  const actions = brief?.actions ?? DEFAULT_ACTIONS;

  async function generateBriefing() {
    setBLoading(true);
    setBErr(null);
    try {
      const res = await fetch("/api/briefing", { method: "POST" });
      const data = await res.json();
      if (!res.ok || data.error) setBErr(data.error || "Briefing failed.");
      else setBrief(data as Briefing);
    } catch {
      setBErr("Could not reach the briefing agent.");
    } finally {
      setBLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Greeting + quick actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <HostAvatar size={48} />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Hi, {HOST.firstName}</h1>
            <p className="text-sm text-muted">Tuesday, June 9 · 3 sessions today · 92% attendance this month</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/app/services"><Btn variant="secondary"><Icon.plus className="w-4 h-4" />Create Service</Btn></Link>
          <Btn onClick={() => openInvite()}><Icon.invite className="w-4 h-4" />Send Smart Invite</Btn>
        </div>
      </div>

      {/* Week snapshot */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { k: "Sessions this week", v: "12", s: "+3 vs last week", tone: "good" },
          { k: "Booked revenue", v: "$2,380", s: "+11% vs last week", tone: "good" },
          { k: "Needs attention", v: "4", s: "1 high-risk session", tone: "warn" },
          { k: "Attendance rate", v: "92%", s: "Last 30 days", tone: "neutral" },
        ].map((m) => (
          <Card key={m.k} className="!p-4">
            <div className="text-[12px] text-faint font-medium">{m.k}</div>
            <div className="text-[22px] font-semibold mt-1 tracking-tight">{m.v}</div>
            <div className={cx("text-[11px] mt-0.5", m.tone === "good" ? "text-good" : m.tone === "warn" ? "text-warn" : "text-faint")}>{m.s}</div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* AI Daily Briefing */}
          <Card className="!p-0 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-line flex items-center justify-between gap-2">
              <span className="font-semibold text-sm">Daily Briefing</span>
              <div className="flex items-center gap-2">
                <Pill tone="info">Draft · you approve</Pill>
                <Btn size="sm" variant="secondary" onClick={generateBriefing}>
                  <Icon.refresh className="w-4 h-4" />{bLoading ? "Updating…" : brief ? "Refresh" : "Update"}
                </Btn>
              </div>
            </div>
            <div className="p-5 text-[14px] leading-relaxed text-ink/90 space-y-2.5">
              {bErr && <p className="text-[13px] text-bad">{bErr}</p>}
              {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
            </div>
            <div className="px-5 py-3 bg-[#FAFAF8] border-t border-line flex flex-wrap gap-2">
              {actions.map((a, i) => <Btn key={i} size="sm" variant="secondary" onClick={() => toast(a)}>{a}</Btn>)}
            </div>
          </Card>

          {/* Next session */}
          {next && (
            <div>
              <SectionTitle info="Your very next appointment, with its readiness score and confirmation, deposit, and intake status at a glance.">Next session</SectionTitle>
              <Card className="!p-0 overflow-hidden hover:border-[#d8d8d2]">
                <button onClick={() => openSession(next)} className="w-full text-left">
                  <div className="p-5 flex items-center gap-4">
                    <div className="text-center shrink-0 w-14"><div className="text-[11px] text-faint font-medium">10:30</div><div className="text-[11px] text-faint">AM</div></div>
                    <div className="w-1 self-stretch rounded-full" style={{ background: next.service.color }} />
                    <Avatar initials={next.client.initials} color={next.client.color} photo={next.client.photo} size={42} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold">{next.client.name}</div>
                      <div className="text-[13px] text-muted">{next.service.name} · 60 min · {next.location}</div>
                      <div className="flex gap-1.5 mt-1.5"><Pill tone="good"><Icon.check className="w-3 h-3" />Confirmed</Pill><Pill tone="good">Deposit paid</Pill><Pill tone="good">Intake done</Pill></div>
                    </div>
                    <div className="flex flex-col items-center gap-1"><ScoreRing score={next.score} size={48} /><span className="text-[10px] text-faint font-medium">Session Score</span></div>
                  </div>
                </button>
              </Card>
            </div>
          )}

          {/* Upcoming */}
          <div>
            <SectionTitle info="The rest of your booked sessions, soonest first. Tap any one to see its full detail." action={<Link href="/app/calendar" className="text-[13px] text-accent font-medium flex items-center gap-0.5">Calendar<Icon.chevron className="w-3.5 h-3.5" /></Link>}>Upcoming sessions</SectionTitle>
            <div className="space-y-2">
              {today.slice(1).concat(upcoming.slice(0, 2)).map((s) => (
                <button key={s.id} onClick={() => openSession(s)} className="w-full">
                  <Card className="!p-3.5 flex items-center gap-3.5 hover:border-[#d8d8d2] text-left">
                    <div className="text-center shrink-0 w-12"><div className="text-[11px] font-medium">{fmtDay(s.day)}</div><div className="text-[11px] text-faint">{to12(s.start)}</div></div>
                    <div className="w-1 self-stretch rounded-full" style={{ background: s.service.color }} />
                    <Avatar initials={s.client.initials} color={s.client.color} photo={s.client.photo} size={34} />
                    <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{s.client.name}</div><div className="text-[12px] text-muted truncate">{s.service.name}</div></div>
                    {!s.confirmed && <Pill tone="warn">Unconfirmed</Pill>}
                    <ScoreRing score={s.score} size={34} />
                  </Card>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right rail */}
        <div className="space-y-6">
          <div>
            <SectionTitle info="Things worth handling today: at-risk sessions, overdue invoices, open slots, and missing intakes. Each one explains why.">Needs attention</SectionTitle>
            <div className="space-y-2">
              {NEEDS_ATTENTION.map((n) => {
                const I = Icon[attnIcon[n.icon]];
                const tone = n.icon === "money" ? "warn" : n.icon === "risk" ? "bad" : n.icon === "slot" ? "info" : "warn";
                return (
                  <Card key={n.id} className="!p-3.5">
                    <div className="flex gap-3">
                      <div className={cx("w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0", tone === "bad" ? "bg-badSoft text-bad" : tone === "warn" ? "bg-warnSoft text-warn" : "bg-accentSoft text-accent")}><I className="w-[18px] h-[18px]" /></div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-medium leading-snug">{n.title}</div>
                        <ul className="mt-1 space-y-0.5">{n.why.map((w, i) => <li key={i} className="text-[12px] text-muted flex gap-1.5"><span className="text-faint">·</span>{w}</li>)}</ul>
                        <div className="flex flex-wrap gap-1.5 mt-2">{n.actions.map((a) => <Btn key={a} size="sm" variant="secondary" onClick={() => toast(a)}>{a}</Btn>)}</div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          <div>
            <SectionTitle info="Money owed to you right now: overdue invoices and deposits not yet paid. Send a reminder in a tap." action={<Link href="/app/payments" className="text-[13px] text-accent font-medium">View all</Link>}>Payments due</SectionTitle>
            <Card className="!p-0 divide-y divide-line">
              {OUTSTANDING.map((p, i) => (
                <div key={i} className="p-3.5 flex items-center gap-3">
                  <div className="flex-1 min-w-0"><div className="text-[13px] font-medium">{p.client}</div><div className="text-[12px] text-muted">{p.what} · {p.age}</div></div>
                  <div className="text-right"><div className="text-sm font-semibold">${p.amt}</div><Pill tone={p.status === "Overdue" ? "bad" : "warn"}>{p.status}</Pill></div>
                </div>
              ))}
              <div className="p-2.5"><Btn size="sm" variant="ghost" className="w-full" onClick={() => toast("Reminders sent to 2 clients")}>Send reminders</Btn></div>
            </Card>
          </div>

          <div>
            <SectionTitle info="After a session, a recap, review request, or rebooking is drafted for you. Review it, then approve to send." action={<Link href="/app/more" className="text-[13px] text-accent font-medium">Templates</Link>}>Follow-ups</SectionTitle>
            <div className="space-y-2">
              {FOLLOWUPS.filter((f) => f.due === "Today").map((f) => {
                const c = getClient(f.clientId)!;
                return (
                  <Card key={f.id} className="!p-3.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar initials={c.initials} color={c.color} photo={c.photo} size={30} />
                      <div className="flex-1 min-w-0"><div className="text-[13px] font-medium">{c.name}</div><div className="text-[12px] text-muted">{f.kind}</div></div>
                      <Pill tone="info">Drafted</Pill>
                    </div>
                    <div className="flex gap-1.5 mt-2.5"><Btn size="sm" variant="secondary" className="flex-1" onClick={() => toast(`Opening draft for ${c.name}`)}>Review draft</Btn><Btn size="sm" className="flex-1" onClick={() => toast(`Sent to ${c.name}`)}>Approve &amp; send</Btn></div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
