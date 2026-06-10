"use client";

import { Card, SectionTitle } from "@/components/ui";
import { Icon, type IconName } from "@/components/icons";

const GROUPS: { title: string; items: { name: string; desc: string; icon: IconName }[] }[] = [
  {
    title: "Revenue tools",
    items: [
      { name: "Packages", desc: "Bundles & multi-session plans", icon: "services" },
      { name: "Waitlist", desc: "Fill cancelled slots automatically", icon: "clients" },
      { name: "Analytics", desc: "Attendance, revenue & retention", icon: "payments" },
    ],
  },
  {
    title: "Client experience",
    items: [
      { name: "Intake forms", desc: "Collect context before sessions", icon: "services" },
      { name: "Follow-up templates", desc: "Recaps, rebooking, reviews", icon: "invite" },
      { name: "Reminder templates", desc: "SMS & email reminder copy", icon: "bell" },
      { name: "Locations & travel mode", desc: "On-site, virtual, travel buffers", icon: "calendar" },
    ],
  },
  {
    title: "Connections",
    items: [
      { name: "Integrations", desc: "Google, Outlook, Stripe, Zoom", icon: "settings" },
      { name: "Automations", desc: "Drafts and reminders in one place", icon: "refresh" },
      { name: "Setup checks", desc: "Make sure you’re ready to book", icon: "check" },
    ],
  },
];

export default function MorePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">More</h1>
        <p className="text-sm text-muted">Advanced tools. Anything you use daily lives on a primary tab — this is the workshop, not the desk.</p>
      </div>
      {GROUPS.map((g) => (
        <div key={g.title}>
          <SectionTitle>{g.title}</SectionTitle>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {g.items.map((it) => {
              const I = Icon[it.icon];
              return (
                <button key={it.name} className="text-left">
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
    </div>
  );
}
