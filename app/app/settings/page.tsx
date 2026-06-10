"use client";

import { useState } from "react";
import { Avatar, Btn, Card, Pill, SectionTitle, Segmented, Toggle, cx } from "@/components/ui";
import { Icon } from "@/components/icons";
import { HOST } from "@/lib/mock-data";

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <SectionTitle>{title}</SectionTitle>
      <Card className="space-y-4">{children}</Card>
    </div>
  );
}
function Row({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0"><div className="text-[14px] font-medium">{label}</div>{desc && <div className="text-[12px] text-muted">{desc}</div>}</div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const [theme, setTheme] = useState("calm");
  const [font, setFont] = useState("default");
  const [layout, setLayout] = useState("focus");
  const [cancelWin, setCancelWin] = useState("24");
  const [t, setT] = useState({ sms: true, email: true, push: false, deposit: true, autoReminder: true, reduceMotion: false });
  const tog = (k: keyof typeof t) => setT((o) => ({ ...o, [k]: !o[k] }));

  return (
    <div className="space-y-6 max-w-[760px]">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted">Appearance, calendar health, notifications, payments &amp; privacy.</p>
      </div>

      <Group title="Profile">
        <div className="flex items-center gap-3.5">
          <Avatar initials={HOST.initials} size={52} />
          <div className="flex-1"><div className="font-medium">{HOST.firstName} {HOST.lastName}</div><div className="text-[13px] text-muted">{HOST.role} · sessionly.com/{HOST.slug}</div></div>
          <Btn size="sm" variant="secondary">Edit</Btn>
        </div>
      </Group>

      <Group title="Style Studio">
        <Row label="Theme" desc="Calm Professional is the default look."><Segmented size="sm" value={theme} onChange={setTheme} options={[{ value: "calm", label: "Calm" }, { value: "light", label: "Light" }, { value: "mono", label: "Mono" }]} /></Row>
        <Row label="Font size" desc="Affects density across the app."><Segmented size="sm" value={font} onChange={setFont} options={[{ value: "compact", label: "S" }, { value: "default", label: "M" }, { value: "large", label: "L" }]} /></Row>
      </Group>

      <Group title="Dashboard layout">
        <p className="text-[13px] text-muted">Choose how Today is arranged.</p>
        <div className="grid sm:grid-cols-3 gap-2">
          {[["focus", "Focus Day", "Sessions first"], ["revenue", "Revenue First", "Payments first"], ["care", "Client Care", "Follow-ups first"]].map(([v, n, d]) => (
            <button key={v} onClick={() => setLayout(v)} className={cx("text-left p-3 rounded-[10px] border", layout === v ? "border-accent bg-accentSoft" : "border-line hover:bg-[#FAFAF8]")}>
              <div className="text-[13px] font-medium">{n}</div><div className="text-[11px] text-muted">{d}</div>
            </button>
          ))}
        </div>
      </Group>

      <Group title="Calendar Health">
        <div className="space-y-2.5">
          {[["Google Calendar", "Connected · synced 4 min ago", "good"], ["Outlook", "Connected · synced 1 hr ago", "good"], ["Apple Calendar", "Not connected", "neutral"]].map(([n, s, tone]) => (
            <div key={n} className="flex items-center gap-3">
              <span className={cx("w-2 h-2 rounded-full", tone === "good" ? "bg-good" : "bg-[#C9C9C4]")} />
              <div className="flex-1"><div className="text-[13px] font-medium">{n}</div><div className="text-[12px] text-muted">{s}</div></div>
              <Btn size="sm" variant="secondary">{tone === "good" ? "Manage" : "Connect"}</Btn>
            </div>
          ))}
          <div className="mt-2 p-3 rounded-[10px] bg-goodSoft border border-[#C9EBD4] flex items-center gap-2.5">
            <Icon.check className="w-4 h-4 text-good" /><span className="text-[13px] text-good font-medium">Safe to share — no conflicts detected, permissions OK.</span>
          </div>
        </div>
      </Group>

      <Group title="Notifications">
        {([["sms", "SMS reminders", "Sent to clients before sessions"], ["email", "Email confirmations", ""], ["push", "Push notifications", "Browser & mobile"], ["autoReminder", "Auto follow-up reminders", ""]] as const).map(([k, n, d]) => (
          <Row key={k} label={n} desc={d}><Toggle on={t[k]} onClick={() => tog(k)} /></Row>
        ))}
      </Group>

      <Group title="Payment defaults">
        <Row label="Require deposit by default" desc="New paid services start with a deposit."><Toggle on={t.deposit} onClick={() => tog("deposit")} /></Row>
        <Row label="Default cancellation window"><Segmented size="sm" value={cancelWin} onChange={setCancelWin} options={[{ value: "12", label: "12h" }, { value: "24", label: "24h" }, { value: "48", label: "48h" }]} /></Row>
      </Group>

      <Group title="Privacy & accessibility">
        <Row label="Reduce motion"><Toggle on={t.reduceMotion} onClick={() => tog("reduceMotion")} /></Row>
        <Row label="Session Score visibility" desc="Host-only for now. Clients never see scores."><Pill tone="info">Host-only</Pill></Row>
        <Row label="Export my data"><Btn size="sm" variant="secondary">Request export</Btn></Row>
      </Group>
    </div>
  );
}
