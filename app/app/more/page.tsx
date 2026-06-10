"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Pill, Btn, SectionTitle, cx } from "@/components/ui";
import { Icon, type IconName } from "@/components/icons";
import { useToast } from "@/components/toast";
import { PageIntro } from "@/components/page-intro";

type MoreId =
  | "packages" | "waitlist" | "analytics"
  | "intake" | "followup" | "reminders" | "locations"
  | "integrations" | "automations" | "setup";

interface Item { id: MoreId; name: string; desc: string; icon: IconName }
const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: "Revenue tools",
    items: [
      { id: "packages", name: "Packages", desc: "Bundles & multi-session plans", icon: "services" },
      { id: "waitlist", name: "Waitlist", desc: "Fill cancelled slots automatically", icon: "clients" },
      { id: "analytics", name: "Analytics", desc: "Attendance, revenue & retention", icon: "payments" },
    ],
  },
  {
    title: "Client experience",
    items: [
      { id: "intake", name: "Intake forms", desc: "Collect context before sessions", icon: "services" },
      { id: "followup", name: "Follow-up templates", desc: "Recaps, rebooking, reviews", icon: "invite" },
      { id: "reminders", name: "Reminder templates", desc: "SMS & email reminder copy", icon: "bell" },
      { id: "locations", name: "Locations & travel mode", desc: "On-site, virtual, travel buffers", icon: "calendar" },
    ],
  },
  {
    title: "Connections",
    items: [
      { id: "integrations", name: "Integrations", desc: "Google, Outlook, Stripe, Zoom", icon: "settings" },
      { id: "automations", name: "Automations", desc: "Drafts and reminders in one place", icon: "refresh" },
      { id: "setup", name: "Setup checks", desc: "Make sure you’re ready to book", icon: "check" },
    ],
  },
];

export default function MorePage() {
  const [open, setOpen] = useState<Item | null>(null);
  return (
    <div className="space-y-6">
      <PageIntro id="more" tag="More" title="Your workshop" body="The advanced tools you reach for now and then: packages, waitlist, intake forms, templates, and connections. Anything you use daily lives on the main tabs." />
      <div>
        <h1 className="text-xl font-semibold tracking-tight">More</h1>
        <p className="text-sm text-muted">Advanced tools. Anything you use daily lives on a primary tab. This is the workshop, not the desk.</p>
      </div>
      {GROUPS.map((g) => (
        <div key={g.title}>
          <SectionTitle>{g.title}</SectionTitle>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {g.items.map((it) => {
              const I = Icon[it.icon];
              return (
                <button key={it.id} onClick={() => setOpen(it)} className="text-left">
                  <Card className="!p-4 hover:border-[#d8d8d2] flex items-center gap-3 h-full">
                    <div className="w-9 h-9 rounded-[10px] bg-accentSoft text-accent flex items-center justify-center shrink-0"><I className="w-[18px] h-[18px]" /></div>
                    <div className="flex-1 min-w-0"><div className="text-sm font-medium">{it.name}</div><div className="text-[12px] text-muted truncate">{it.desc}</div></div>
                    <Icon.chevron className="w-4 h-4 text-faint" />
                  </Card>
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {open && <MoreDrawer item={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function MoreDrawer({ item, onClose }: { item: Item; onClose: () => void }) {
  const toast = useToast();
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/25" onClick={onClose} />
      <div className="absolute bg-surface shadow-2xl flex flex-col inset-x-0 bottom-0 rounded-t-[20px] max-h-[92vh] sm:inset-y-0 sm:right-0 sm:left-auto sm:rounded-t-none sm:rounded-l-[20px] w-full sm:w-[460px]">
        <div className="flex items-center justify-between px-5 h-14 border-b border-line shrink-0">
          <span className="font-semibold">{item.name}</span>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-[#F2F2EF] flex items-center justify-center text-muted"><Icon.x className="w-4 h-4" /></button>
        </div>
        <div className="overflow-y-auto p-5 flex-1"><Content item={item} toast={toast} onClose={onClose} /></div>
      </div>
    </div>
  );
}

function Ref({ href, label, onClose }: { href: string; label: string; onClose: () => void }) {
  return (
    <Link href={href} onClick={onClose} className="flex items-center justify-between p-3 rounded-[10px] border border-line hover:bg-[#FAFAF8]">
      <span className="text-[13px] font-medium">{label}</span>
      <Icon.chevron className="w-4 h-4 text-faint" />
    </Link>
  );
}
function Lead({ children }: { children: React.ReactNode }) {
  return <p className="text-[13px] text-muted leading-relaxed mb-4">{children}</p>;
}
function Soon() {
  return <Pill tone="warn">Coming soon</Pill>;
}

function Content({ item, toast, onClose }: { item: Item; toast: (m: string) => void; onClose: () => void }) {
  switch (item.id) {
    case "packages":
      return (
        <div className="space-y-3">
          <Lead>Bundle several sessions so clients commit up front. Packages show up as services clients can book.</Lead>
          {[["Monthly Coaching Package", "4 sessions / month · $640 · $160 deposit"], ["6-Session Bundle", "$960 · save $120 vs single sessions"], ["Intro 3-Pack", "$480 · for new clients"]].map(([n, d]) => (
            <Card key={n} className="!p-3.5"><div className="text-[13px] font-medium">{n}</div><div className="text-[12px] text-muted">{d}</div></Card>
          ))}
          <Ref href="/app/services" label="Manage pricing in Services" onClose={onClose} />
        </div>
      );
    case "waitlist":
      return (
        <div className="space-y-3">
          <Lead>When a session cancels, these clients get first offer for the open slot. This is how empty slots turn back into revenue.</Lead>
          {[["Jordan Lee", "Wants 1:1 Coaching · flexible Tue/Thu"], ["Priya Sharma", "Discovery call · mornings preferred"]].map(([n, d]) => (
            <Card key={n} className="!p-3.5 flex items-center gap-3"><div className="flex-1"><div className="text-[13px] font-medium">{n}</div><div className="text-[12px] text-muted">{d}</div></div><Btn size="sm" variant="secondary" onClick={() => toast(`Offer sent to ${n}`)}>Offer slot</Btn></Card>
          ))}
        </div>
      );
    case "analytics":
      return (
        <div className="space-y-3">
          <Lead>The health of your practice at a glance.</Lead>
          <div className="grid grid-cols-2 gap-2">
            {[["Attendance", "92%"], ["Retention", "78%"], ["Avg / client", "$214"], ["No-show rate", "4%"]].map(([k, v]) => (
              <div key={k} className="bg-[#FAFAF8] border border-line rounded-[10px] p-3"><div className="text-lg font-semibold">{v}</div><div className="text-[11px] text-faint">{k}</div></div>
            ))}
          </div>
          <Ref href="/app/payments" label="Full revenue trends in Payments" onClose={onClose} />
        </div>
      );
    case "intake":
      return (
        <div className="space-y-3">
          <Lead>Collect what you need before a session. A service can require its intake before it’s confirmed.</Lead>
          {[["Default intake", "Name · Goal for our time · What prompted this"], ["Coaching intake", "Current role · Biggest challenge · What success looks like"]].map(([n, d]) => (
            <Card key={n} className="!p-3.5"><div className="text-[13px] font-medium">{n}</div><div className="text-[12px] text-muted">{d}</div></Card>
          ))}
          <Btn size="sm" variant="secondary" onClick={() => toast("Form builder is coming soon")}>New form</Btn>
        </div>
      );
    case "followup":
      return (
        <div className="space-y-3">
          <Lead>The messages drafted for you after a session. You approve them on Today or in the session itself.</Lead>
          {[["Session recap", "“Great work today. Your next step is…”"], ["Review request", "“If the sessions have been useful, a short review…”"], ["Rebooking prompt", "“Want to keep the momentum? I have openings…”"], ["Package renewal", "“Your package wraps at month end…”"]].map(([n, d]) => (
            <Card key={n} className="!p-3.5"><div className="text-[13px] font-medium">{n}</div><div className="text-[12px] text-muted italic">{d}</div></Card>
          ))}
          <Ref href="/app/today" label="See today’s drafts on Today" onClose={onClose} />
        </div>
      );
    case "reminders":
      return (
        <div className="space-y-3">
          <Lead>The reminder copy that goes out before sessions. Toggle which ones send in Settings.</Lead>
          {[["24h SMS", "“Hi {name}, reminder: your session is tomorrow at {time}.”"], ["2h SMS", "“See you soon — {time} today. Reply C to confirm.”"], ["Email confirmation", "“You’re booked for {service} on {date}.”"]].map(([n, d]) => (
            <Card key={n} className="!p-3.5"><div className="text-[13px] font-medium">{n}</div><div className="text-[12px] text-muted">{d}</div></Card>
          ))}
          <Ref href="/app/settings" label="Turn reminders on/off in Settings" onClose={onClose} />
        </div>
      );
    case "locations":
      return (
        <div className="space-y-3">
          <Lead>Every appointment is on-site, virtual, or by phone. For on-site, Sessionly holds the address.</Lead>
          {[["On-site", "An address, with one-tap directions from any session."], ["Virtual", "A video link (Zoom, Meet)."], ["Phone", "A number to call."]].map(([n, d]) => (
            <Card key={n} className="!p-3.5"><div className="text-[13px] font-medium">{n}</div><div className="text-[12px] text-muted">{d}</div></Card>
          ))}
          <div className="flex items-center gap-2 pt-1"><Soon /><span className="text-[12px] text-muted">Travel-aware scheduling & buffers</span></div>
        </div>
      );
    case "integrations":
      return (
        <div className="space-y-2">
          <Lead>Connect the tools you already use.</Lead>
          {["Google Calendar", "Outlook", "Stripe", "Zoom"].map((n) => (
            <div key={n} className="flex items-center justify-between p-3 rounded-[10px] border border-line"><span className="text-[13px] font-medium">{n}</span><Soon /></div>
          ))}
          <div className="pt-1"><Ref href="/app/settings" label="Calendar status lives in Settings" onClose={onClose} /></div>
        </div>
      );
    case "automations":
      return (
        <div className="space-y-3">
          <Lead>Sessionly drafts your busywork — the morning briefing, follow-ups, reminders, and payment nudges. You approve, it sends. Nothing goes out without you.</Lead>
          {[["Daily briefing", "What needs you, every morning"], ["Follow-ups", "Recap / review / rebook after a session"], ["Payment nudges", "Gentle reminders on what’s owed"]].map(([n, d]) => (
            <Card key={n} className="!p-3.5"><div className="text-[13px] font-medium">{n}</div><div className="text-[12px] text-muted">{d}</div></Card>
          ))}
          <Ref href="/app/today" label="See them working on Today" onClose={onClose} />
        </div>
      );
    case "setup":
      return (
        <div className="space-y-2">
          <Lead>A quick check that you’re ready to take bookings.</Lead>
          {[["Add your business details", "/app/settings", true], ["Create a service", "/app/services", true], ["Add a client", "/app/clients", true], ["Connect a calendar", "", false], ["Set a deposit policy", "/app/settings", false]].map(([label, href, done]) => (
            <div key={label as string} className="flex items-center gap-3 p-3 rounded-[10px] border border-line">
              <span className={cx("w-5 h-5 rounded-full flex items-center justify-center shrink-0", done ? "bg-goodSoft text-good" : "border border-line text-faint")}>{done ? <Icon.check className="w-3 h-3" /> : ""}</span>
              <span className="text-[13px] flex-1">{label}</span>
              {href ? <Link href={href as string} onClick={onClose} className="text-[12px] text-accent font-medium">Go</Link> : <Soon />}
            </div>
          ))}
        </div>
      );
  }
}
