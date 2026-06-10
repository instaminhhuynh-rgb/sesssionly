"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, Btn, cx } from "../ui";
import { Icon, type IconName } from "../icons";
import { OverlayProvider, useOverlays } from "../overlays";
import { ToastProvider } from "../toast";
import { GuideProvider, useGuide } from "../guide";
import { HOST } from "@/lib/mock-data";

const NAV: { key: string; label: string; href: string; icon: IconName }[] = [
  { key: "today", label: "Today", href: "/app/today", icon: "today" },
  { key: "clients", label: "Clients", href: "/app/clients", icon: "clients" },
  { key: "calendar", label: "Calendar", href: "/app/calendar", icon: "calendar" },
  { key: "services", label: "Services", href: "/app/services", icon: "services" },
  { key: "payments", label: "Payments", href: "/app/payments", icon: "payments" },
  { key: "more", label: "More", href: "/app/more", icon: "more" },
  { key: "settings", label: "Settings", href: "/app/settings", icon: "settings" },
];
const MOBILE = ["today", "clients", "calendar", "payments", "more"];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <OverlayProvider>
        <GuideProvider>
          <Shell>{children}</Shell>
        </GuideProvider>
      </OverlayProvider>
    </ToastProvider>
  );
}

function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-[8px] bg-ink flex items-center justify-center">
        <div className="w-3 h-3 rounded-full border-2 border-white" />
      </div>
      <span className="font-semibold tracking-tight">Sessionly</span>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { openInvite } = useOverlays();
  const openGuide = useGuide();
  const active = (href: string) => pathname?.startsWith(href);
  const current = NAV.find((n) => active(n.href));

  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-line bg-surface h-screen sticky top-0">
        <div className="px-5 h-16 flex items-center border-b border-line"><Wordmark /></div>
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map((n) => {
            const I = Icon[n.icon];
            return (
              <Link key={n.key} href={n.href} className={cx("w-full flex items-center gap-3 px-3 h-9 rounded-[9px] text-sm font-medium transition-colors", active(n.href) ? "bg-accentSoft text-accent" : "text-muted hover:bg-[#F5F5F2] hover:text-ink")}>
                <I className="w-[18px] h-[18px]" /> {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-line">
          <Link href="/app/settings" className="w-full flex items-center gap-2.5 px-2 py-2 rounded-[10px] hover:bg-[#F5F5F2]">
            <Avatar initials={HOST.initials} size={32} />
            <div className="text-left leading-tight">
              <div className="text-sm font-medium">{HOST.firstName} {HOST.lastName}</div>
              <div className="text-[11px] text-faint">{HOST.business}</div>
            </div>
          </Link>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 bg-canvas/85 backdrop-blur border-b border-line">
          <div className="h-14 lg:h-16 px-4 sm:px-6 flex items-center justify-between gap-3">
            <div className="lg:hidden"><Wordmark /></div>
            <div className="hidden lg:block text-[15px] font-semibold">{current?.label}</div>
            <div className="flex items-center gap-2">
              <button onClick={openGuide} title="Take the tour" className="w-9 h-9 rounded-[10px] border border-line bg-surface flex items-center justify-center text-muted hover:text-ink">
                <Icon.help className="w-[18px] h-[18px]" />
              </button>
              <button className="w-9 h-9 rounded-[10px] border border-line bg-surface flex items-center justify-center text-muted hover:text-ink relative">
                <Icon.bell className="w-[18px] h-[18px]" />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-bad" />
              </button>
              <span className="hidden sm:inline-flex"><Btn size="sm" onClick={() => openInvite()}><Icon.invite className="w-4 h-4" />Smart Invite</Btn></span>
              <Link href="/app/settings" className="lg:hidden"><Avatar initials={HOST.initials} size={32} /></Link>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 py-5 sm:py-6 pb-24 lg:pb-10 max-w-app w-full mx-auto">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-surface/95 backdrop-blur border-t border-line">
        <div className="grid grid-cols-5">
          {MOBILE.map((k) => {
            const n = NAV.find((x) => x.key === k)!;
            const I = Icon[n.icon];
            return (
              <Link key={k} href={n.href} className={cx("flex flex-col items-center gap-1 py-2.5", active(n.href) ? "text-accent" : "text-faint")}>
                <I className="w-[22px] h-[22px]" />
                <span className="text-[10px] font-medium">{n.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <button onClick={() => openInvite()} className="sm:hidden fixed right-4 bottom-20 z-30 w-14 h-14 rounded-full bg-ink text-white shadow-lg flex items-center justify-center">
        <Icon.invite className="w-6 h-6" />
      </button>
    </div>
  );
}
